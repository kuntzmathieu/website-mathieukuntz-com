import { stripeRequest, nocodbPost, nocodbGet, nocodbPatch, nocodbDelete, jsonResponse, errorResponse } from './_lib.js';
import { generateTicketPDF } from './_pdf.js';
import { sendTicketEmail } from './_email.js';
import { sendMetaEvent, buildUserData } from './_meta.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { session_id, billets: billetsData } = body;

    if (!session_id || !billetsData || !Array.isArray(billetsData)) {
      return errorResponse('Données manquantes', 400);
    }

    const session = await stripeRequest('GET', `/checkout/sessions/${session_id}`, null, env.STRIPE_SECRET_KEY);
    if (session.payment_status !== 'paid') {
      return errorResponse('Paiement non confirmé', 400);
    }

    // Anti-doublon : vérifie si une commande existe déjà pour cette session
    const existing = await nocodbGet(env, env.NOCODB_TABLE_COMMANDES, {
      where: `(stripe_session_id,eq,${session_id})`,
    });
    if (existing.list && existing.list.length > 0) {
      return jsonResponse({
        success: true,
        already_exists: true,
        commande_id: existing.list[0].Id,
        message: 'Cette commande a déjà été enregistrée.',
      });
    }

    const meta = session.metadata || {};
    const emailCommande = session.customer_email || session.customer_details?.email || '';
    const montantTotal = parseFloat(meta.montant_total) || session.amount_total / 100;
    const montantAvant = parseFloat(meta.montant_avant) || montantTotal;
    const codePromo = meta.code_promo || '';
    const counts = JSON.parse(meta.billet_types || '{}');
    const billetsDetail = JSON.parse(meta.billets_detail || '[]');

    const commande = await nocodbPost(env, env.NOCODB_TABLE_COMMANDES, {
      stripe_session_id: session_id,
      email_commande: emailCommande,
      date_commande: new Date().toISOString(),
      montant_avant_remise: montantAvant,
      montant_total: montantTotal,
      nb_plein_tarif: counts['plein tarif'] || 0,
      nb_tarif_reduit: counts['tarif réduit'] || 0,
      nb_invitation: counts['invitation'] || 0,
      nb_custom: counts['custom'] || 0,
      paiement: 'stripe',
      canal_vente: 'en ligne',
      code_promo_utilise: codePromo,
    });
    const commandeId = commande.Id;

    // Nettoie la table pending_sessions si cette session y était stockée
    if (env.NOCODB_TABLE_PENDING) {
      try {
        const pending = await nocodbGet(env, env.NOCODB_TABLE_PENDING, {
          where: `(stripe_session_id,eq,${session_id})`,
        });
        if (pending.list && pending.list.length > 0) {
          for (const p of pending.list) {
            await nocodbDelete(env, env.NOCODB_TABLE_PENDING, p.Id);
          }
        }
      } catch (e) { /* non bloquant */ }
    }

    const billetsCrees = [];
    for (const b of billetsData) {
      if (!b.nom || !b.prenom || !b.annee_naissance) {
        return errorResponse('Champs obligatoires manquants pour un billet', 400);
      }
      const billet = await nocodbPost(env, env.NOCODB_TABLE_BILLETS, {
        numero_billet: 'temp',
        type: b.type,
        prix_paye: b.prix_paye,
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
      billetsCrees.push({
        Id: billet.Id,
        numero_billet: numero,
        type: b.type,
        prix_paye: b.prix_paye,
        nom: b.nom,
        prenom: b.prenom,
        annee_naissance: b.annee_naissance,
        code_postal: b.code_postal || '',
        email_personne: b.email_personne || '',
      });
    }

    if (codePromo) {
      try {
        const promoData = await nocodbGet(env, env.NOCODB_TABLE_PROMO, { where: `(code,eq,${codePromo})` });
        const promo = (promoData.list || [])[0];
        if (promo) {
          await nocodbPatch(env, env.NOCODB_TABLE_PROMO, promo.Id, { utilisations: (promo.utilisations || 0) + 1 });
        }
      } catch (e) { }
    }

    let emailErrors = [];
    if (!env.RESEND_API_KEY) {
      emailErrors.push({ error: 'RESEND_API_KEY non configuré dans env' });
    } else {
      for (const [idx, b] of billetsCrees.entries()) {
        const emailDest = b.email_personne || emailCommande;
        if (!emailDest) {
          emailErrors.push({ billet: b.Id, error: 'Pas d\'email destinataire' });
          continue;
        }
        try {
          const detail = billetsDetail[idx] || {};
          const pdfBase64 = await generateTicketPDF({
            ...b,
            code_promo: codePromo,
            prix_avant: detail.prix_avant || b.prix_paye,
          });
          await sendTicketEmail(env, emailDest, b, pdfBase64);
          await nocodbPatch(env, env.NOCODB_TABLE_BILLETS, b.Id, { email_envoye: true });
        } catch (e) {
          emailErrors.push({ billet: b.Id, error: e.message, email: emailDest });
        }
      }
    }

    const eventId = body.event_id || crypto.randomUUID();
    const userData = await buildUserData(request, { email: emailCommande });
    await sendMetaEvent(env, {
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: 'website',
      user_data: userData,
      custom_data: {
        currency: 'EUR',
        value: montantTotal,
        content_name: 'PRINCE',
        num_items: (counts['plein tarif'] || 0) + (counts['tarif réduit'] || 0) + (counts['invitation'] || 0) + (counts['custom'] || 0),
      },
    });

    return jsonResponse({ success: true, commande_id: commandeId, montant_total: montantTotal, billets: billetsCrees, email_errors: emailErrors, event_id: eventId });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
