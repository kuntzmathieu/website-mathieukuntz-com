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

async function buildUserData(request, extras = {}) {
  const userData = {};
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
  if (ip) userData.client_ip_address = ip.split(',')[0].trim();
  const ua = request.headers.get('user-agent') || '';
  if (ua) userData.client_user_agent = ua;

  const fbp = parseCookie(request, '_fbp');
  if (fbp) userData.fbp = fbp;
  const fbc = parseCookie(request, '_fbc');
  if (fbc) userData.fbc = fbc;

  if (extras.email) {
    const normalized = extras.email.trim().toLowerCase();
    userData.em = [await sha256(normalized)];
  }
  if (extras.phone) {
    const normalized = extras.phone.replace(/[^0-9]/g, '');
    userData.ph = [await sha256(normalized)];
  }
  return userData;
}

function parseCookie(request, name) {
  const cookies = request.headers.get('cookie') || '';
  const match = cookies.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}

export { sendMetaEvent, buildUserData, sha256 };
