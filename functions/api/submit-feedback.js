import { nocodbPost, jsonResponse, errorResponse } from './_lib.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();

    const note = parseInt(body.note, 10);
    if (!note || note < 1 || note > 5) {
      return errorResponse('Note manquante (Q1)', 400);
    }

    const ceQuiReste = (body.ce_qui_reste || '').trim();
    if (!ceQuiReste) {
      return errorResponse('Veuillez dire ce qui est resté (Q5)', 400);
    }

    const grille = body.grille || {};
    for (const key of ['immersion', 'emotions', 'musique', 'voix_recit', 'rythme', 'profondeur', 'equilibre']) {
      const v = parseInt(grille[key], 10);
      if (!v || v < 1 || v > 5) {
        return errorResponse(`Note manquante dans la grille (${key})`, 400);
      }
    }

    if (!body.rythme) {
      return errorResponse('Rythme manquant (Q9)', 400);
    }

    if (!body.prix_percu) {
      return errorResponse('Prix perçu manquant (Q10)', 400);
    }

    const npsRecommander = parseInt(body.nps_recommander, 10);
    if (isNaN(npsRecommander) || npsRecommander < 0 || npsRecommander > 10) {
      return errorResponse('Note de recommandation manquante (Q11)', 400);
    }
    const npsRevenir = parseInt(body.nps_revenir, 10);
    if (isNaN(npsRevenir) || npsRevenir < 0 || npsRevenir > 10) {
      return errorResponse('Note "revenir" manquante (Q11)', 400);
    }

    const motivation = body.motivation || [];
    if (!Array.isArray(motivation) || motivation.length === 0) {
      return errorResponse('Motivation manquante (Q13)', 400);
    }

    const descriptionAmi = (body.description_ami || '').trim();
    if (!descriptionAmi) {
      return errorResponse('Description manquante (Q14)', 400);
    }

    const emailContact = (body.email_contact || '').trim().toLowerCase();
    if (!emailContact || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailContact)) {
      return errorResponse('Email manquant ou invalide (Q17)', 400);
    }

    const record = {
      date_reponse: new Date().toISOString(),
      note: note,
      deja_vu_hypnose: body.deja_vu_hypnose || '',
      connait_petit_prince: body.connait_petit_prince || '',
      attentes: (body.attentes || '').trim(),
      ce_qui_reste: ceQuiReste,
      note_immersion: parseInt(grille.immersion, 10),
      note_emotions: parseInt(grille.emotions, 10),
      note_musique: parseInt(grille.musique, 10),
      note_voix_recit: parseInt(grille.voix_recit, 10),
      note_rythme: parseInt(grille.rythme, 10),
      note_profondeur: parseInt(grille.profondeur, 10),
      note_equilibre: parseInt(grille.equilibre, 10),
      emotions: (body.emotions || []).join(','),
      emotions_autre: (body.emotions_autre || '').trim(),
      moment_decrochage: (body.moment_decrochage || '').trim(),
      rythme: body.rythme,
      prix_percu: body.prix_percu,
      nps_recommander: npsRecommander,
      nps_revenir: npsRevenir,
      decouverte: (body.decouverte || []).join(','),
      decouverte_autre: (body.decouverte_autre || '').trim(),
      motivation: motivation.join(','),
      motivation_autre: (body.motivation_autre || '').trim(),
      description_ami: descriptionAmi,
      interets: (body.interets || []).join(','),
      interets_autre: (body.interets_autre || '').trim(),
      amelioration: (body.amelioration || '').trim(),
      nom_contact: (body.nom_contact || '').trim(),
      prenom_contact: (body.prenom_contact || '').trim(),
      email_contact: emailContact,
      optin_newsletter: body.optin_newsletter !== false,
      source_soumission: body.source_soumission || 'qr_site',
    };

    const tableId = env.NOCODB_TABLE_FEEDBACK || 'mgs3a5ddw0z1zyi';
    await nocodbPost(env, tableId, record);

    return jsonResponse({ success: true });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
