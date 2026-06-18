const NOCODB_URL = process.env.NOCODB_URL;
const NOCODB_TOKEN = process.env.NOCODB_TOKEN;

async function nocodbGet(tableId, params = {}) {
  const url = new URL(`${NOCODB_URL}/api/v2/tables/${tableId}/records`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url, {
    headers: { 'xc-token': NOCODB_TOKEN },
  });
  if (!res.ok) throw new Error(`NocoDB GET ${tableId}: ${res.status}`);
  return res.json();
}

async function nocodbPost(tableId, body) {
  const res = await fetch(`${NOCODB_URL}/api/v2/tables/${tableId}/records`, {
    method: 'POST',
    headers: {
      'xc-token': NOCODB_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`NocoDB POST ${tableId}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function nocodbPatch(tableId, recordId, body) {
  const res = await fetch(`${NOCODB_URL}/api/v2/tables/${tableId}/records`, {
    method: 'PATCH',
    headers: {
      'xc-token': NOCODB_TOKEN,
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

export { nocodbGet, nocodbPost, nocodbPatch, jsonResponse, errorResponse };
