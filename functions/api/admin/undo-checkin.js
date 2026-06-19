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
      let formatted = search;
      if (/^\d{1,4}$/.test(search.trim())) {
        formatted = `PRINCE110726VIF-${String(parseInt(search.trim())).padStart(4, '0')}`;
      }
      const data = await nocodbGet(env, env.NOCODB_TABLE_BILLETS, { where: `(numero_billet,eq,${formatted})`, limit: 1 });
      billet = (data.list || [])[0];
    }
    if (!billet) return errorResponse('Billet introuvable', 404);

    await nocodbPatch(env, env.NOCODB_TABLE_BILLETS, billet.Id, { checkin: false });
    return jsonResponse({ success: true, billet: { ...billet, checkin: false } });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
