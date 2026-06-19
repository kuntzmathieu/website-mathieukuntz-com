import { sendMetaEvent, buildUserData } from './_meta.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const eventId = body.event_id || crypto.randomUUID();
    const eventName = body.event_name || 'PageView';

    const userData = await buildUserData(request, {});

    const event = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: 'website',
      user_data: userData,
    };

    if (body.custom_data) event.custom_data = body.custom_data;

    const result = await sendMetaEvent(env, event);
    return new Response(JSON.stringify({ success: true, event_id: eventId, result }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
