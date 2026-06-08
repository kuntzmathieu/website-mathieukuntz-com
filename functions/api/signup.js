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
  const baseId = env.NOCODB_BASE_ID || 'plk0vc8yraeix92';
  const tableId = env.NOCODB_SIGNUPS_TABLE_ID || env.NOCODB_TABLE_ID || 'm6x3ijchkjq41v5';

  if (!nocodbToken || !baseId || !tableId) {
    return jsonOrText({ error: 'Configuration NocoDB manquante' }, 500, isFetch);
  }

  const now = new Date();
  const date = new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const heure = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now);

  const record = {
    email,
    Spectacle: spectacle,
    Date: date,
    Heure: heure,
  };

  const response = await fetch(`${nocodbUrl}/api/v3/data/${baseId}/${tableId}/records`, {
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
