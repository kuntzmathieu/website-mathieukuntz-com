import { nocodbGet, nocodbPatch, jsonResponse, errorResponse } from '../_lib.js';
import { requireAdmin } from './_auth.js';

const INVITATIONS_TABLE = 'm98ogwuxup4lo22';
const RESEND_API = 'https://api.resend.com/emails';

export async function onRequestPost({ request, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;

  try {
    const body = await request.json().catch(() => ({}));
    const mode = body.mode === 'send' ? 'send' : 'dry_run';
    const limit = Math.min(20, Math.max(1, parseInt(body.limit, 10) || 5));
    const offset = Math.max(0, parseInt(body.offset, 10) || 0);

    const table = env.NOCODB_TABLE_INVITATIONS || INVITATIONS_TABLE;
    const data = await nocodbGet(env, table, {
      where: '(email_envoye,eq,false)',
      limit,
      offset,
      sort: 'Id',
    });
    const rows = (data.list || []).filter((row) => !row.utilise);

    if (mode === 'dry_run') {
      return jsonResponse({
        mode,
        count: rows.length,
        rows: rows.map((row) => ({
          id: row.Id,
          code: row.code,
          prenom: row.prenom,
          nom: row.nom,
          email: row.email,
          lien: `https://mathieukuntz.com/prince/invitation?code=${encodeURIComponent(row.code)}`,
        })),
      });
    }

    if (!env.RESEND_API_KEY) return errorResponse('RESEND_API_KEY non configuré', 500);

    const results = [];
    for (const row of rows) {
      if (!row.email) {
        results.push({ id: row.Id, code: row.code, status: 'email_manquant' });
        continue;
      }
      try {
        const html = invitationEmailHtml(row);
        const res = await fetch(RESEND_API, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'PRINCE <billets@mathieukuntz.com>',
            to: [row.email],
            reply_to: 'mk@mathieukuntz.org',
            subject: 'Votre invitation pour PRINCE · 10 décembre 2026',
            html,
          }),
        });
        if (!res.ok) {
          const err = await res.text();
          await nocodbPatch(env, table, row.Id, { erreur_envoi: `Resend ${res.status}: ${err}` });
          results.push({ id: row.Id, code: row.code, status: 'erreur', error: `Resend ${res.status}` });
          continue;
        }
        await nocodbPatch(env, table, row.Id, {
          email_envoye: true,
          date_envoi: new Date().toISOString(),
          erreur_envoi: '',
        });
        results.push({ id: row.Id, code: row.code, status: 'envoye' });
      } catch (err) {
        await nocodbPatch(env, table, row.Id, { erreur_envoi: err.message }).catch(() => {});
        results.push({ id: row.Id, code: row.code, status: 'erreur', error: err.message });
      }
    }

    return jsonResponse({ mode, processed: results.length, results });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

function invitationEmailHtml(row) {
  const prenom = escapeHtml(row.prenom || '');
  const nom = escapeHtml(row.nom || '');
  const code = escapeHtml(row.code || '');
  const lien = `https://mathieukuntz.com/prince/invitation?code=${encodeURIComponent(row.code)}`;
  const lienManuel = 'https://mathieukuntz.com/prince/invitation';
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0A0A14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#E8C76A;font-size:28px;letter-spacing:4px;margin:0;font-weight:700;">PRINCE</h1>
      <p style="color:#F2EFEA;font-size:14px;opacity:0.6;margin:4px 0 0 0;">10 décembre 2026 · 20h00 · Salle Centrale de la Madeleine, Genève</p>
    </div>

    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(232,199,106,0.2);border-radius:16px;padding:32px;margin-bottom:24px;">
      <p style="color:#F2EFEA;font-size:16px;line-height:1.6;margin:0 0 16px 0;">Bonjour <strong>${prenom}</strong>,</p>

      <p style="color:#F2EFEA;font-size:15px;line-height:1.6;opacity:0.85;margin:0 0 16px 0;">
        Vous étiez présent·e à la première représentation du spectacle PRINCE à Vif en juillet et je vous en remercie encore.
      </p>
      <p style="color:#F2EFEA;font-size:15px;line-height:1.6;opacity:0.85;margin:0 0 16px 0;">
        La prochaine date est sortie ! Le 10 décembre prochain, à Genève (Suisse), au Théâtre de la Salle Centrale La Madeleine !
      </p>
      <p style="color:#F2EFEA;font-size:15px;line-height:1.6;opacity:0.85;margin:0 0 16px 0;">
        Comme promis, j'ai le plaisir de vous offrir une place à votre nom pour cette prochaine représentation.
      </p>
      <p style="color:#F2EFEA;font-size:15px;line-height:1.6;opacity:0.85;margin:0 0 24px 0;">
        Si cela vous intéresse, vous n'avez qu'à la demander en cliquant sur ce lien :
      </p>

      <div style="text-align:center;margin:32px 0;">
        <a href="${lien}" style="display:inline-block;padding:16px 40px;background:#E8C76A;color:#0A0A14;font-weight:700;font-size:14px;letter-spacing:2px;text-transform:uppercase;border-radius:9999px;text-decoration:none;">Réserver ma place</a>
      </div>

      <div style="background:rgba(0,0,0,0.3);border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="color:#E8C76A;font-size:11px;letter-spacing:2px;margin:0 0 8px 0;">VOTRE CODE PERSONNEL</p>
        <p style="color:#F2EFEA;font-size:20px;font-weight:700;margin:0;font-family:monospace;letter-spacing:1px;">${code}</p>
      </div>

      <p style="color:#F2EFEA;font-size:13px;line-height:1.7;opacity:0.7;margin:0 0 16px 0;">
        Si le bouton ne fonctionne pas, rentrez manuellement ce lien dans un navigateur :
        <a href="${lienManuel}" style="color:#E8C76A;text-decoration:underline;">${lienManuel}</a>
        puis renseignez votre code personnel unique d'invitation : <strong style="color:#F2EFEA;">${code}</strong>.
        Attention, n'utilisez pas ce code sur la page de réservation publique, il ne fonctionnera pas.
      </p>

      <p style="color:#F2EFEA;font-size:13px;line-height:1.7;opacity:0.7;margin:0 0 16px 0;">
        Cette invitation est réservée à <strong style="color:#F2EFEA;">${prenom} ${nom}</strong>.
        Le billet n'est pas transférable. Un seul billet par code.
      </p>

      <p style="color:#F2EFEA;font-size:13px;line-height:1.7;opacity:0.7;margin:0 0 24px 0;">
        Vous pourrez vérifier votre prénom, votre nom et votre année de naissance sur la page.
        Seul l'email est modifiable si besoin. Si vous pensez qu'il y a une erreur, répondez à cet email.
      </p>

      <p style="color:#F2EFEA;font-size:15px;line-height:1.6;opacity:0.85;margin:0 0 8px 0;">
        Au plaisir de vous voir à Genève le 10 décembre, et à une prochaine sinon !
      </p>
      <p style="color:#F2EFEA;font-size:15px;line-height:1.6;margin:0;">Mathieu</p>
    </div>

    <p style="color:#F2EFEA;font-size:12px;opacity:0.4;text-align:center;line-height:1.6;margin:0;">
      Questions ? Répondez à cet email ou écrivez à mk@mathieukuntz.org.
    </p>
  </div>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
