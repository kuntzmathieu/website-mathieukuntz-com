import { nocodbGet, jsonResponse, errorResponse } from './_lib.js';

const INVITATIONS_TABLE = 'm98ogwuxup4lo22';

export async function onRequestGet({ request, env }) {
  try {
    const code = (new URL(request.url).searchParams.get('code') || '').trim().toUpperCase();
    if (!code) return errorResponse('Code manquant', 400);

    const data = await nocodbGet(env, env.NOCODB_TABLE_INVITATIONS || INVITATIONS_TABLE, {
      where: `(code,eq,${code})`,
      limit: 1,
    });
    const invitation = (data.list || [])[0];
    if (!invitation) return errorResponse('Code invitation invalide', 404);

    if (invitation.utilise) {
      return jsonResponse({
        valide: false,
        utilise: true,
        message: 'Ce code invitation a déjà été utilisé.',
      });
    }

    return jsonResponse({
      valide: true,
      code: invitation.code,
      prenom: invitation.prenom,
      nom: invitation.nom,
      annee_naissance: invitation.annee_naissance,
      email: invitation.email,
    });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
