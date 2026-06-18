import Stripe from 'stripe';
import { jsonResponse, errorResponse } from './_lib.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function onRequestGet({ request }) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id');
    if (!sessionId) return errorResponse('session_id manquant', 400);

    const session = await stripe.checkout.sessions.retrieve(sessionId);

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
