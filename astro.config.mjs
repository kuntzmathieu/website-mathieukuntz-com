// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://spectacles.mathieukuntz.org',
  output: 'static',
  build: {
    assets: '_assets',
  },
});