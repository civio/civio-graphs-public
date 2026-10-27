import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
const civio = pkg.civio || {};

// Parse command-line arguments
const args = process.argv.slice(2);

// The three views of the piece (see App.svelte). Each one gets its own iframe
// file, which is what its "Incrustar" button fetches:
// public/iframes/<appId>-<view>-<lang>-responsive.md
const allViews = ['regions', 'congreso', 'senado'];

// Show help
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
📊 Generador de breakpoints para iframes responsivos

Genera un iframe por vista (${allViews.join(', ')}) midiendo cada una con ?view=.
En el carrusel (regions) mide todas las comunidades y se queda con la más alta,
para que ninguna quede cortada.

Uso:
  npm run iframe -- [opciones]   (el -- hace que npm pase las opciones al script)

Opciones:
  --views=<vistas>         Vistas a procesar separadas por comas (default: todas)
                           Ejemplo: --views=congreso,senado

  --languages=<langs>      Idiomas a procesar separados por comas (default: los de package.json)
                           Ejemplo: --languages=es,en

  --help, -h              Mostrar esta ayuda

Ejemplos:
  npm run iframe
    (procesa las tres vistas)

  npm run iframe -- --views=senado
    (procesa solo el Senado)

Después: npm run build, para copiar public/iframes/ a dist/iframes/.
`);
  process.exit(0);
}

// Get views from arguments (eg: --views=congreso,senado)
const viewsArg = args.find((arg) => arg.startsWith('--views='));
const customViews = viewsArg
  ? viewsArg
      .split('=')[1]
      .split(',')
      .map((v) => v.trim())
  : null;

// Get languages from arguments (eg: --languages=es,en,ca)
const languagesArg = args.find((arg) => arg.startsWith('--languages='));
const customLanguages = languagesArg
  ? languagesArg
      .split('=')[1]
      .split(',')
      .map((l) => l.trim())
  : null;

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
      // Sampling step (px) inside each breakpoint range, see measureHeights()
      rangeStep: config.rangeStep || 10,
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

  // Page URL for a view (and language, if not the default one)
  viewUrl(view, language) {
    const params = new URLSearchParams({ view });
    if (language !== 'es') params.set('lang', language);
    return `${this.config.url}?${params}`;
  }

  async measureHeights(view, language = 'es') {
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    // Skip IP geolocation: the carousel then starts on a random region, and we
    // go through all of them anyway.
    await page.route('**/get.geojs.io/**', (route) => route.abort());

    // Height of the embed's root div once the card photos have loaded (the
    // photo has no fixed height, so it would measure short before that).
    const measureRoot = async () => {
      await page.waitForFunction(() =>
        [...document.querySelectorAll('.card img')].every((img) => img.complete)
      );
      await page.waitForTimeout(this.config.waitTime);
      return page.evaluate((appId) => {
        const element = document.querySelector(`.${appId}`);
        return element ? element.getBoundingClientRect().height : null;
      }, civio.appId);
    };

    // Tallest content at the current viewport width. In the carousel the card
    // height depends on the region (long company names wrap), and an iframe has
    // a fixed height, so it goes through all of them.
    const measureWidth = async (width) => {
      await page.setViewportSize({ width, height: 100 });
      if (view !== 'regions') return (await measureRoot()) ?? 0;
      const ids = await page.$$eval('select option', (options) =>
        options.map((o) => o.value).filter(Boolean)
      );
      let height = 0;
      for (const id of ids) {
        await page.selectOption('select', id);
        height = Math.max(height, (await measureRoot()) ?? 0);
      }
      return height;
    };

    const measurements = [];

    try {
      await page.goto(this.viewUrl(view, language), {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      await page.waitForSelector('.card');

      // Each breakpoint's height has to fit its whole range, up to the next
      // breakpoint: the photo scales with the width, so content grows inside a
      // range and a layout switch (media query) can land in the middle of it.
      // Sample the range every `rangeStep` px and keep the tallest.
      const { breakpoints, rangeStep } = this.config;
      for (const [i, width] of breakpoints.entries()) {
        const next = breakpoints[i + 1] ?? width + 1;
        console.log(`📏 Midiendo de ${width}px a ${next - 1}px...`);

        let height = 0;
        for (let w = width; w < next; w += rangeStep) {
          height = Math.max(height, await measureWidth(w));
        }
        if (next - 1 > width) height = Math.max(height, await measureWidth(next - 1));

        if (height) {
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

  generateCSS(measurements, view, language = 'es') {
    const optimized = this.optimizeMeasurements(measurements);
    const params = new URLSearchParams({ view });
    if (language !== 'es') params.set('lang', language);
    const src = `https://graphs.civio.es/${civio.projectPath}/dist/?${params}`;

    let css = `/* CSS auto-generated with Playwright */\n`;
    css += `/* Date: ${new Date().toISOString()} */\n`;

    // iframe container
    css += `<div style="container-type: inline-size; container-name: civio-graph;">\n`;
    css += `    <div id="${this.config.elementId}">\n`;
    css += `        <iframe loading="lazy" height=100% scrolling="no" src="${src}" vspace="0" width="100%" frameborder="0"></iframe>\n`;
    css += `    </div>\n`;
    css += `</div>\n\n`;

    // CSS base
    css += `<style>\n`;
    css += `#${this.config.elementId} {\n`;
    css += `    position: relative;\n`;
    css += `    overflow: hidden;\n`;
    css += `    padding-top: ${optimized[0].height}px;\n`;
    css += `    margin: 2rem 0;\n`;
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

// Execute
async function main() {
  const languages = customLanguages || civio.languages || ['es']; // From CLI, package.json or default
  const views = customViews || allViews;

  const unknown = views.filter((v) => !allViews.includes(v));
  if (unknown.length) {
    console.error(
      `❌ Vista(s) desconocida(s): ${unknown.join(', ')}. Válidas: ${allViews.join(', ')}`
    );
    process.exit(1);
  }

  console.log(`🔄 Procesando ${views.length} vista(s) en ${languages.length} idioma(s)...\n`);

  // Create shared optimizer to manage server
  const serverManager = new SmartIframeOptimizer();

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

    let consolidatedReport = ''; // Accumulator for report
    let totalProcessed = 0;
    const totalTasks = languages.length * views.length;

    // Outer loop: languages
    for (const lang of languages) {
      // Inner loop: views
      for (const view of views) {
        totalProcessed++;
        // Same id the share button builds (chartID in App.svelte), and unique
        // per view so several iframes' CSS don't clash on one page.
        const chart = `${civio.appId}-${view}`;
        const optimizer = new SmartIframeOptimizer({ elementId: chart });

        console.log(`\n${'='.repeat(60)}`);
        console.log(
          `📦 Procesando ${totalProcessed}/${totalTasks}: ${chart} (${lang.toUpperCase()})`
        );
        console.log(`${'='.repeat(60)}\n`);

        try {
          console.log('🎯 Iniciando optimización de iframe...');
          console.log(`🆔 Vista: ${view}`);
          console.log(`🌐 Idioma: ${lang}`);

          console.log('\n📊 Midiendo alturas...');
          const measurements = await optimizer.measureHeights(view, lang);
          if (measurements.length === 0) {
            throw new Error(`No se encontró .${civio.appId} en la página`);
          }

          console.log('\n🎨 Generando CSS...');
          const css = optimizer.generateCSS(measurements, view, lang);

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
