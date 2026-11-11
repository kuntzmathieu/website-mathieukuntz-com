import { nocodbPost } from '../api/_lib.js';

const SOURCE = 'affiche';
const TARGET_PATH = '/prince/?src=affiche';
const CAMPAIGN = 'prince_ge2026';
const SCANS_TABLE = 'mbltmjjvru1zx0b';
const COOKIE_SRC = 'prince_src';
const COOKIE_VISITOR = 'prince_scan_id';
const SRC_MAX_AGE = 90 * 24 * 60 * 60;
const VISITOR_MAX_AGE = 365 * 24 * 60 * 60;

function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    if (!key) continue;
    const value = part.slice(index + 1).trim();
    try {
      out[key] = decodeURIComponent(value);
    } catch (e) {
      out[key] = value;
    }
  }
  return out;
}

function isBot(userAgent) {
  return /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|slack|discord|linkedin|twitterbot|embedly|pinterest|applebot|googlebot|bingbot|yandex|baidu|semrush|ahrefs|mj12|dotbot|petalbot|headless|phantom|selenium/i.test(userAgent);
}

async function logScan(env, request, url, visitorId, isNewVisitor) {
  const table = env.NOCODB_TABLE_SCANS || SCANS_TABLE;
  if (!env.NOCODB_URL || !env.NOCODB_TOKEN || !table) return;

  const userAgent = request.headers.get('user-agent') || '';
  const cf = request.cf || {};

  await nocodbPost(env, table, {
    date_scan: new Date().toISOString(),
    source: SOURCE,
    visitor_id: visitorId,
    is_new_visitor: isNewVisitor,
    pays: cf.country || '',
    ville: cf.city || '',
    region: cf.region || '',
    user_agent: userAgent.slice(0, 1000),
    referer: (request.headers.get('referer') || '').slice(0, 500),
    langue: (request.headers.get('accept-language') || '').slice(0, 100),
    is_bot: isBot(userAgent),
    path: url.pathname,
    target: TARGET_PATH,
    campaign: CAMPAIGN,
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const cookies = parseCookies(request.headers.get('cookie'));
  const visitorId = cookies[COOKIE_VISITOR] || crypto.randomUUID();
  const isNewVisitor = !cookies[COOKIE_VISITOR];

  const logging = logScan(env, request, url, visitorId, isNewVisitor).catch(() => {});
  if (typeof context.waitUntil === 'function') {
    context.waitUntil(logging);
  } else {
    await logging;
  }

  const headers = new Headers({
    Location: new URL(TARGET_PATH, url.origin).toString(),
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'X-Robots-Tag': 'noindex, nofollow',
  });
  headers.append('Set-Cookie', `${COOKIE_SRC}=${SOURCE}; Path=/; Max-Age=${SRC_MAX_AGE}; SameSite=Lax; Secure`);
  headers.append('Set-Cookie', `${COOKIE_VISITOR}=${visitorId}; Path=/; Max-Age=${VISITOR_MAX_AGE}; SameSite=Lax; Secure`);

  return new Response(null, { status: 302, headers });
}
