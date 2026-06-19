import { nocodbGet, nocodbPatch, jsonResponse, errorResponse } from '../_lib.js';
import { requireAdmin } from './_auth.js';

export async function onRequestPost({ request, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;

  try {
    const body = await request.json();
    const search = (body.numero_billet || body.search || '').trim();
    if (!search) return errorResponse('Numéro de billet manquant', 400);

    let billet = null;
    if (/^\d+$/.test(search)) {
      const data = await nocodbGet(env, env.NOCODB_TABLE_BILLETS, { where: `(Id,eq,${search})`, limit: 1 });
      billet = (data.list || [])[0];
    }
    if (!billet) {
      const data = await nocodbGet(env, env.NOCODB_TABLE_BILLETS, { where: `(numero_billet,eq,${search})`, limit: 1 });
      billet = (data.list || [])[0];
    }
    if (!billet) return errorResponse('Billet introuvable', 404);

    if (billet.checkin) {
      return jsonResponse({ success: true, already_checked: true, billet });
    }

    await nocodbPatch(env, env.NOCODB_TABLE_BILLETS, billet.Id, { checkin: true });
    return jsonResponse({ success: true, already_checked: false, billet: { ...billet, checkin: true } });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
