import { nocodbGet, nocodbPost, jsonResponse, errorResponse } from '../_lib.js';
import { requireAdmin } from './_auth.js';

export async function onRequestPost({ request, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;

  try {
    const body = await request.json();
    const description = String(body.description || '').trim();
    const dateExpiration = String(body.date_expiration || '2026-12-10').trim();
    if (Number.isNaN(new Date(dateExpiration).getTime())) {
      return errorResponse('Date d’expiration invalide', 400);
    }

    let code = '';
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = `PRINCE-${crypto.randomUUID().replace(/-/g, '').toUpperCase()}`;
      const existing = await nocodbGet(env, env.NOCODB_TABLE_PROMO, {
        where: `(code,eq,${candidate})`,
        limit: 1,
      });
      if (!existing.list || existing.list.length === 0) {
        code = candidate;
        break;
      }
    }
    if (!code) return errorResponse('Impossible de générer un code unique', 500);

    await nocodbPost(env, env.NOCODB_TABLE_PROMO, {
      code,
      description,
      type_reduction: 'prix_fixe',
      valeur: 0,
      cible: 'tous',
      actif: true,
      max_utilisations: 1,
      utilisations: 0,
      date_expiration: dateExpiration,
    });

    return jsonResponse({
      success: true,
      code,
      url: `/prince/invitation?code=${encodeURIComponent(code)}`,
      date_expiration: dateExpiration,
    });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
