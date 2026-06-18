import { generateTicketPDF } from './_pdf.js';
import { sendTicketEmail } from './_email.js';
import { nocodbPatch, jsonResponse, errorResponse } from './_lib.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { billet_id, email } = body;

    if (!billet_id) return errorResponse('billet_id manquant', 400);
    if (!env.RESEND_API_KEY) return errorResponse('RESEND_API_KEY non configuré', 500);

    const testBillet = {
      Id: billet_id,
      numero_billet: 'PRINCE110726VIF-TEST',
      type: 'plein tarif',
      prix_paye: 19,
      nom: 'Test',
      prenom: 'Debug',
      email_personne: email || 'mk@mathieukuntz.org',
    };

    const steps = [];

    try {
      steps.push('Génération PDF...');
      const pdfBase64 = await generateTicketPDF(testBillet);
      steps.push(`PDF généré: ${pdfBase64.length} chars base64`);

      steps.push('Envoi email via Resend...');
      const result = await sendTicketEmail(env, email || 'mk@mathieukuntz.org', testBillet, pdfBase64);
      steps.push(`Email envoyé: ${JSON.stringify(result)}`);
    } catch (e) {
      steps.push(`ERREUR: ${e.message}`);
      steps.push(`Stack: ${e.stack || 'no stack'}`);
    }

    return jsonResponse({ steps });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
