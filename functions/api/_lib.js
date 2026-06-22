const STRIPE_BASE = 'https://api.stripe.com/v1';

function flattenParams(params, prefix, value) {
  if (Array.isArray(value)) {
    value.forEach((item, i) => {
      flattenParams(params, `${prefix}[${i}]`, item);
    });
  } else if (typeof value === 'object' && value !== null) {
    for (const [k, v] of Object.entries(value)) {
      flattenParams(params, `${prefix}[${k}]`, v);
    }
  } else {
    params.append(prefix, value);
  }
}

async function stripeRequest(method, path, body, secretKey) {
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };
  if (body) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(body)) {
      flattenParams(params, k, v);
    }
    opts.body = params;
  }
  const res = await fetch(`${STRIPE_BASE}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Stripe ${res.status}`);
  return data;
}

async function nocodbGet(env, tableId, params = {}) {
  const url = new URL(`${env.NOCODB_URL}/api/v2/tables/${tableId}/records`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url, {
    headers: { 'xc-token': env.NOCODB_TOKEN },
  });
  if (!res.ok) throw new Error(`NocoDB GET ${tableId}: ${res.status}`);
  return res.json();
}

async function nocodbPost(env, tableId, body) {
  const res = await fetch(`${env.NOCODB_URL}/api/v2/tables/${tableId}/records`, {
    method: 'POST',
    headers: {
      'xc-token': env.NOCODB_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`NocoDB POST ${tableId}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function nocodbPatch(env, tableId, recordId, body) {
  const res = await fetch(`${env.NOCODB_URL}/api/v2/tables/${tableId}/records`, {
    method: 'PATCH',
    headers: {
      'xc-token': env.NOCODB_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ Id: recordId, ...body }),
  });
  if (!res.ok) throw new Error(`NocoDB PATCH ${tableId}: ${res.status}`);
  return res.json();
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

export { stripeRequest, nocodbGet, nocodbPost, nocodbPatch, jsonResponse, errorResponse };
