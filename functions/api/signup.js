export async function onRequestPost({ request, env }) {
  const formData = await request.formData();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const spectacle = String(formData.get('spectacle') || formData.get('theme') || '').trim().toLowerCase();
  const isFetch = request.headers.get('X-Requested-With') === 'fetch';

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return jsonOrText({ error: 'Email invalide' }, 400, isFetch);
  }

  if (!['prince', 'reve'].includes(spectacle)) {
    return jsonOrText({ error: 'Spectacle invalide' }, 400, isFetch);
  }

  const nocodbUrl = (env.NOCODB_URL || 'https://db.mathieukuntz.com').replace(/\/$/, '');
  const nocodbToken = env.NOCODB_TOKEN;
  const tableId = env.NOCODB_SIGNUPS_TABLE_ID || env.NOCODB_TABLE_ID;

  if (!nocodbToken || !tableId) {
    return jsonOrText({ error: 'Configuration NocoDB manquante' }, 500, isFetch);
  }

  const submittedAt = new Date().toISOString();
  const record = {
    [env.NOCODB_EMAIL_FIELD || 'Email']: email,
    [env.NOCODB_SPECTACLE_FIELD || 'Spectacle']: spectacle,
    [env.NOCODB_TAG_FIELD || 'Tag']: spectacle,
    [env.NOCODB_SUBMITTED_AT_FIELD || 'DateHeure']: submittedAt,
    [env.NOCODB_SOURCE_FIELD || 'Source']: 'show.mathieukuntz.org',
  };

  const response = await fetch(`${nocodbUrl}/api/v2/tables/${tableId}/records`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xc-token': nocodbToken,
    },
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    return jsonOrText({ error: 'Erreur NocoDB' }, 502, isFetch);
  }

  if (!isFetch) {
    return Response.redirect(new URL('/merci', request.url), 303);
  }

  return jsonOrText({ ok: true }, 200, true);
}

export async function onRequest(context) {
  if (context.request.method === 'POST') {
    return onRequestPost(context);
  }

  return new Response('Method Not Allowed', { status: 405 });
}

function jsonOrText(payload, status, json) {
  if (!json) {
    return new Response(payload.error || 'OK', { status });
  }

  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
