import { nocodbGet, nocodbPatch, jsonResponse, errorResponse } from '../_lib.js';
import { generateTicketPDF } from '../_pdf.js';
import { sendTicketEmail } from '../_email.js';
import { requireAdmin } from './_auth.js';

export async function onRequestPost({ request, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;

  try {
    const body = await request.json();
    const search = String(body.billet_id || body.numero_billet || '').trim();
    if (!search) return errorResponse('billet_id ou numero_billet manquant', 400);

    let billet = null;
    if (/^\d+$/.test(search)) {
      const data = await nocodbGet(env, env.NOCODB_TABLE_BILLETS, { where: `(Id,eq,${search})`, limit: 1 });
      billet = (data.list || [])[0];
    }
    if (!billet) {
      const data = await nocodbGet(env, env.NOCODB_TABLE_BILLETS, { where: `(numero_billet,eq,${search})`, limit: 1 });
      billet = (data.list || [])[0];
    }
    if (!billet) return errorResponse('Billet introuvable', 404);

    const emailDest = billet.email_personne || '';
    if (!emailDest) return errorResponse("Ce billet n'a pas d'email destinataire. Ajoute-en un dans NocoDB d'abord.", 400);

    if (!env.RESEND_API_KEY) return errorResponse('RESEND_API_KEY non configuré', 500);

    const pdfBase64 = await generateTicketPDF(billet);
    await sendTicketEmail(env, emailDest, billet, pdfBase64);
    await nocodbPatch(env, env.NOCODB_TABLE_BILLETS, billet.Id, { email_envoye: true });

    return jsonResponse({
      success: true,
      billet_id: billet.Id,
      numero_billet: billet.numero_billet,
      email: emailDest,
      nom: `${billet.prenom || ''} ${billet.nom || ''}`.trim(),
    });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}