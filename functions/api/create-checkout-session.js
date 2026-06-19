import { stripeRequest, nocodbGet, nocodbPost, jsonResponse, errorResponse } from './_lib.js';
import { sendMetaEvent, buildUserData } from './_meta.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const pleinQt = Math.max(0, parseInt(body.plein_tarif) || 0);
    const reduitQt = Math.max(0, parseInt(body.tarif_reduit) || 0);
    const promoCode = (body.code_promo || '').trim().toUpperCase();

    if (pleinQt === 0 && reduitQt === 0) {
      return errorResponse('Sélectionnez au moins une place', 400);
    }

    const tarifsData = await nocodbGet(env, env.NOCODB_TABLE_TARIFS);
    const list = tarifsData.list || [];
    const prixPlein = (list.find(r => r.nom === 'plein tarif') || {}).prix_en_ligne || 19;
    const prixReduit = (list.find(r => r.nom === 'tarif réduit') || {}).prix_en_ligne || 14;

    let promo = null;
    if (promoCode) {
      const promoData = await nocodbGet(env, env.NOCODB_TABLE_PROMO, {
        where: `(code,eq,${promoCode})`,
      });
      const p = (promoData.list || [])[0];
      if (!p) return errorResponse('Code promo invalide', 400);
      if (!p.actif) return errorResponse('Code promo inactif', 400);
      if (p.date_expiration && new Date(p.date_expiration) < new Date()) {
        return errorResponse('Code promo expiré', 400);
      }
      if (p.max_utilisations && p.utilisations >= p.max_utilisations) {
        return errorResponse('Code promo épuisé', 400);
      }
      promo = p;
    }

    const lineItems = [];
    let montantAvantRemise = 0;
    let montantTotal = 0;
    const billetsPreview = [];

    for (let i = 0; i < pleinQt; i++) {
      const li = computeLineItem('plein tarif', prixPlein, promo);
      montantAvantRemise += prixPlein;
      montantTotal += li.prix;
      billetsPreview.push(li);
      if (li.prix > 0) {
        lineItems.push({ price: env.STRIPE_PRICE_PLEIN_ONLINE, quantity: 1 });
      }
    }
    for (let i = 0; i < reduitQt; i++) {
      const li = computeLineItem('tarif réduit', prixReduit, promo);
      montantAvantRemise += prixReduit;
      montantTotal += li.prix;
      billetsPreview.push(li);
      if (li.prix > 0) {
        lineItems.push({ price: env.STRIPE_PRICE_REDUIT_ONLINE, quantity: 1 });
      }
    }

    if (montantTotal === 0) {
      return errorResponse('Montant total nul — utilisez l\'admin pour les invitations', 400);
    }

    const counts = billetsPreview.reduce((acc, b) => {
      acc[b.type] = (acc[b.type] || 0) + 1;
      return acc;
    }, {});

    const origin = new URL(request.url).origin;
    const session = await stripeRequest('POST', '/checkout/sessions', {
      mode: 'payment',
      'ui_mode': 'embedded',
      'line_items': lineItems,
      'redirect_on_completion': 'always',
      'return_url': `${origin}/prince/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      'metadata[plein_tarif]': String(pleinQt),
      'metadata[tarif_reduit]': String(reduitQt),
      'metadata[montant_avant]': String(montantAvantRemise),
      'metadata[montant_total]': String(montantTotal),
      'metadata[code_promo]': promoCode || '',
      'metadata[billet_types]': JSON.stringify(counts),
      'metadata[billets_detail]': JSON.stringify(billetsPreview.map(b => ({ type: b.type, prix: b.prix }))),
    }, env.STRIPE_SECRET_KEY);

    const eventId = body.event_id || crypto.randomUUID();
    const userData = await buildUserData(request, {});
    await sendMetaEvent(env, {
      event_name: 'InitiateCheckout',
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: 'website',
      user_data: userData,
      custom_data: {
        currency: 'EUR',
        value: montantTotal,
        content_name: 'PRINCE',
        num_items: pleinQt + reduitQt,
      },
    });

    return jsonResponse({
      clientSecret: session.client_secret,
      session_id: session.id,
      montant_avant_remise: montantAvantRemise,
      montant_total: montantTotal,
      billets: billetsPreview,
      event_id: eventId,
    });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

function computeLineItem(typeBase, prixBase, promo) {
  if (!promo) return { type: typeBase, prix: prixBase };
  if (promo.cible !== 'tous' && promo.cible !== (typeBase === 'plein tarif' ? 'plein_tarif' : 'tarif_reduit')) {
    return { type: typeBase, prix: prixBase };
  }
  if (promo.type_reduction === 'prix_fixe') {
    if (promo.valeur === 0) return { type: 'invitation', prix: 0 };
    return { type: 'custom', prix: promo.valeur };
  }
  let prix = prixBase;
  if (promo.type_reduction === 'pourcentage') prix = prixBase * (1 - promo.valeur / 100);
  else if (promo.type_reduction === 'montant_fixe') prix = prixBase - promo.valeur;
  prix = Math.max(0, Math.round(prix * 100) / 100);
  return { type: typeBase, prix };
}
