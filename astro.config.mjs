// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://show.mathieukuntz.org',
  output: 'static',
  build: {
    assets: '_assets',
  },
});