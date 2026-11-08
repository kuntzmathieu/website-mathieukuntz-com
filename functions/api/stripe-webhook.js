import { nocodbGet, nocodbPost, jsonResponse, errorResponse } from './_lib.js';
import { sendMetaEvent, buildUserData } from './_meta.js';

async function verifyStripeSignature(payload, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;
  const parts = signatureHeader.split(',');
  const timestamp = parts.find(p => p.startsWith('t='))?.slice(2);
  const v1Signature = parts.find(p => p.startsWith('v1='))?.slice(3);
  if (!timestamp || !v1Signature) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
  const expectedSignature = [...new Uint8Array(sig)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return expectedSignature === v1Signature;
}

export async function onRequestPost({ request, env }) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!await verifyStripeSignature(payload, signature, env.STRIPE_WEBHOOK_SECRET)) {
      return errorResponse('Invalid signature', 400);
    }

    const event = JSON.parse(payload);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const sessionId = session.id;
      const email = session.customer_email || session.customer_details?.email || '';
      const montant = session.amount_total ? (session.amount_total / 100) : 0;

      // Vérifie si une commande existe déjà (formulaire déjà rempli)
      const existing = await nocodbGet(env, env.NOCODB_TABLE_COMMANDES, {
        where: `(stripe_session_id,eq,${sessionId})`,
      });
      if (existing.list && existing.list.length > 0) {
        return jsonResponse({ received: true, skipped: 'already_completed' });
      }

      // Vérifie si on a déjà stocké cette session (évite les doublons)
      const alreadyPending = await nocodbGet(env, env.NOCODB_TABLE_PENDING, {
        where: `(stripe_session_id,eq,${sessionId})`,
      });
      if (alreadyPending.list && alreadyPending.list.length > 0) {
        return jsonResponse({ received: true, skipped: 'already_pending' });
      }

      // Stocke la session en attente — le cron traitera dans 5 min.
      // Cette écriture sert aussi de garde anti-doublon pour le Purchase :
      // un retry Stripe trouvera la ligne pending et s'arrêtera ici.
      await nocodbPost(env, env.NOCODB_TABLE_PENDING, {
        stripe_session_id: sessionId,
        email,
        montant,
        created_at: new Date().toISOString(),
        email_secours_envoye: false,
      });

      // Envoie le Purchase une seule fois, après les contrôles anti-doublon.
      // Le navigateur envoie aussi un Purchase avec le même event_id :
      // Meta déduplique Pixel <-> CAPI, pas CAPI <-> CAPI.
      if (session.payment_status === 'paid') {
        try {
          const meta = session.metadata || {};
          const details = session.customer_details || {};
          const address = details.address || {};
          const fullName = String(details.name || '').trim();
          const nameParts = fullName.split(/\s+/).filter(Boolean);
          const firstName = nameParts.shift() || '';
          const lastName = nameParts.join(' ');

          let numItems = 0;
          try {
            const counts = JSON.parse(meta.billet_types || '{}');
            numItems = Object.values(counts).reduce((sum, n) => sum + (Number(n) || 0), 0);
          } catch (e) { /* ignore */ }

          const userData = await buildUserData(request, {
            email,
            phone: details.phone || '',
            firstName,
            lastName,
            zip: address.postal_code || '',
            city: address.city || '',
            country: address.country || '',
            externalId: email || sessionId,
            fbp: meta.fbp || '',
            fbc: meta.fbc || '',
            clientIp: meta.client_ip || '',
            clientUa: meta.client_ua || '',
          });

          await sendMetaEvent(env, {
            event_name: 'Purchase',
            event_time: Math.floor(Date.now() / 1000),
            event_id: `purchase_${sessionId}`,
            action_source: 'website',
            event_source_url: meta.event_source_url || 'https://mathieukuntz.com/prince',
            user_data: userData,
            custom_data: {
              currency: String(session.currency || 'chf').toUpperCase(),
              value: montant,
              content_name: 'PRINCE',
              content_type: 'product',
              content_ids: ['PRINCE-GE2026'],
              num_items: numItems,
            },
          });
        } catch (e) { /* ne bloque pas le webhook */ }
      }
    }

    return jsonResponse({ received: true });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
