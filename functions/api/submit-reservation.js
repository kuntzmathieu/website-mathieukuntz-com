import { stripeRequest, nocodbPost, nocodbGet, nocodbPatch, jsonResponse, errorResponse } from './_lib.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { session_id, billets: billetsData } = body;

    if (!session_id || !billetsData || !Array.isArray(billetsData)) {
      return errorResponse('Données manquantes', 400);
    }

    const session = await stripeRequest('GET', `/v1/checkout/sessions/${session_id}`, null, env.STRIPE_SECRET_KEY);
    if (session.payment_status !== 'paid') {
      return errorResponse('Paiement non confirmé', 400);
    }

    const meta = session.metadata || {};
    const emailCommande = session.customer_email || session.customer_details?.email || '';
    const montantTotal = parseFloat(meta.montant_total) || session.amount_total / 100;
    const montantAvant = parseFloat(meta.montant_avant) || montantTotal;
    const codePromo = meta.code_promo || '';
    const counts = JSON.parse(meta.billet_types || '{}');

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
        email_personne: b.email_personne || '',
        date_achat: new Date().toISOString(),
        checkin: false,
        email_envoye: false,
        commande: commandeId,
      });
      const numero = `PRINCE110726VIF-${String(billet.Id).padStart(4, '0')}`;
      await nocodbPatch(env, env.NOCODB_TABLE_BILLETS, billet.Id, { numero_billet: numero });
      billetsCrees.push({ ...billet, numero_billet: numero });
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

    if (env.N8N_WEBHOOK_URL) {
      const hasEmail = billetsCrees.some(b => b.email_personne) || emailCommande;
      if (hasEmail) {
        try {
          await fetch(env.N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              commande_id: commandeId,
              email_commande: emailCommande,
              billets: billetsCrees.map(b => ({
                numero: b.numero_billet,
                type: b.type,
                nom: b.nom,
                prenom: b.prenom,
                email_personne: b.email_personne || emailCommande,
              })),
            }),
          });
        } catch (e) { }
      }
    }

    return jsonResponse({ success: true, commande_id: commandeId, billets: billetsCrees });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
