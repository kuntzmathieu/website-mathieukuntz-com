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
    const codePromo = meta.code_promo || '';
    let billetsDetail;
    try {
      billetsDetail = JSON.parse(meta.billets_detail || '[]');
    } catch (e) {
      return errorResponse('Métadonnées de billets invalides', 400);
    }
    if (!Array.isArray(billetsDetail) || billetsDetail.length !== billetsData.length) {
      return errorResponse('Le nombre de billets ne correspond pas à la session Stripe', 400);
    }

    const sessionAmountCents = Number(session.amount_total);
    const metadataTotalCents = toCents(meta.montant_total);
    if (!Number.isFinite(sessionAmountCents) || metadataTotalCents !== sessionAmountCents) {
      return errorResponse('Le montant de la session Stripe ne correspond pas aux métadonnées', 400);
    }

    const participants = [];
    let detailTotalCents = 0;
    let submittedTotalCents = 0;
    for (const [idx, b] of billetsData.entries()) {
      const detail = billetsDetail[idx] || {};
      const nom = String(b.nom || '').trim();
      const prenom = String(b.prenom || '').trim();
      const anneeNaissance = Number(b.annee_naissance);
      const emailPersonne = String(b.email_personne || '').trim().toLowerCase();
      if (!nom || !prenom || !b.annee_naissance) {
        return errorResponse('Champs obligatoires manquants pour un billet', 400);
      }
      if (!Number.isInteger(anneeNaissance) || anneeNaissance < 1900 || anneeNaissance > new Date().getFullYear()) {
        return errorResponse('Année de naissance invalide pour un billet', 400);
      }
      if (emailPersonne && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailPersonne)) {
        return errorResponse('Email invalide pour un billet', 400);
      }

      const detailPrixCents = toCents(detail.prix);
      const submittedPrixCents = toCents(b.prix_paye);
      if (!Number.isFinite(detailPrixCents) || !Number.isFinite(submittedPrixCents)) {
        return errorResponse('Prix de billet invalide', 400);
      }
      if (b.type !== detail.type || submittedPrixCents !== detailPrixCents) {
        return errorResponse('Les types ou prix des billets ne correspondent pas à la session Stripe', 400);
      }
      detailTotalCents += detailPrixCents;
      submittedTotalCents += submittedPrixCents;
      participants.push({
        type: detail.type,
        prix_paye: detailPrixCents / 100,
        nom,
        prenom,
        annee_naissance: anneeNaissance,
        code_postal: String(b.code_postal || '').trim(),
        email_personne: emailPersonne,
      });
    }
    if (detailTotalCents !== sessionAmountCents || submittedTotalCents !== sessionAmountCents) {
      return errorResponse('Le total des billets ne correspond pas au montant payé', 400);
    }

    const montantTotal = sessionAmountCents / 100;
    const montantAvantCents = toCents(meta.montant_avant);
    const montantAvant = Number.isFinite(montantAvantCents) ? montantAvantCents / 100 : montantTotal;
    const counts = billetsDetail.reduce((acc, b) => {
      acc[b.type] = (acc[b.type] || 0) + 1;
      return acc;
    }, {});

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
    for (const b of participants) {
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
      const numero = `PRINCE101226GE-${String(billet.Id).padStart(4, '0')}`;
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
        currency: 'CHF',
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

function toCents(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : NaN;
}
