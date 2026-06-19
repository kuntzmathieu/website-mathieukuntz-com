import { errorResponse } from '../_lib.js';

function getAdminToken(request) {
  const auth = request.headers.get('Authorization') || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  return request.headers.get('x-admin-token') || '';
}

function requireAdmin(request, env) {
  const expected = env.ADMIN_TOKEN || env.PRINCE_ADMIN_TOKEN || env.ADMIN_PASSWORD;
  if (!expected) return errorResponse('ADMIN_TOKEN non configuré', 500);
  const token = getAdminToken(request);
  if (!token || token !== expected) return errorResponse('Accès refusé', 401);
  return null;
}

export { requireAdmin };
