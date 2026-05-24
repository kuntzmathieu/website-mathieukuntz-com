// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://spectacles.mathieukuntz.org',
  output: 'static',

  build: {
    assets: '_assets',
  },

  adapter: cloudflare(),
});