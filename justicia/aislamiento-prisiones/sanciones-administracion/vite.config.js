import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const civio = pkg.civio || {};

export default defineConfig({
  base: './',
  define: {
    __APP_ID__: JSON.stringify(civio.appId || ''),
    __PROJECT_PATH__: JSON.stringify(civio.projectPath || ''),
    __INVESTIGATION_URL__: JSON.stringify(civio.investigationUrl || null),
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
  plugins: [
    svelte(),
    {
      name: 'html-transform',
      transformIndexHtml(html) {
        const timestamp = Date.now();
        return html
          .replace(/assets\/index\.js/g, `assets/index.js?v=${timestamp}`)
          .replace(/assets\/index\.css/g, `assets/index.css?v=${timestamp}`);
      },
    },
  ],
});
