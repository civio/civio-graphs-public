import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
const civio = pkg.civio || {};

// Parse command-line arguments
const args = process.argv.slice(2);

// Show help
if (args.includes('--help') || args.includes('-h')) {
	console.log(`
📊 Generador de breakpoints para iframes responsivos

Uso:
  npm run iframe [opciones]

Opciones:
  --selector=<id>          ID del elemento a medir sin hashtag (default: procesa ambos modos)
                           Ejemplos:
                             --selector=compatibilidades-jueces-formacion
                             --selector=compatibilidades-jueces-completo

  --languages=<langs>      Idiomas a procesar separados por comas (default: es)
                           Ejemplo: --languages=es,en,ca

  --per-chart              Genera un snippet por cada combinación CCAA × tipo
                           de gráfico (19 × 2 = 38 snippets) y un manifest en
                           src/embed/embedSnippets.json para el ShareButton.

  --help, -h              Mostrar esta ayuda

Ejemplos:
	npm run iframe
    (procesa ambos modos en español)

  npm run iframe --languages=es,en
    (procesa ambos modos en español e inglés)

  npm run iframe --selector=compatibilidades-jueces-formacion
    (procesa solo Formación en español)

  npm run iframe --selector=compatibilidades-jueces-completo --languages=es,en
    (procesa solo completo en español e inglés)
`);
	process.exit(0);
}

// Get selector from arguments (eg: --selector=compatibilidades-jueces-completo)
const selectorArg = args.find((arg) => arg.startsWith('--selector='));
const customSelector = selectorArg ? selectorArg.split('=')[1].replace(/['"#]/g, '') : null;

// Get languages from arguments (eg: --languages=es,en,ca)
const languagesArg = args.find((arg) => arg.startsWith('--languages='));
const customLanguages = languagesArg
	? languagesArg
		.split('=')[1]
		.split(',')
		.map((l) => l.trim())
	: null;

// Per-chart embed mode: generate one responsive snippet per (CCAA × chart kind).
// Each iframe is loaded with ?ccaa=<id>&chart=<area|laws> so the app renders a
// single chart. Outputs one .md per combo + a manifest JSON consumed by the
// in-app ShareButton popover.
const perChartMode = args.includes('--per-chart');

class SmartIframeOptimizer {
	constructor(config = {}) {
		this.config = {
			url: config.url || 'http://localhost:5173/',
			devCommand:
				config.devCommand ||
				'export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; nvm use; npm run dev',
			breakpoints: config.breakpoints || [
				320, 375, 425, 550, 570, 600, 660, 768, 800, 920, 1024, 1200,
			],
			waitTime: config.waitTime || 100,
			heightThreshold: config.heightThreshold || 5,
			containerName: config.containerName || 'civio-graph',
			serverStartupTime: config.serverStartupTime || 5000,
			maxRetries: config.maxRetries || 30,
			retryDelay: config.retryDelay || 1000,
			marginBottom: config.marginBottom || 15,
			outputDir: config.outputDir || 'public/iframes',
			...config,
		};
		this.devProcess = null;
		this.serverStartedByUs = false;
	}

	async checkServerStatus() {
		try {
			const response = await fetch(this.config.url, {
				method: 'HEAD',
				signal: AbortSignal.timeout(3000),
			});
			return response.ok;
		} catch (error) {
			return false;
		}
	}

	async startDevServer() {
		console.log('🚀 Iniciando servidor de desarrollo...');

		return new Promise((resolve, reject) => {
			// Execute npm run dev
			const [command, ...args] = this.config.devCommand.split(' ');
			this.devProcess = spawn(command, args, {
				stdio: 'pipe',
				shell: true,
				detached: true, // Create separate process group to kill all
			});

			let serverStarted = false;

			// Listen to output to detect when server is ready
			this.devProcess.stdout.on('data', (data) => {
				const output = data.toString();
				console.log(`📡 Server: ${output.trim()}`);

				// Detect patterns indicating server is ready
				if (
					!serverStarted &&
					(output.includes('Local:') ||
						output.includes('localhost:5173') ||
						output.includes('ready in') ||
						output.includes('Running at'))
				) {
					serverStarted = true;
					setTimeout(() => resolve(), this.config.serverStartupTime);
				}
			});

			this.devProcess.stderr.on('data', (data) => {
				console.error(`❌ Server Error: ${data.toString()}`);
			});

			this.devProcess.on('error', (error) => {
				reject(new Error(`Error starting server: ${error.message}`));
			});

			// Safety timeout
			setTimeout(() => {
				if (!serverStarted) {
					console.log('⏱️  Timeout alcanzado, continuando...');
					resolve();
				}
			}, 15000);
		});
	}

	async waitForServer() {
		console.log('⏳ Esperando a que el servidor esté disponible...');

		for (let i = 0; i < this.config.maxRetries; i++) {
			const isRunning = await this.checkServerStatus();

			if (isRunning) {
				console.log('✅ Servidor disponible!');
				return true;
			}

			console.log(`🔄 Intento ${i + 1}/${this.config.maxRetries}...`);
			await new Promise((resolve) => setTimeout(resolve, this.config.retryDelay));
		}

		throw new Error('❌ No se pudo conectar al servidor después de múltiples intentos');
	}

	async ensureServerRunning() {
		const isRunning = await this.checkServerStatus();

		if (isRunning) {
			console.log('✅ El servidor ya está corriendo');
			this.serverStartedByUs = false;
			return;
		}

		console.log('🔍 No se detectó servidor corriendo en', this.config.url);
		this.serverStartedByUs = true;
		await this.startDevServer();
		await this.waitForServer();
	}

	async measureHeights(language = 'es', extraParams = {}) {
		const browser = await chromium.launch({
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		});
		const page = await browser.newPage();

		const measurements = [];

		try {
			for (const width of this.config.breakpoints) {
				console.log(`📏 Midiendo ancho: ${width}px...`);

				// Default to a minimal viewport height to avoid inflated wrapper
				// measurements. Per-chart embed mode overrides this because the
				// StackedChart sizes itself from `window.innerHeight`.
				await page.setViewportSize({
					width,
					height: this.config.viewportHeight ?? 100,
				});

				// Build URL with lang + any extra query params (e.g. ccaa, chart).
				const params = new URLSearchParams();
				if (language && language !== 'es') params.set('lang', language);
				for (const [k, v] of Object.entries(extraParams)) {
					if (v != null) params.set(k, v);
				}
				const qs = params.toString();
				const url = qs ? `${this.config.url}?${qs}` : this.config.url;

				// Navigate to page
				await page.goto(url, {
					waitUntil: 'networkidle',
					timeout: 30000,
				});

				// Wait for content to stabilize
				await page.waitForTimeout(this.config.waitTime);

				// Measure height using boundingRect of the wrapper that actually
				// exists in the DOM. In per-chart mode the snippet's wrapper id
				// (config.elementId) differs from the host wrapper that Vite
				// renders (config.measureId, defaults to the snippet id).
				const targetId = this.config.measureId ?? this.config.elementId;
				const height = await page.evaluate((elementId) => {
					const element = document.getElementById(elementId);
					if (!element) return null;

					// Get actual height of rendered content
					const rect = element.getBoundingClientRect();
					return rect.height;
				}, targetId);

				if (height !== null) {
					const finalHeight = Math.ceil(height);
					measurements.push({
						width,
						height: finalHeight + this.config.marginBottom,
					});

					console.log(`  ✓ Altura: ${finalHeight}px`);
				}
			}
		} finally {
			await browser.close();
		}

		return measurements;
	}

	optimizeMeasurements(measurements) {
		const optimized = [];

		for (let i = 0; i < measurements.length; i++) {
			const current = measurements[i];
			const previous = optimized[optimized.length - 1];

			// Always add first breakpoint
			if (i === 0) {
				optimized.push(current);
				continue;
			}

			// Only add if height difference is significant
			if (!previous || Math.abs(current.height - previous.height) > this.config.heightThreshold) {
				optimized.push(current);
			}
		}

		return optimized;
	}

	generateCSS(measurements, { iframeSrc, includeHeader = true } = {}) {
		const optimized = this.optimizeMeasurements(measurements);

		let css = '';
		if (includeHeader) {
			css += `/* CSS auto-generated with Playwright */\n`;
			css += `/* Date: ${new Date().toISOString()} */\n`;
		}

		const src = iframeSrc ?? `https://graphs.civio.es/${civio.projectPath}/dist`;

		// iframe container
		css += `<div style="container-type: inline-size; container-name: civio-graph;">\n`;
		css += `    <div id="${this.config.elementId}">\n`;
		css += `        <iframe loading="lazy" height=100% scrolling="yes" src="${src}" vspace="0" width="100%" frameborder="0"></iframe>\n`;
		css += `    </div>\n`;
		css += `</div>\n\n`;

		// CSS base
		css += `<style>\n`;
		css += `#${this.config.elementId} {\n`;
		css += `    position: relative;\n`;
		css += `    overflow: hidden;\n`;
		css += `    padding-top: ${optimized[0].height}px;\n`;
		css += `    margin: 2rem 0;\n`;
		css += `    overflow-y: auto;\n`;
		css += `    scrollbar-gutter: stable;\n`;
		css += `}\n`;
		css += `#${this.config.elementId} > iframe {\n`;
		css += `    position: absolute;\n`;
		css += `    top: 0;\n`;
		css += `    left: 0;\n`;
		css += `    width: 100%;\n`;
		css += `    height: 100%;\n`;
		css += `}\n`;

		// Additional media queries
		for (let i = 1; i < optimized.length; i++) {
			const { width, height } = optimized[i];
			css += `@container ${this.config.containerName} (min-width: ${width}px) {\n`;
			css += `    #${this.config.elementId} {\n`;
			css += `        padding-top: ${height}px;\n`;
			css += `    }\n`;
			css += `}\n`;

			if (i === optimized.length - 1) {
				css += `</style>`;
			}
		}

		return css;
	}

	generateReportSection(measurements) {
		const optimized = this.optimizeMeasurements(measurements);

		let section = `### Todas las medidas\n\n`;
		section += `| Ancho | Altura | Diferencia |\n`;
		section += `|-------|--------|------------|\n`;

		measurements.forEach((m, i) => {
			const diff = i > 0 ? m.height - measurements[i - 1].height : 0;
			section += `| ${m.width}px | ${m.height}px | ${diff > 0 ? '+' : ''}${diff}px |\n`;
		});

		section += `\n### Breakpoints optimizados\n\n`;
		section += `| Ancho | Altura |\n`;
		section += `|-------|---------|\n`;

		optimized.forEach((m) => {
			section += `| ${m.width}px | ${m.height}px |\n`;
		});

		return section;
	}

	cleanup() {
		if (this.serverStartedByUs && this.devProcess && !this.devProcess.killed) {
			console.log('🛑 Cerrando servidor de desarrollo iniciado por este proceso...');

			try {
				// On Unix systems, kill entire process group
				if (process.platform !== 'win32') {
					// Use -pid to kill process group
					process.kill(-this.devProcess.pid, 'SIGTERM');

					// Force close if no response after 2 seconds
					setTimeout(() => {
						try {
							process.kill(-this.devProcess.pid, 'SIGKILL');
						} catch (e) {
							// Process already dead, ignore error
						}
					}, 2000);
				} else {
					// On Windows, use taskkill to kill process tree
					this.devProcess.kill('SIGTERM');
					setTimeout(() => {
						if (!this.devProcess.killed) {
							this.devProcess.kill('SIGKILL');
						}
					}, 2000);
				}
			} catch (error) {
				// If it fails, try killing only main process
				try {
					this.devProcess.kill('SIGKILL');
				} catch (e) {
					// Process already dead
				}
			}
		} else if (!this.serverStartedByUs) {
			console.log('ℹ️  Dejando el servidor corriendo (ya estaba activo antes)');
		}
	}
}

// Per-chart embed flow: generate one responsive snippet per (CCAA × chart kind).
// Each combo is loaded as ?ccaa=<id>&chart=<area|laws> on the same dev server,
// so the existing measurement pipeline is reused (a single `#despiece-ccaa`
// element on the page that contains only the embedded chart). Output naming
// matches what `ShareContainer.svelte` fetches at runtime:
//   {appId}-{ccaaId}-{chartKind}-{lang}-responsive.md
async function runPerChartMode(serverManager, languages) {
	// Dynamic import — keeps Node ESM happy and avoids loading the catalog when
	// the script is invoked in the legacy single-iframe mode.
	const { CCAAS } = await import('./src/states/ccaaCatalog.js');
	const ccaaIds = Object.keys(CCAAS);
	const chartKinds = ['area', 'laws'];

	const outputDir = serverManager.config.outputDir;
	if (outputDir !== '.' && !fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	let consolidatedReport = '';
	let processed = 0;
	const total = languages.length * ccaaIds.length * chartKinds.length;

	for (const lang of languages) {
		for (const ccaaId of ccaaIds) {
			for (const chartKind of chartKinds) {
				processed++;
				const embedID = `${civio.appId}-${ccaaId}-${chartKind}`;
				const iframeSrc =
					`https://graphs.civio.es/${civio.projectPath}/dist/` +
					`?ccaa=${ccaaId}&chart=${chartKind}` +
					(lang !== 'es' ? `&lang=${lang}` : '');

				// Use a fresh optimizer per combo so config.elementId drives the
				// generated <div id="..."> in the iframe snippet. The DOM wrapper
				// Vite renders is always `#${civio.appId}` regardless of which
				// chart is embedded, so we measure that. The taller viewport
				// matters because StackedChart computes its SVG height from
				// `window.innerHeight` (`min(innerHeight * 0.4, 400)`).
				const optimizer = new SmartIframeOptimizer({
					elementId: embedID,
					measureId: civio.appId,
					viewportHeight: 1200,
				});

				console.log(`\n${'='.repeat(60)}`);
				console.log(
					`📦 ${processed}/${total}: ${ccaaId} · ${chartKind} (${lang.toUpperCase()})`
				);
				console.log(`${'='.repeat(60)}`);

				const measurements = await optimizer.measureHeights(lang, {
					ccaa: ccaaId,
					chart: chartKind,
				});
				const css = optimizer.generateCSS(measurements, { iframeSrc });

				// Filename mirrors the URL ShareContainer fetches:
				//   https://graphs.civio.es/{projectPath}/dist/iframes/{embedID}-{lang}-responsive.md
				const filename = `${embedID}-${lang}-responsive.md`;
				fs.writeFileSync(path.join(outputDir, filename), css);

				consolidatedReport += `\n## ${ccaaId} · ${chartKind} (${lang})\n\n`;
				consolidatedReport += optimizer.generateReportSection(measurements);
				consolidatedReport += `\n---\n`;
			}
		}
	}

	const reportHeader = `# Reporte de iframes per-chart\n**Fecha:** ${new Date().toISOString()}\n\n---\n`;
	fs.writeFileSync('breakpoints-report.md', reportHeader + consolidatedReport);

	console.log(`\n${'='.repeat(60)}`);
	console.log(`✅ ${total} snippets generados en ${outputDir}/`);
	console.log(`✅ Reporte: breakpoints-report.md`);
	console.log(`${'='.repeat(60)}\n`);
}

// Execute
async function main() {
	const languages = customLanguages || civio.languages || ['es']; // From CLI, package.json or default
	const charts = customSelector ? [customSelector] : [civio.appId];

	console.log(`🔄 Procesando ${charts.length} modo(s) en ${languages.length} idioma(s)...\n`);

	// Create shared optimizer to manage server
	const serverManager = new SmartIframeOptimizer({ elementId: charts[0] });

	// Handle interruption signals for shared server
	const cleanup = () => {
		console.log('\n🛑 Interrupción detectada, limpiando...');
		serverManager.cleanup();
		process.exit(0);
	};

	process.on('SIGINT', cleanup);
	process.on('SIGTERM', cleanup);

	try {
		// Start server only once
		await serverManager.ensureServerRunning();

		if (perChartMode) {
			await runPerChartMode(serverManager, languages);
			return;
		}

		let consolidatedReport = ''; // Accumulator for report
		let totalProcessed = 0;
		const totalTasks = languages.length * charts.length;

		// Outer loop: languages
		for (const lang of languages) {
			// Inner loop: modes
			for (const chart of charts) {
				totalProcessed++;
				const optimizer = new SmartIframeOptimizer({ elementId: chart });

				console.log(`\n${'='.repeat(60)}`);
				console.log(
					`📦 Procesando ${totalProcessed}/${totalTasks}: ${chart} (${lang.toUpperCase()})`
				);
				console.log(`${'='.repeat(60)}\n`);

				try {
					console.log('🎯 Iniciando optimización de iframe...');
					console.log(`🆔 Element ID: ${optimizer.config.elementId}`);
					console.log(`🌐 Idioma: ${lang}`);

					console.log('\n📊 Midiendo alturas...');
					const measurements = await optimizer.measureHeights(lang);

					console.log('\n🎨 Generando CSS...');
					const css = optimizer.generateCSS(measurements);

					// Guardar archivo responsive individual
					const outputDir = optimizer.config.outputDir;
					const responsivePath = path.join(outputDir, `${chart}-${lang}-responsive.md`);

					// Crear directorio si no existe
					if (outputDir !== '.' && !fs.existsSync(outputDir)) {
						fs.mkdirSync(outputDir, { recursive: true });
					}

					fs.writeFileSync(responsivePath, css);

					console.log('\n✅ Archivo responsive generado:');
					console.log(`  - ${responsivePath}`);

					// Accumulate in consolidated report
					consolidatedReport += `\n## ${chart} (${lang})\n\n`;
					consolidatedReport += optimizer.generateReportSection(measurements);
					consolidatedReport += `\n---\n`;

					console.log('\n📋 Resumen de breakpoints:');
					const optimized = optimizer.optimizeMeasurements(measurements);
					optimized.forEach((m) => {
						console.log(`  ${m.width}px -> ${m.height}px`);
					});
				} catch (error) {
					console.error(`❌ Error procesando ${chart} (${lang}):`, error.message);
					throw error;
				}
			}
		}

		// Write consolidated report once at the end
		const reportHeader = `# Reporte Consolidado de Breakpoints\n**Fecha:** ${new Date().toISOString()}\n\n---\n`;
		fs.writeFileSync('breakpoints-report.md', reportHeader + consolidatedReport);

		console.log(`\n${'='.repeat(60)}`);
		console.log('✅ Todos los gráficos procesados exitosamente');
		console.log('✅ Report consolidado generado: breakpoints-report.md');
		console.log(`${'='.repeat(60)}\n`);
	} finally {
		// Close server at the very end
		serverManager.cleanup();
		process.removeListener('SIGINT', cleanup);
		process.removeListener('SIGTERM', cleanup);
	}
}

// Execute
main().catch((error) => {
	console.error('💥 Error fatal:', error);
	process.exit(1);
});
