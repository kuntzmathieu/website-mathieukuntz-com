import { nocodbGet, nocodbPost, jsonResponse, errorResponse } from './_lib.js';
import { sendMetaEvent, buildUserData } from './_meta.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse('Email invalide', 400);
    }

    const tableId = env.NOCODB_TABLE_INSCRIPTIONS || 'mcenjctjm1kqsx1';
    const existing = await nocodbGet(env, tableId, { where: `(email,eq,${email})`, limit: 1 });
    if (existing.list && existing.list.length > 0) {
      const existingRecord = existing.list[0];
      if (existingRecord.statut === 'actif') {
        return jsonResponse({ success: true, already_subscribed: true });
      }
      await nocodbPost(env, tableId, {
        email,
        source: body.source || 'prince_landing',
        date_inscription: new Date().toISOString(),
        statut: 'actif',
      });
    } else {
      await nocodbPost(env, tableId, {
        email,
        source: body.source || 'prince_landing',
        date_inscription: new Date().toISOString(),
        statut: 'actif',
      });
    }

    const eventId = body.event_id || crypto.randomUUID();
    const userData = await buildUserData(request, { email });

    const event = {
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: 'website',
      user_data: userData,
      custom_data: {
        content_name: 'PRINCE - Me tenir informé',
        content_category: 'Spectacle',
      },
    };

    await sendMetaEvent(env, event);

    return jsonResponse({ success: true, event_id: eventId });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
