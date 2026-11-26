import { makeAfficheHandler } from './_affiche.js';

export const onRequestGet = makeAfficheHandler({
  source: 'affiche_concorde',
  targetPath: '/prince/?src=affiche_concorde',
});
