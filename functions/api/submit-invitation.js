import { nocodbGet, nocodbPost, nocodbPatch, jsonResponse, errorResponse } from './_lib.js';
import { generateTicketPDF } from './_pdf.js';
import { sendTicketEmail } from './_email.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const code = String(body.code || '').trim().toUpperCase();
    const prenom = String(body.prenom || '').trim();
    const nom = String(body.nom || '').trim();
    const anneeNaissance = Number(body.annee_naissance);
    const email = String(body.email || '').trim().toLowerCase();
    const codePostal = String(body.code_postal || '').trim();

    if (!code || !prenom || !nom || !body.annee_naissance) {
      return errorResponse('Code, prénom, nom et année de naissance sont obligatoires', 400);
    }
    if (!Number.isInteger(anneeNaissance) || anneeNaissance < 1900 || anneeNaissance > new Date().getFullYear()) {
      return errorResponse('Année de naissance invalide', 400);
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse('Email manquant ou invalide', 400);
    }

    const promoData = await nocodbGet(env, env.NOCODB_TABLE_PROMO, {
      where: `(code,eq,${code})`,
      limit: 1,
    });
    const promo = (promoData.list || [])[0];
    if (!promo) return errorResponse('Code invitation invalide', 404);
    if (!promo.actif) return errorResponse('Code invitation inactif', 400);
    if (promo.type_reduction !== 'prix_fixe' || Number(promo.valeur) !== 0) {
      return errorResponse('Ce code ne correspond pas à une invitation', 400);
    }
    if (Number(promo.max_utilisations) !== 1 || Number(promo.utilisations || 0) !== 0) {
      return errorResponse('Code invitation déjà utilisé ou invalide', 400);
    }
    if (isExpired(promo.date_expiration)) {
      return errorResponse('Code invitation expiré', 400);
    }

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
    const commandeId = commande.Id;

    // Deuxième contrôle : en cas de course, seule la première commande continue.
    const concurrent = await nocodbGet(env, env.NOCODB_TABLE_COMMANDES, {
      where: `(stripe_session_id,eq,${invitationId})`,
    });
    const commandes = (concurrent.list || []).slice().sort((a, b) => a.Id - b.Id);
    if (commandes.length > 1 && commandes[0].Id !== commandeId) {
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
    const numero = `PRINCE101226GE-${String(billet.Id).padStart(4, '0')}`;
    await nocodbPatch(env, env.NOCODB_TABLE_BILLETS, billet.Id, { numero_billet: numero });
    await nocodbPatch(env, env.NOCODB_TABLE_PROMO, promo.Id, { utilisations: 1, actif: false });

    const billetComplet = {
      Id: billet.Id,
      numero_billet: numero,
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

    let emailEnvoye = false;
    let emailError = null;
    try {
      if (!env.RESEND_API_KEY) throw new Error('RESEND_API_KEY non configuré');
      const pdfBase64 = await generateTicketPDF(billetComplet);
      await sendTicketEmail(env, email, billetComplet, pdfBase64);
      await nocodbPatch(env, env.NOCODB_TABLE_BILLETS, billet.Id, { email_envoye: true });
      emailEnvoye = true;
    } catch (e) {
      emailError = e.message;
    }

    return jsonResponse({
      success: true,
      commande_id: commandeId,
      billet_id: billet.Id,
      numero_billet: numero,
      email_envoye: emailEnvoye,
      email_error: emailError,
    });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

function isExpired(dateExpiration) {
  if (!dateExpiration) return false;
  const value = String(dateExpiration);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T23:59:59.999Z`)
    : new Date(value);
  return Number.isNaN(date.getTime()) || date < new Date();
}
