import { sendMetaEvent, buildUserData } from '../_meta.js';
import { jsonResponse, errorResponse } from '../_lib.js';
import { requireAdmin } from './_auth.js';

export async function onRequestPost({ request, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;

  try {
    const userData = await buildUserData(request, {});
    const eventId = `debug_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const result = await sendMetaEvent(env, {
      event_name: 'PageView',
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: 'website',
      event_source_url: 'https://mathieukuntz.com/prince',
      user_data: userData,
    });

    return jsonResponse({
      pixel_id: env.PUBLIC_META_PIXEL_ID || null,
      token_present: Boolean(env.META_CAPI_TOKEN),
      event_id: eventId,
      result,
    });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
