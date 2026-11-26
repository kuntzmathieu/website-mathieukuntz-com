import { makeAfficheHandler } from './_affiche.js';

export const onRequestGet = makeAfficheHandler({
  source: 'affiche',
  targetPath: '/prince/?src=affiche',
});
