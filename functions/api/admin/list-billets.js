import { nocodbGet, jsonResponse, errorResponse } from '../_lib.js';
import { requireAdmin } from './_auth.js';

export async function onRequestGet({ request, env }) {
  const denied = requireAdmin(request, env);
  if (denied) return denied;

  try {
    const url = new URL(request.url);
    const checked = url.searchParams.get('checked');
    const params = { limit: 1000, sort: '-Id' };
    if (checked === 'true') params.where = '(checkin,eq,true)';
    if (checked === 'false') params.where = '(checkin,eq,false)';

    const billetsData = await nocodbGet(env, env.NOCODB_TABLE_BILLETS, params);
    const billets = billetsData.list || [];

    const commandesData = await nocodbGet(env, env.NOCODB_TABLE_COMMANDES, { limit: 1000 });
    const commandeMap = {};
    for (const c of (commandesData.list || [])) {
      commandeMap[c.Id] = c;
    }

    const enriched = billets.map((b) => {
      const cmdId = b.commande && typeof b.commande === 'object' ? b.commande.Id : b.commande;
      const cmd = commandeMap[cmdId] || {};
      return {
        ...b,
        paiement_commande: cmd.paiement || '',
        canal_vente_commande: cmd.canal_vente || '',
        note_commande: cmd.note || '',
      };
    });

    return jsonResponse({
      billets: enriched,
      total: enriched.length,
      checked: enriched.filter(b => Boolean(b.checkin)).length,
      pending: enriched.filter(b => !Boolean(b.checkin)).length,
      unpaid: enriched.filter(b => b.paiement_commande === 'à encaisser').length,
    });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
