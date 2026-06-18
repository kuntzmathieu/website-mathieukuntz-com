import { nocodbGet, jsonResponse, errorResponse } from './_lib.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const code = (body.code || '').trim().toUpperCase();
    const pleinQt = Math.max(0, parseInt(body.plein_tarif) || 0);
    const reduitQt = Math.max(0, parseInt(body.tarif_reduit) || 0);

    if (!code) return errorResponse('Code manquant', 400);

    const data = await nocodbGet(env, env.NOCODB_TABLE_PROMO, { where: `(code,eq,${code})` });
    const promo = (data.list || [])[0];

    if (!promo) return errorResponse('Code invalide', 404);
    if (!promo.actif) return errorResponse('Code inactif', 400);
    if (promo.date_expiration && new Date(promo.date_expiration) < new Date()) {
      return errorResponse('Code expiré', 400);
    }
    if (promo.max_utilisations && promo.utilisations >= promo.max_utilisations) {
      return errorResponse('Code épuisé', 400);
    }

    const tarifsData = await nocodbGet(env, env.NOCODB_TABLE_TARIFS);
    const list = tarifsData.list || [];
    const prixPlein = (list.find(r => r.nom === 'plein tarif') || {}).prix_en_ligne || 19;
    const prixReduit = (list.find(r => r.nom === 'tarif réduit') || {}).prix_en_ligne || 14;

    const details = [];
    let montantAvant = 0;
    let montantApres = 0;

    for (let i = 0; i < pleinQt; i++) {
      montantAvant += prixPlein;
      const { type, prix } = applyPromo('plein tarif', prixPlein, promo);
      montantApres += prix;
      details.push({ type_base: 'plein tarif', type_final: type, prix_avant: prixPlein, prix_apres: prix });
    }
    for (let i = 0; i < reduitQt; i++) {
      montantAvant += prixReduit;
      const { type, prix } = applyPromo('tarif réduit', prixReduit, promo);
      montantApres += prix;
      details.push({ type_base: 'tarif réduit', type_final: type, prix_avant: prixReduit, prix_apres: prix });
    }

    return jsonResponse({
      valide: true,
      code,
      type_reduction: promo.type_reduction,
      valeur: promo.valeur,
      cible: promo.cible,
      description: promo.description,
      montant_avant: montantAvant,
      montant_apres: montantApres,
      reduction: montantAvant - montantApres,
      details,
    });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

function applyPromo(typeBase, prixBase, promo) {
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
