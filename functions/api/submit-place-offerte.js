import { errorResponse } from './_lib.js';

export async function onRequestPost() {
  return errorResponse('Le formulaire Vif est clôturé.', 410);
}
