import { nocodbPost, nocodbPatch, jsonResponse, errorResponse } from '../_lib.js';
import { generateTicketPDF } from '../_pdf.js';
import { sendTicketEmail } from '../_email.js';
import { requireAdmin } from './_auth.js';

export async function onRequestPost({ request, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;

  try {
    const body = await request.json();
    const billetsData = Array.isArray(body.billets) ? body.billets : [];
    if (billetsData.length === 0) return errorResponse('Ajoutez au moins un billet', 400);

    for (const b of billetsData) {
      if (!b.nom || !b.prenom || !b.annee_naissance) {
        return errorResponse('Nom, prénom et année de naissance sont obligatoires pour chaque billet', 400);
      }
    }

    const counts = billetsData.reduce((acc, b) => {
      const type = b.type || 'plein tarif';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    const montantTotal = billetsData.reduce((sum, b) => sum + (parseFloat(b.prix_paye) || 0), 0);
    const emailCommande = (body.email_commande || '').trim();

    const commande = await nocodbPost(env, env.NOCODB_TABLE_COMMANDES, {
      email_commande: emailCommande,
      date_commande: new Date().toISOString(),
      montant_avant_remise: montantTotal,
      montant_total: montantTotal,
      nb_plein_tarif: counts['plein tarif'] || 0,
      nb_tarif_reduit: counts['tarif réduit'] || 0,
      nb_invitation: counts['invitation'] || 0,
      nb_custom: counts['custom'] || 0,
      paiement: body.paiement || 'admin',
      canal_vente: body.canal_vente || 'admin',
      note: body.note || '',
    });
    const commandeId = commande.Id;

    const billetsCrees = [];
    const emailErrors = [];

    for (const b of billetsData) {
      const prixPaye = parseFloat(b.prix_paye) || 0;
      const billet = await nocodbPost(env, env.NOCODB_TABLE_BILLETS, {
        numero_billet: 'temp',
        type: b.type || 'plein tarif',
        prix_paye: prixPaye,
        nom: b.nom,
        prenom: b.prenom,
        annee_naissance: b.annee_naissance,
        code_postal: b.code_postal || '',
        email_personne: b.email_personne || '',
        date_achat: new Date().toISOString(),
        checkin: false,
        email_envoye: false,
        commande: commandeId,
      });
      const numero = `PRINCE110726VIF-${String(billet.Id).padStart(4, '0')}`;
      await nocodbPatch(env, env.NOCODB_TABLE_BILLETS, billet.Id, { numero_billet: numero });

      const billetComplet = {
        Id: billet.Id,
        numero_billet: numero,
        type: b.type || 'plein tarif',
        prix_paye: prixPaye,
        nom: b.nom,
        prenom: b.prenom,
        annee_naissance: b.annee_naissance,
        code_postal: b.code_postal || '',
        email_personne: b.email_personne || '',
      };
      billetsCrees.push(billetComplet);

      const emailDest = billetComplet.email_personne || emailCommande;
      const shouldSendEmail = emailDest && env.RESEND_API_KEY && (body.paiement || 'espèces') !== 'à encaisser';
      if (shouldSendEmail) {
        try {
          const pdfBase64 = await generateTicketPDF(billetComplet);
          await sendTicketEmail(env, emailDest, billetComplet, pdfBase64);
          await nocodbPatch(env, env.NOCODB_TABLE_BILLETS, billet.Id, { email_envoye: true });
        } catch (e) {
          emailErrors.push({ billet: billet.Id, email: emailDest, error: e.message });
        }
      }
    }

    return jsonResponse({ success: true, commande_id: commandeId, billets: billetsCrees, email_errors: emailErrors });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
