import { handleTrackEvent } from './_track.js';

export async function onRequestPost({ request, env }) {
  return handleTrackEvent(request, env, 'PageView');
}
