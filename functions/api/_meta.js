async function sha256(str) {
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sendMetaEvent(env, event) {
  const token = env.META_CAPI_TOKEN;
  const pixelId = env.PUBLIC_META_PIXEL_ID;
  if (!token || !pixelId) return { skipped: true };

  const payload = {
    data: [event],
    access_token: token,
  };

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${pixelId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data;
  } catch (e) {
    return { error: e.message };
  }
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizePhone(value) {
  return String(value || '').replace(/[^0-9]/g, '');
}

function normalizeName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ');
}

function normalizeZip(value) {
  return String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '');
}

function normalizeCity(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '');
}

function normalizeCountry(value) {
  const country = String(value || '').trim().toLowerCase();
  return /^[a-z]{2}$/.test(country) ? country : '';
}

async function buildUserData(request, extras = {}) {
  const userData = {};

  const ipSource = extras.clientIp !== undefined
    ? String(extras.clientIp || '')
    : (request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '');
  const ip = ipSource.split(',')[0].trim();
  if (ip) userData.client_ip_address = ip;

  const uaSource = extras.clientUa !== undefined
    ? String(extras.clientUa || '')
    : (request.headers.get('user-agent') || '');
  const ua = uaSource.trim();
  if (ua) userData.client_user_agent = ua;

  const fbp = extras.fbp !== undefined ? String(extras.fbp || '').trim() : parseCookie(request, '_fbp');
  if (fbp) userData.fbp = fbp;

  const fbc = extras.fbc !== undefined ? String(extras.fbc || '').trim() : parseCookie(request, '_fbc');
  if (fbc) userData.fbc = fbc;

  if (extras.email) {
    const normalized = normalizeEmail(extras.email);
    if (normalized) userData.em = [await sha256(normalized)];
  }
  if (extras.phone) {
    const normalized = normalizePhone(extras.phone);
    if (normalized) userData.ph = [await sha256(normalized)];
  }
  if (extras.firstName) {
    const normalized = normalizeName(extras.firstName);
    if (normalized) userData.fn = [await sha256(normalized)];
  }
  if (extras.lastName) {
    const normalized = normalizeName(extras.lastName);
    if (normalized) userData.ln = [await sha256(normalized)];
  }
  if (extras.zip) {
    const normalized = normalizeZip(extras.zip);
    if (normalized) userData.zp = [await sha256(normalized)];
  }
  if (extras.city) {
    const normalized = normalizeCity(extras.city);
    if (normalized) userData.ct = [await sha256(normalized)];
  }
  if (extras.country) {
    const normalized = normalizeCountry(extras.country);
    if (normalized) userData.country = [await sha256(normalized)];
  }
  if (extras.externalId) {
    const normalized = String(extras.externalId).trim();
    if (normalized) userData.external_id = [await sha256(normalized)];
  }

  return userData;
}

function parseCookie(request, name) {
  const cookies = request.headers.get('cookie') || '';
  const match = cookies.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}

export { sendMetaEvent, buildUserData, sha256 };
