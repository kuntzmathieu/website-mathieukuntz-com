const RESEND_API = 'https://api.resend.com/emails';

export async function sendTicketEmail(env, toEmail, billet, pdfBase64) {
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
      <p style="color:#F2EFEA;font-size:14px;opacity:0.6;margin:4px 0 0 0;">11 juillet 2026 · 20h · Salle polyvalente Louis Maisonat, Vif</p>
    </div>

    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(232,199,106,0.2);border-radius:16px;padding:32px;margin-bottom:24px;">
      <p style="color:#F2EFEA;font-size:16px;line-height:1.6;margin:0 0 16px 0;">
        Bonjour <strong>${billet.prenom}</strong>,
      </p>
      <p style="color:#F2EFEA;font-size:15px;line-height:1.6;opacity:0.85;margin:0 0 24px 0;">
        Voici votre billet pour le spectacle PRINCE. Présentez-le à l'entrée le soir de la représentation.
      </p>

      <div style="background:rgba(0,0,0,0.3);border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="color:#E8C76A;font-size:11px;letter-spacing:2px;margin:0 0 8px 0;">NUMÉRO DE BILLET</p>
        <p style="color:#F2EFEA;font-size:18px;font-weight:700;margin:0 0 16px 0;font-family:monospace;">${billet.numero_billet}</p>
        <p style="color:#F2EFEA;font-size:14px;margin:0 0 4px 0;">${billet.prenom} ${billet.nom}</p>
        <p style="color:#F2EFEA;font-size:13px;opacity:0.6;margin:0;">${billet.type} · ${billet.prix_paye}€</p>
      </div>

      <div style="background:rgba(0,0,0,0.3);border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="color:#E8C76A;font-size:11px;letter-spacing:2px;margin:0 0 8px 0;">LIEU</p>
        <p style="color:#F2EFEA;font-size:14px;margin:0 0 4px 0;">Salle polyvalente Louis Maisonat</p>
        <p style="color:#F2EFEA;font-size:13px;opacity:0.6;margin:0 0 4px 0;">43 Rue du 19 Mars 1962</p>
        <p style="color:#F2EFEA;font-size:13px;opacity:0.6;margin:0;">38450 Vif</p>
      </div>

      <div style="background:rgba(0,0,0,0.3);border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="color:#E8C76A;font-size:11px;letter-spacing:2px;margin:0 0 8px 0;">HORAIRES</p>
        <p style="color:#F2EFEA;font-size:14px;margin:0 0 4px 0;">Ouverture des portes : 19h30</p>
        <p style="color:#F2EFEA;font-size:14px;margin:0 0 4px 0;">Fermeture des portes : 19h55</p>
        <p style="color:#F2EFEA;font-size:14px;margin:0 0 12px 0;">Début du spectacle : 20h</p>
        <p style="color:#F2EFEA;font-size:13px;opacity:0.85;line-height:1.6;margin:0;">
          Afin de garantir un bon spectacle à tous, aucune entrée ne sera possible après la fermeture des portes. On vous conseille donc de bien vous organiser !
        </p>
      </div>

      <div style="background:rgba(0,0,0,0.3);border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="color:#E8C76A;font-size:11px;letter-spacing:2px;margin:0 0 8px 0;">SUR PLACE</p>
        <p style="color:#F2EFEA;font-size:13px;opacity:0.85;line-height:1.6;margin:0 0 8px 0;">
          Buvette et snack disponibles avant et après le spectacle, au profit de l'association XXX.
        </p>
        <p style="color:#F2EFEA;font-size:13px;opacity:0.85;line-height:1.6;margin:0;">
          Parking gratuit sur place.
        </p>
      </div>

      <p style="color:#F2EFEA;font-size:14px;line-height:1.6;opacity:0.7;margin:0;">
        Le billet PDF est joint à cet email. Conservez-le précieusement.
      </p>
    </div>

    <p style="color:#F2EFEA;font-size:12px;opacity:0.4;text-align:center;line-height:1.6;margin:0;">
      Questions ? Répondez à cet email ou écrivez à mk@mathieukuntz.org
    </p>
  </div>
</body>
</html>`;

  const body = {
    from: 'PRINCE <billets@mathieukuntz.com>',
    to: [toEmail],
    reply_to: 'mk@mathieukuntz.org',
    subject: `Votre billet — PRINCE · ${billet.numero_billet}`,
    html,
    attachments: [{
      filename: `billet-${billet.numero_billet}.pdf`,
      content: pdfBase64,
    }],
  };

  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend ${res.status}: ${err}`);
  }
  return res.json();
}
