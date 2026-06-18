import { stripeRequest, jsonResponse, errorResponse } from './_lib.js';

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id');
    if (!sessionId) return errorResponse('session_id manquant', 400);

    const session = await stripeRequest('GET', `/v1/checkout/sessions/${sessionId}`, null, env.STRIPE_SECRET_KEY);

    return jsonResponse({
      session_id: session.id,
      email: session.customer_email || session.customer_details?.email || '',
      montant_total: session.amount_total / 100,
      metadata: session.metadata || {},
      payment_status: session.payment_status,
    });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
