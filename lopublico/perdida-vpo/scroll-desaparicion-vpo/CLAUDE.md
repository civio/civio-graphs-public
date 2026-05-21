# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow

Before making any file edits or starting implementation, FIRST provide a concise summary of findings/plan to the user and wait for confirmation. Do not spend excessive time reading files without delivering intermediate findings.

## Code Review

When performing code reviews, ALWAYS use the `svelte-code-writer` skill for any Svelte (`.svelte`) file validation. Do not skip this step even if the review seems straightforward.

## Project Overview

**Desaparición VPO acumulada** — visualización Civio (área `lopublico`) sobre la evolución del parque de vivienda protegida en España (1991–2030, con proyección desde 2026; 2025 es el último año con datos reales). Stack: Svelte 5 (runes), D3, Vite. Scrollytelling implementado con un componente `Scrolly.svelte` propio basado en `IntersectionObserver` (NO usa `@sveltejs/svelte-scroller`).

La narrativa son 6 pasos: parque construido → protección permanente vs temporal → pérdida de VPOs → descalificación voluntaria → proyección a 2030 → exploración libre con 4 dimensiones (protección, plan, promotor, tenencia).

## Commands

```bash
# Development
npm run dev              # Vite dev server (localhost:5173)
npm run build            # Production build → dist/
npm run preview          # Preview production build

# Linting
npm run lint             # Oxlint sobre src/
npm run lint:fix         # Auto-fix
npm run lint:deps        # Knip — código muerto y deps sin usar
npm run lint:all         # lint + lint:deps

# Formatting
npm run format           # Prettier
npm run format:check

# Iframe generation (Playwright)
npm run iframe                                    # todos los charts, es
npm run iframe --languages=es,en                  # multi-idioma
npm run iframe --selector=chart-id                # un solo chart
npm run iframe --selector=chart-id --languages=en
npm run iframe:public                             # salida a public/
```

Node: `v24.13.0` (ver `.nvmrc`). Antes de comandos npm/npx: `source ~/.nvm/nvm.sh && nvm use`.

## Architecture

### Entry point y bootstrap

`index.html` contiene `<div id="__APP_ID__">` (el ID se inyecta desde `package.json → civio.appId` vía `vite.config.js`). `src/main.js` monta `App.svelte` leyendo atributos del target: `lang`, `data-a11y`, `data-alt` y `id` (se pasa como `chartID`). `App.svelte` carga el CSV remoto (`https://data.civio.es/lopublico/desaparicion-vpo/graficos/journalist.csv`) en `onMount` mediante `data.loadFromUrl(...)`, fija el idioma e inyecta las variables CSS de color scopeadas a `#${chartID}` mediante un bloque `<style>` emitido con `{@html}`.

### Estado reactivo (runes)

Todo el estado vive en `src/states/`:

- **`data.svelte.js`** — clase `Data` con `value` (`$state(undefined)`), `loading`, `error` y `years` (rango 1991–2030 inclusivo, `range(1991, 2031)`). Método `loadFromUrl(url)` async e idempotente: comparte la misma promesa entre llamadas concurrentes y descarta filas con `value <= 0` o `year < 1991`. Funciones puras de agregación exportadas:
  - `summarize(rows, year)` → totales por estado de protección + `built` acumulado.
  - `summarizeByPlan(rows, year)` → totales por bucket de plan (`estatal | autonomico | sinInfo | lost`).
  - `summarizeByPromotor(rows, year)` → totales por bucket de promotor (`publico | privado | autopromotor | sinAnimoLucro | sinInfo | lost`).
  - `summarizeByTenencia(rows, year)` → totales por bucket de tenencia (`propiedad | alquiler | mixto | sinInfo | lost`).
  - `getKeyFigures(rows, formatInt)` → cifras destacadas preformateadas (a 2030 y 2025: `builtTotal`, `permanent`, `temporal`, `protected`, `maybe`, `lost`, `lost2025`, `maybeOrLost2025`) que alimentan los textos narrativos de `steps.svelte.js`.
  - Internas (no exportadas): `classifyRow(row, year)` → `'notBuilt' | 'permanent' | 'protected' | 'maybe' | 'lost'`; `classifyPromotor`, `classifyTenencia` para normalizar columnas heterogéneas (mezcla de español/catalán). `parseYear` convierte tokens no numéricos (`"No se permite"`, `"Pendiente"`, `""`, `null`) a `Infinity`; `parseVoluntaryRelease` interpreta `"Sin plazo"` como `-Infinity` (descalificación voluntaria desde día 1).
- **`steps.svelte.js`** — motor narrativo. Ver sección siguiente.
- **`language.svelte.js`** — clase `Lang`, instancia exportada como `vizLang`, con `value` (`$state('es')`) y `setLang(lang)`. Expone `texts`, `formatDecimals`, `formatIntegers` derivados por idioma. `texts` es un objeto anidado por idioma (título, fuente, textos de compartir/embed, a11y y un bloque `mainChart` con `dimensions`, `areaLabels`, `interactionNote` y columnas a11y por dimensión). Los formateadores se importan de `src/utils/locale.js`.
- **`ccaaCatalog.js`** — catálogo canónico de las 19 CCAA (nombres, alias de CSV/JSON, regiones IP). **Actualmente sin uso**: el gráfico solo muestra el agregado nacional. Candidato a eliminar (lo detecta `npm run lint:deps`) salvo que se reserve para un futuro filtrado por CCAA.
- **`utils.svelte.js`** — `urlInfo` (`SvelteURL`: `lang`, `a11y`, `alt`, `isCivio`), `isMobile`, `isTouchDevice` y `prefersReducedMotion` (`MediaQuery`).

### Sistema de pasos y áreas (pieza clave)

`src/states/steps.svelte.js` es el corazón de la narrativa scrollytelling. Codifica, de forma declarativa, qué enseña el gráfico en cada paso:

- **`areaRules`** — por cada área visible (`permanent`, `protected`, `maybe`, `lost`), una lista de reglas `{ from: step, sum: [keys] }`. La última regla cuyo `from ≤ step` gana. Si ninguna aplica, el área suma 0 (no se dibuja). `lost` aparece como capa apilada desde el step 2 (acompaña al texto "300.000 viviendas pierden protección").
- **`stackOrder`** (vista protección, bottom→top): `['permanent', 'protected', 'maybe', 'lost']`.
- **`planStackOrder`** / **`promotorStackOrder`** / **`tenenciaStackOrder`** — orden de apilamiento para las vistas alternativas del paso interactivo.
- **`areaLabels`** — diccionario compartido por leyenda, tooltip y `NumberBoxes` (claves de todos los buckets → etiqueta humana). **Vive en `language.svelte.js`** (`texts.<lang>.mainChart.areaLabels`), NO en este archivo.
- **`visibility`** — umbrales simples: `yAxis: 0`, `builtLine: 0`, `interactive: 5`. Los componentes consultan `step >= visibility.X` para mostrarse.
- **`firstProjectionYear = 2026`** — exportado y usado por el chart, la `BuiltLine` (línea sólida vs discontinua) y el overlay de proyección para mantenerse en sync. 2025 es el último año con datos reales; 2026–2030 es proyección.
- **`xDomainRules`** — el dominio X superior cambia con el step (`firstProjectionYear - 1` por defecto, `2030` desde el step 4). El placeholder `'firstYear'` se resuelve en el consumidor; el consumidor extiende el límite superior +1 para que cada año ocupe un slot completo.
- **`areaSum(areaKey, step)`**, **`xDomain(step, firstYear)`**, **`resolveRule`** — helpers que aplican las reglas anteriores.
- **`texts`** — array de 6 secciones. Cada entrada es `{ text(f), info, a11y(f) }`: `text` y `a11y` son **funciones** de las cifras destacadas `f` (de `getKeyFigures`), de modo que los números de titular vienen de los datos y no están hardcodeados; `info` es la etiqueta corta del `StepIndicator`. No se exporta `totalSteps` — usar `texts.length`.

Al editar la narrativa: modifica `texts`, `areaRules`, `visibility`, `stackOrder`s o `xDomainRules` aquí — los componentes del chart son consumidores pasivos.

### Composición del chart

- **`src/lib/ScrollContainer.svelte`** — wrapper sticky-graphic + sections. Usa `Scrolly` para bindear `index` (paso activo) y `ChartAcumulado` como gráfico sticky. Reserva espacio del selector (`selectorHeight` bindeado desde el chart) incluso cuando está oculto, para mantener el centrado; solo en el último paso usa `full-page` (sin `padding-right`). Lleva `overflow-anchor: none` para evitar saltos de scroll durante animaciones (patrón obligado en scrolly+sticky; ver memory).
- **`src/lib/Scrolly.svelte`** — observador propio basado en `IntersectionObserver` con `threshold` fino (por defecto 100 incrementos). Bindea `value` al índice del hijo "más en viewport". Acepta `root`, `top`, `bottom`, `increments`.
- **`src/lib/ChartAcumulado.svelte`** — orquestador D3. Posee dimensiones, escalas (`scaleX`, `scaleY`) y el estado de hover (`hoveredYear`, `hoveredKey`). Resuelve al vuelo qué `stackOrder`, `summarizeFn` y `getAreaKeys` aplicar según `step` y `planView` — en el paso interactivo (`visibility.interactive`) hay 4 vistas: `protection | plan | promotor | tenencia`. Anima con `Tween` (`svelte/motion`, `cubicOut`, 600 ms) tanto el dominio X superior (2025 ↔ 2030) como el dominio Y (`maxViviendas`). Añade un row sintético al final de `renderData` (espejo del último año + 1) para que `curveStepAfter` dibuje completo el último slot. Clippea el área del chart con un `<clipPath>` para que las animaciones de dominio no se salgan. Reset automático de hover al cambiar de step.
- **`src/lib/chart/`** — subcomponentes *stateless*, driven por props: `StackedAreas`, `BuiltLine`, `XAxis`, `YAxis`, `HoverMarker`, `NumberBoxes`, `ProjectionOverlay`, `TweenedNumber`.
- **`src/lib/RadialSelector.svelte`** — selector de dimensión (radio buttons custom) usado en el paso interactivo. **`StepIndicator.svelte`**, **`TouchIcon.svelte`** — UI auxiliar.
- **`src/lib/footer/`** — `Footer.svelte`, `ShareContainer.svelte`.

**Regla de composición**: `ChartAcumulado` centraliza escalas y hover; los subcomponentes NO mantienen estado propio — reciben props y renderizan. El `step` se normaliza: `rawStep === undefined` (antes del primer section o después del último) se resuelve a `-1` salvo que estemos en el 0.

### Accesibilidad

**Estrategia**: el gráfico visual está enteramente oculto a lectores de pantalla — SVG, `NumberBoxes`, `StepIndicator` y el selector visual llevan `aria-hidden="true"` + `inert`. La narrativa accesible vive en una región etiquetada (`<section aria-label>`) que envuelve 6 `<section>`, una por paso. Cada paso lleva un encabezado `sr-only` (`Paso N de 6: {nombre}`) para navegación por headings, el texto narrativo con las cifras destacadas, una descripción complementaria que describe la **forma** del gráfico (qué capas aparecen, cómo evoluciona el eje) sin repetir cifras, y una tabla cuyas columnas y filas reflejan solo lo pintado en ese paso (revelación progresiva acompasada al scrollytelling). Todo se renderiza estáticamente en cada `<section>` — sin mount/unmount durante el scroll — para no interrumpir la lectura del SR. El selector interactivo del último paso tiene una versión paralela accesible (`<fieldset>` con radios `sr-only`) que duplica el control visual.

- `src/a11y/` — `index.js` reexporta `mainChart.js`, que expone `getMainChartA11y(vizLang, ctx)`: genera la descripción + tabla para lectores de pantalla según el `step` y la `planView` activa. La descripción narrativa por paso sale de `texts[step].a11y(figures)` en `steps.svelte.js`; las columnas y filas de la tabla en la vista `protection` se derivan de `areaSum(key, step)` y `stackOrder`, asegurando que la tabla refleje exactamente lo que se pinta.
- `src/lib/ScreenReaderDescription.svelte` — renderiza un bloque `sr-only` (descripción + tabla) o, en modo `?alt`, una `alt-description` visible.
- Debug: `?a11y` URL param o `data-a11y` attribute → fuerza visibles los `.sr-only` (con scroll horizontal para tablas anchas), pinta los `aria-label` de landmarks y baja opacidad para elementos `aria-hidden`. Las secciones crecen para evitar solapes.
- `?alt` URL param o `data-alt` attribute → activa estilos de la `alt-description`.
- `prefersReducedMotion` (en `utils.svelte.js`) disponible para componentes que quieran respetar la preferencia del usuario.

### Sistema de color

Las paletas se inyectan como CSS custom properties scopeadas al `#chartID` (no globales):

- `--civio-blue`, `--civio-yellow`, `--civio-green`, `--civio-lightYellow`, `--civio-lightGreen` (brand).
- `--primary`, `--secondary`, `--light` (área `lopublico`).
- `--bw0`…`--bw990` (grayscale ramp).

Fuente: `src/utils/colors.js` — exporta `customColorsCSS`, `mainColorsCSS`, `projectColorsCSS`, `bwScaleCSS`.

### Utilidades

- **`src/utils/locale.js`** — `formatIntegers` y `formatDecimals` por idioma (`es`/`en`) construidos con `d3.formatLocale`. También `dateOptions` y `months`.
- **`src/utils/clickOutside.svelte.js`** — attachment de Svelte 5 (`return (element) => { ... cleanup }`) para detectar clicks fuera de un elemento, con opción `exclude` (selector CSS).
- **`src/utils/colors.js`** — paletas y bloques CSS (ver arriba).

## Configuración del proyecto

Identidad y rutas centralizadas en `package.json → civio`:

```json
{
  "civio": {
    "appId": "scroll-desaparicion-vpo",
    "projectPath": "lopublico/perdida-vpo/scroll-desaparicion-vpo",
    "investigationUrl": "https://civio.es/lo-publico/2026/05/21/evolucion-vpo-desde-1991-proteccion-en-vigor-por-comunidades-autonomas/",
    "languages": ["es"]
  }
}
```

`vite.config.js` las inyecta como `__APP_ID__`, `__PROJECT_PATH__`, `__INVESTIGATION_URL__` (para JS/Svelte vía `define`) y sustituye `__APP_ID__` en el HTML. Los assets se emiten sin hash (`assets/index.js`, `assets/index.css`) y se añade cache busting por timestamp en `transformIndexHtml` para dev/prod. `generate-breakpoints.js` (Playwright) lee `package.json` directamente para capturar alturas responsive de los iframes.

## Convenciones

- **Idioma del código**: inglés (variables, funciones, comentarios).
- **Nombres**: camelCase (vars/fns), PascalCase (componentes), kebab-case (CSS).
- **Producción**: sin `console.log` dejados.
- **Linting**: Oxlint con reglas `e18e/*`, `unicorn/*` y calidad básica (ver README para el detalle exhaustivo).
- **Svelte 5**: runes (`$state`, `$derived`, `$effect`, `$props`, `$bindable`). Subcomponentes del chart sin estado.
