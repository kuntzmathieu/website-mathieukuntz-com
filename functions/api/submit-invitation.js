import { nocodbGet, nocodbPost, nocodbPatch, jsonResponse, errorResponse } from './_lib.js';
import { generateTicketPDF } from './_pdf.js';
import { sendTicketEmail } from './_email.js';

const INVITATIONS_TABLE = 'm98ogwuxup4lo22';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const code = String(body.code || '').trim().toUpperCase();
    const email = String(body.email || '').trim().toLowerCase();
    const codePostal = String(body.code_postal || '').trim();

    if (!code) return errorResponse('Code invitation manquant', 400);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse('Email manquant ou invalide', 400);
    }

    const invTable = env.NOCODB_TABLE_INVITATIONS || INVITATIONS_TABLE;
    const data = await nocodbGet(env, invTable, {
      where: `(code,eq,${code})`,
      limit: 1,
    });
    const invitation = (data.list || [])[0];
    if (!invitation) return errorResponse('Code invitation invalide', 404);

    const invitationId = `INVITATION-${code}`;
    const existing = await nocodbGet(env, env.NOCODB_TABLE_COMMANDES, {
      where: `(stripe_session_id,eq,${invitationId})`,
    });
    if (existing.list && existing.list.length > 0) {
      return jsonResponse({
        success: true,
        already_exists: true,
        commande_id: existing.list[0].Id,
        message: 'Cette invitation a déjà été enregistrée.',
      });
    }

    if (invitation.utilise) {
      return errorResponse('Ce code invitation a déjà été utilisé.', 409);
    }

    const prenom = String(invitation.prenom || '').trim();
    const nom = String(invitation.nom || '').trim();
    const anneeNaissance = Number(invitation.annee_naissance);
    if (!prenom || !nom || !Number.isInteger(anneeNaissance)) {
      return errorResponse('Invitation incomplète dans la base. Contactez-nous.', 500);
    }

    // Réserve le code avant de créer la commande, pour éviter un double usage.
    await nocodbPatch(env, invTable, invitation.Id, {
      utilise: true,
      date_utilisation: new Date().toISOString(),
    });

    let commandeId = null;
    let billetId = null;
    let numeroBillet = null;
    let emailEnvoye = false;
    let emailError = null;

    try {
      const commande = await nocodbPost(env, env.NOCODB_TABLE_COMMANDES, {
        stripe_session_id: invitationId,
        email_commande: email,
        date_commande: new Date().toISOString(),
        montant_avant_remise: 0,
        montant_total: 0,
        nb_plein_tarif: 0,
        nb_tarif_reduit: 0,
        nb_invitation: 1,
        nb_custom: 0,
        paiement: 'invitation',
        canal_vente: 'en ligne',
        code_promo_utilise: code,
      });
      commandeId = commande.Id;

      // Deuxième contrôle : en cas de course, seule la première commande continue.
      const concurrent = await nocodbGet(env, env.NOCODB_TABLE_COMMANDES, {
        where: `(stripe_session_id,eq,${invitationId})`,
      });
      const commandes = (concurrent.list || []).slice().sort((a, b) => a.Id - b.Id);
      if (commandes.length > 1 && commandes[0].Id !== commandeId) {
        await nocodbPatch(env, invTable, invitation.Id, {
          utilise: false,
          date_utilisation: null,
        }).catch(() => {});
        return errorResponse('Cette invitation vient d’être utilisée par une autre demande', 409);
      }

      const billet = await nocodbPost(env, env.NOCODB_TABLE_BILLETS, {
        numero_billet: 'temp',
        type: 'invitation',
        prix_paye: 0,
        nom,
        prenom,
        annee_naissance: anneeNaissance,
        code_postal: codePostal,
        email_personne: email,
        date_achat: new Date().toISOString(),
        checkin: false,
        email_envoye: false,
        commande: commandeId,
      });
      billetId = billet.Id;
      numeroBillet = `PRINCE101226GE-${String(billet.Id).padStart(4, '0')}`;
      await nocodbPatch(env, env.NOCODB_TABLE_BILLETS, billet.Id, { numero_billet: numeroBillet });

      await nocodbPatch(env, invTable, invitation.Id, {
        utilise: true,
        date_utilisation: new Date().toISOString(),
        commande_id: commandeId,
        billet_id: billet.Id,
        email_utilisee: email,
      });

      const billetComplet = {
        Id: billet.Id,
        numero_billet: numeroBillet,
        type: 'invitation',
        prix_paye: 0,
        prix_avant: 0,
        nom,
        prenom,
        annee_naissance: anneeNaissance,
        code_postal: codePostal,
        email_personne: email,
        code_promo: code,
      };

      try {
        if (!env.RESEND_API_KEY) throw new Error('RESEND_API_KEY non configuré');
        const pdfBase64 = await generateTicketPDF(billetComplet);
        await sendTicketEmail(env, email, billetComplet, pdfBase64);
        await nocodbPatch(env, env.NOCODB_TABLE_BILLETS, billet.Id, { email_envoye: true });
        emailEnvoye = true;
      } catch (e) {
        emailError = e.message;
      }
    } catch (err) {
      if (commandeId === null) {
        await nocodbPatch(env, invTable, invitation.Id, {
          utilise: false,
          date_utilisation: null,
        }).catch(() => {});
      }
      throw err;
    }

    return jsonResponse({
      success: true,
      commande_id: commandeId,
      billet_id: billetId,
      numero_billet: numeroBillet,
      email_envoye: emailEnvoye,
      email_error: emailError,
    });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
