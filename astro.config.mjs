// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://mathieukuntz.com',
  output: 'static',
  build: {
    assets: '_assets',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
