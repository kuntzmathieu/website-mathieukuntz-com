import { makeAfficheHandler } from './_affiche.js';

export const onRequestGet = makeAfficheHandler({
  source: 'affiche_uni',
  targetPath: '/prince/?src=affiche_uni',
});
