import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const civio = pkg.civio || {};

// https://vitejs.dev/config/

// JS & CSS name without hash
// https://stackoverflow.com/questions/73244322/how-to-specify-what-will-be-the-export-build-js-and-css-filenames-in-svelte
// Official documentation
// https://rollupjs.org/configuration-options/#output-entryfilenames
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
				entryFileNames: 'assets/[name].js', //JS
				assetFileNames: 'assets/[name].[ext]', //CSS
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
					.replace(/__APP_ID__/g, civio.appId || '')
					.replace(/assets\/index\.js/g, `assets/index.js?v=${timestamp}`)
					.replace(/assets\/index\.css/g, `assets/index.css?v=${timestamp}`);
			},
		},
	],
});
