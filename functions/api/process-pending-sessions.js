import { nocodbGet, nocodbPatch, jsonResponse, errorResponse } from './_lib.js';

export async function onRequestPost({ request, env }) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token') || request.headers.get('x-admin-token');
    if (token !== env.PRINCE_ADMIN_TOKEN) {
      return errorResponse('Non autorisé', 401);
    }

    // Récupère les sessions en attente non traitées
    const pending = await nocodbGet(env, env.NOCODB_TABLE_PENDING, {
      where: '(email_secours_envoye,eq,false)',
      limit: 50,
    });

    const now = Date.now();
    const DELAY_MS = 5 * 60 * 1000; // 5 minutes
    const results = [];

    for (const session of pending.list || []) {
      const createdAt = new Date(session.created_at).getTime();
      const ageMs = now - createdAt;

      if (ageMs < DELAY_MS) {
        results.push({ session_id: session.stripe_session_id, status: 'too_early', age_min: Math.round(ageMs / 60000) });
        continue;
      }

      // Vérifie si une commande a été créée entre-temps
      const existing = await nocodbGet(env, env.NOCODB_TABLE_COMMANDES, {
        where: `(stripe_session_id,eq,${session.stripe_session_id})`,
      });

      if (existing.list && existing.list.length > 0) {
        // Formulaire rempli → marque comme traité, pas d'email
        await nocodbPatch(env, env.NOCODB_TABLE_PENDING, session.Id, { email_secours_envoye: true });
        results.push({ session_id: session.stripe_session_id, status: 'already_completed' });
        continue;
      }

      // 5 minutes passées et pas de commande → envoie l'email de secours
      if (session.email && env.RESEND_API_KEY) {
        const confirmationUrl = `https://mathieukuntz.com/prince/confirmation?session_id=${session.stripe_session_id}`;
        const montant = session.montant ? session.montant.toFixed(2) : '?';

        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0A0A14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#E8C76A;font-size:28px;letter-spacing:4px;margin:0;font-weight:700;">PRINCE</h1>
      <p style="color:#F2EFEA;font-size:14px;opacity:0.6;margin:4px 0 0 0;">11 juillet 2026 · 20h30 · Vif</p>
    </div>
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(232,199,106,0.2);border-radius:16px;padding:32px;margin-bottom:24px;">
      <p style="color:#F2EFEA;font-size:16px;line-height:1.6;margin:0 0 16px 0;">
        Bonjour,
      </p>
      <p style="color:#F2EFEA;font-size:15px;line-height:1.6;opacity:0.85;margin:0 0 24px 0;">
        Nous avons bien reçu votre paiement de <strong>${montant}€</strong> pour le spectacle PRINCE.
      </p>
      <p style="color:#F2EFEA;font-size:15px;line-height:1.6;opacity:0.85;margin:0 0 24px 0;">
        Pour recevoir vos billets, il ne vous reste plus qu'à compléter les informations des participants :
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${confirmationUrl}" style="display:inline-block;padding:16px 40px;background:#E8C76A;color:#0A0A14;font-weight:700;font-size:14px;letter-spacing:2px;text-transform:uppercase;border-radius:9999px;text-decoration:none;">
          Compléter ma réservation
        </a>
      </div>
      <p style="color:#F2EFEA;font-size:13px;opacity:0.5;line-height:1.6;margin:0;">
        Si vous avez déjà complété le formulaire, ignorez cet email. Vos billets vous ont été envoyés séparément.
      </p>
    </div>
    <p style="color:#F2EFEA;font-size:12px;opacity:0.4;text-align:center;line-height:1.6;margin:0;">
      Questions ? Répondez à cet email, écrivez à mk@mathieukuntz.org ou appelez le 06 43 67 15 11.
    </p>
  </div>
</body>
</html>`;

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'PRINCE <billets@mathieukuntz.com>',
            to: [session.email],
            reply_to: 'mk@mathieukuntz.org',
            subject: 'Finalisez votre réservation — PRINCE',
            html,
          }),
        });
      }

      await nocodbPatch(env, env.NOCODB_TABLE_PENDING, session.Id, { email_secours_envoye: true });
      results.push({ session_id: session.stripe_session_id, status: 'email_sent' });
    }

    return jsonResponse({ processed: results.length, results });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
