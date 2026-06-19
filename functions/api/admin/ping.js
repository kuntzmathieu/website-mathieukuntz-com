import { jsonResponse } from '../_lib.js';
import { requireAdmin } from './_auth.js';

export async function onRequestGet({ request, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;
  return jsonResponse({ success: true });
}
