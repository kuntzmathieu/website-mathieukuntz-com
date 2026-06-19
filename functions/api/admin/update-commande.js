import { nocodbGet, nocodbPatch, jsonResponse, errorResponse } from '../_lib.js';
import { generateTicketPDF } from '../_pdf.js';
import { sendTicketEmail } from '../_email.js';
import { requireAdmin } from './_auth.js';

export async function onRequestPost({ request, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;

  try {
    const body = await request.json();
    const { commande_id, paiement, note } = body;
    if (!commande_id) return errorResponse('commande_id manquant', 400);

    const prevData = await nocodbGet(env, env.NOCODB_TABLE_COMMANDES, { where: `(Id,eq,${commande_id})`, limit: 1 });
    const prev = (prevData.list || [])[0];
    if (!prev) return errorResponse('Commande introuvable', 404);

    const patchBody = {};
    if (paiement) patchBody.paiement = paiement;
    if (typeof note === 'string') patchBody.note = note;
    if (Object.keys(patchBody).length === 0) return errorResponse('Rien à mettre à jour', 400);

    await nocodbPatch(env, env.NOCODB_TABLE_COMMANDES, commande_id, patchBody);

    const wasUnpaid = prev.paiement === 'à encaisser';
    const isNowPaid = paiement && paiement !== 'à encaisser';

    let emailsSent = [];
    let emailErrors = [];

    if (wasUnpaid && isNowPaid && env.RESEND_API_KEY) {
      const billetsData = await nocodbGet(env, env.NOCODB_TABLE_BILLETS, { where: `(commande,eq,${commande_id})`, limit: 100 });
      for (const b of (billetsData.list || [])) {
        if (b.email_envoye) continue;
        const emailDest = b.email_personne || prev.email_commande;
        if (!emailDest) {
          emailErrors.push({ billet: b.Id, error: 'Pas d\'email destinataire' });
          continue;
        }
        try {
          const pdfBase64 = await generateTicketPDF(b);
          await sendTicketEmail(env, emailDest, b, pdfBase64);
          await nocodbPatch(env, env.NOCODB_TABLE_BILLETS, b.Id, { email_envoye: true });
          emailsSent.push(b.Id);
        } catch (e) {
          emailErrors.push({ billet: b.Id, error: e.message, email: emailDest });
        }
      }
    }

    return jsonResponse({
      success: true,
      commande_id,
      ancien_paiement: prev.paiement,
      nouveau_paiement: paiement || prev.paiement,
      ancienne_note: prev.note || '',
      nouvelle_note: typeof note === 'string' ? note : (prev.note || ''),
      emails_sent: emailsSent,
      email_errors: emailErrors,
    });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
