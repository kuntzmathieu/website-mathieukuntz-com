import { sendMetaEvent, buildUserData } from './_meta.js';
import { jsonResponse, errorResponse } from './_lib.js';

const ALLOWED_ORIGINS = ['https://mathieukuntz.com', 'https://www.mathieukuntz.com'];

export async function onRequestPost({ request, env }) {
  try {
    const origin = request.headers.get('origin') || '';
    const referer = request.headers.get('referer') || '';

    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return errorResponse('Forbidden', 403);
    }
    if (!origin && referer && !ALLOWED_ORIGINS.some((allowed) => referer.startsWith(allowed))) {
      return errorResponse('Forbidden', 403);
    }

    const body = await request.json();
    const eventId = String(body.event_id || '');
    const url = String(body.url || '');

    if (!eventId || !url) {
      return errorResponse('event_id et url requis', 400);
    }
    if (eventId.length > 100 || url.length > 2000) {
      return errorResponse('Payload invalide', 400);
    }

    const userData = await buildUserData(request, {});

    await sendMetaEvent(env, {
      event_name: 'PageView',
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: 'website',
      event_source_url: url,
      user_data: userData,
    });

    return jsonResponse({ ok: true });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
