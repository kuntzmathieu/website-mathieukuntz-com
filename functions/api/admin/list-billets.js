import { nocodbGet, jsonResponse, errorResponse } from '../_lib.js';
import { requireAdmin } from './_auth.js';

export async function onRequestGet({ request, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;

  try {
    const url = new URL(request.url);
    const checked = url.searchParams.get('checked');
    const params = { limit: 1000, sort: '-Id' };
    if (checked === 'true') params.where = '(checkin,eq,true)';
    if (checked === 'false') params.where = '(checkin,eq,false)';

    const data = await nocodbGet(env, env.NOCODB_TABLE_BILLETS, params);
    const billets = data.list || [];
    return jsonResponse({
      billets,
      total: billets.length,
      checked: billets.filter(b => Boolean(b.checkin)).length,
      pending: billets.filter(b => !Boolean(b.checkin)).length,
    });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
