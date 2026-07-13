import { nocodbPost, jsonResponse, errorResponse } from './_lib.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();

    const numeroBillet = (body.numero_billet || '').trim();
    if (!numeroBillet) {
      return errorResponse('Numéro de billet manquant', 400);
    }

    const nomBillet = (body.nom_billet || '').trim();
    if (!nomBillet) {
      return errorResponse('Nom du billet manquant', 400);
    }

    const prenomBillet = (body.prenom_billet || '').trim();
    if (!prenomBillet) {
      return errorResponse('Prénom du billet manquant', 400);
    }

    const placeSalle = (body.place_salle || '').trim();
    if (!placeSalle) {
      return errorResponse('Place dans la salle manquante', 400);
    }

    const resteJusquaFin = (body.reste_jusqua_fin || '').trim();
    if (!resteJusquaFin) {
      return errorResponse('Indiquer si vous êtes resté jusqu\'à la fin', 400);
    }

    const pourquoiParti = (body.pourquoi_parti || '').trim();

    const conditionSatisfaction = (body.condition_satisfaction || '').trim();
    if (!conditionSatisfaction) {
      return errorResponse('Condition de satisfaction manquante', 400);
    }

    const autreImportant = (body.autre_important || '').trim();

    const email = (body.email || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse('Email manquant ou invalide', 400);
    }

    const record = {
      date_soumission: new Date().toISOString(),
      numero_billet: numeroBillet,
      nom_billet: nomBillet,
      prenom_billet: prenomBillet,
      place_salle: placeSalle,
      reste_jusqua_fin: resteJusquaFin,
      pourquoi_parti: pourquoiParti,
      condition_satisfaction: conditionSatisfaction,
      autre_important: autreImportant,
      email: email,
      source_soumission: body.source_soumission || 'page_web',
    };

    const tableId = env.NOCODB_TABLE_PLACES_OFFERTES || 'places_offertes_prince';
    await nocodbPost(env, tableId, record);

    return jsonResponse({ success: true });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
