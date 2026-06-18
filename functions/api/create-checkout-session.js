import Stripe from 'stripe';
import { nocodbGet, nocodbPost, jsonResponse, errorResponse } from './_lib.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const TABLE_TARIFS = process.env.NOCODB_TABLE_TARIFS;
const TABLE_PROMO = process.env.NOCODB_TABLE_PROMO;
const TABLE_COMMANDES = process.env.NOCODB_TABLE_COMMANDES;
const PRICE_PLEIN = process.env.STRIPE_PRICE_PLEIN_ONLINE;
const PRICE_REDUIT = process.env.STRIPE_PRICE_REDUIT_ONLINE;

async function getTarifs() {
  const data = await nocodbGet(TABLE_TARIFS);
  const list = data.list || [];
  const plein = list.find(r => r.nom === 'plein tarif');
  const reduit = list.find(r => r.nom === 'tarif réduit');
  return {
    plein: plein ? plein.prix_en_ligne : 19,
    reduit: reduit ? reduit.prix_en_ligne : 14,
  };
}

async function validatePromoCode(code, pleinQt, reduitQt) {
  if (!code) return null;
  const data = await nocodbGet(TABLE_PROMO, {
    where: `(code,eq,${code})`,
  });
  const promo = (data.list || [])[0];
  if (!promo) return { valide: false, erreur: 'Code invalide' };
  if (!promo.actif) return { valide: false, erreur: 'Code expiré' };
  if (promo.date_expiration && new Date(promo.date_expiration) < new Date()) {
    return { valide: false, erreur: 'Code expiré' };
  }
  if (promo.max_utilisations && promo.utilisations >= promo.max_utilisations) {
    return { valide: false, erreur: 'Code épuisé' };
  }
  return { valide: true, promo };
}

function computeLineItem(typeBase, prixBase, promo) {
  if (!promo || !promo.valide) {
    return { type: typeBase, prix: prixBase };
  }
  const p = promo.promo;
  if (p.cible !== 'tous' && p.cible !== (typeBase === 'plein tarif' ? 'plein_tarif' : 'tarif_reduit')) {
    return { type: typeBase, prix: prixBase };
  }
  if (p.type_reduction === 'prix_fixe') {
    if (p.valeur === 0) return { type: 'invitation', prix: 0 };
    return { type: 'custom', prix: p.valeur };
  }
  let prix = prixBase;
  if (p.type_reduction === 'pourcentage') {
    prix = prixBase * (1 - p.valeur / 100);
  } else if (p.type_reduction === 'montant_fixe') {
    prix = prixBase - p.valeur;
  }
  prix = Math.max(0, Math.round(prix * 100) / 100);
  return { type: typeBase, prix };
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const pleinQt = Math.max(0, parseInt(body.plein_tarif) || 0);
    const reduitQt = Math.max(0, parseInt(body.tarif_reduit) || 0);
    const promoCode = (body.code_promo || '').trim().toUpperCase();

    if (pleinQt === 0 && reduitQt === 0) {
      return errorResponse('Sélectionnez au moins une place', 400);
    }

    const tarifs = await getTarifs();
    const promo = await validatePromoCode(promoCode, pleinQt, reduitQt);
    if (promoCode && promo && !promo.valide) {
      return errorResponse(promo.erreur, 400);
    }

    const lineItems = [];
    let montantAvantRemise = 0;
    let montantTotal = 0;
    const billetsPreview = [];

    for (let i = 0; i < pleinQt; i++) {
      const li = computeLineItem('plein tarif', tarifs.plein, promo);
      montantAvantRemise += tarifs.plein;
      montantTotal += li.prix;
      billetsPreview.push(li);
      if (li.prix > 0) {
        lineItems.push({ price: PRICE_PLEIN, quantity: 1 });
      }
    }
    for (let i = 0; i < reduitQt; i++) {
      const li = computeLineItem('tarif réduit', tarifs.reduit, promo);
      montantAvantRemise += tarifs.reduit;
      montantTotal += li.prix;
      billetsPreview.push(li);
      if (li.prix > 0) {
        lineItems.push({ price: PRICE_REDUIT, quantity: 1 });
      }
    }

    if (montantTotal === 0) {
      return errorResponse('Montant total nul — utilisez l\'admin pour les invitations', 400);
    }

    const counts = billetsPreview.reduce((acc, b) => {
      acc[b.type] = (acc[b.type] || 0) + 1;
      return acc;
    }, {});

    const metadata = {
      plein_tarif: String(pleinQt),
      tarif_reduit: String(reduitQt),
      montant_avant: String(montantAvantRemise),
      montant_total: String(montantTotal),
      code_promo: promoCode || '',
      billet_types: JSON.stringify(counts),
    };

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      ui_mode: 'embedded',
      line_items: lineItems,
      redirect_on_completion: 'always',
      return_url: `${new URL(request.url).origin}/prince/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      metadata,
    });

    return jsonResponse({
      clientSecret: session.client_secret,
      session_id: session.id,
      montant_avant_remise: montantAvantRemise,
      montant_total: montantTotal,
      billets: billetsPreview,
    });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
