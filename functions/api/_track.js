import { sendMetaEvent, buildUserData } from './_meta.js';
import { jsonResponse, errorResponse } from './_lib.js';

const ALLOWED_ORIGINS = ['https://mathieukuntz.com', 'https://www.mathieukuntz.com'];
const ALLOWED_EVENTS = new Set(['PageView', 'ViewContent', 'AddToCart']);

export async function handleTrackEvent(request, env, forcedName = null) {
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
    const eventName = forcedName || String(body.event_name || 'PageView');
    if (!ALLOWED_EVENTS.has(eventName)) {
      return errorResponse('Événement non autorisé', 400);
    }

    const eventId = String(body.event_id || '');
    const url = String(body.url || '');
    if (!eventId || !url) {
      return errorResponse('event_id et url requis', 400);
    }
    if (eventId.length > 100 || url.length > 2000) {
      return errorResponse('Payload invalide', 400);
    }

    const customData = sanitizeCustomData(body.custom_data);
    const userData = await buildUserData(request, {});

    const event = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: 'website',
      event_source_url: url,
      user_data: userData,
    };
    if (customData) event.custom_data = customData;

    const result = await sendMetaEvent(env, event);
    return jsonResponse({
      ok: true,
      meta: result?.events_received ? 'received' : (result?.error ? 'error' : 'skipped'),
    });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

function sanitizeCustomData(input) {
  if (!input || typeof input !== 'object') return null;
  const out = {};
  if (typeof input.content_name === 'string') out.content_name = input.content_name.slice(0, 200);
  if (typeof input.content_type === 'string') out.content_type = input.content_type.slice(0, 50);
  if (Array.isArray(input.content_ids)) {
    out.content_ids = input.content_ids
      .filter((id) => typeof id === 'string' || typeof id === 'number')
      .slice(0, 20)
      .map((id) => String(id).slice(0, 100));
  }
  if (Number.isFinite(Number(input.value))) out.value = Number(input.value);
  if (typeof input.currency === 'string') out.currency = input.currency.slice(0, 3).toUpperCase();
  if (Number.isFinite(Number(input.num_items))) out.num_items = Number(input.num_items);
  return Object.keys(out).length > 0 ? out : null;
}
