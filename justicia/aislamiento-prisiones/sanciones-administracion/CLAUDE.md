# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow section 

Before making any file edits or starting implementation, FIRST provide a concise summary of findings/plan to the user and wait for confirmation. Do not spend excessive time reading files without delivering intermediate findings.

## Code Review 

When performing code reviews, ALWAYS use the svelte-code-writer skill for any Svelte (.svelte) file validation. Do not skip this step even if the review seems straightforward.

## Project Overview

**Svelte 5** data visualization comparing prison isolation sanctions and protection measures across three Spanish prison administrations (AGE, Cataluña, País Vasco). Created from the Civio Svelte 5 template.

## Project Structure

```
sanciones-administracion/
├── index.html                 # HTML entry point with mount div
├── package.json               # Dependencies and npm scripts
├── package-lock.json
├── vite.config.js             # Vite + Svelte configuration
├── svelte.config.js           # Svelte preprocessor config
├── jsconfig.json              # JS/IDE config
├── oxlint.json                # Linting rules
├── knip.json                  # Dead code detection config
├── generate-breakpoints.js    # Playwright script for iframe heights
├── breakpoints-report.md      # Generated breakpoints report
├── README.md                  # Embedding code and documentation
│
├── src/
│   ├── main.js                # App mount point
│   ├── App.svelte             # Main component
│   ├── vite-env.d.ts          # Vite type declarations
│   │
│   ├── states/                # Reactive state (Svelte 5 runes)
│   │   ├── data.svelte.js     # Data class and inline datasets
│   │   ├── language.svelte.js # i18n texts and formatters
│   │   └── utils.svelte.js    # URL params, mobile detection, isCivio
│   │
│   ├── lib/                   # Reusable components
│   │   ├── ChartContainer.svelte # Stacked bar chart (SVG, d3 scales)
│   │   ├── VerticalChart.svelte  # Desktop vertical stacked bar chart
│   │   ├── HorizontalChart.svelte # Mobile horizontal stacked bar chart
│   │   ├── SvgPatternDefs.svelte # Shared SVG hatch pattern definitions
│   │   ├── Tooltip.svelte     # Modal tooltip for sanction details
│   │   ├── ScreenReaderDescription.svelte
│   │   └── footer/
│   │       ├── Footer.svelte
│   │       └── ShareContainer.svelte
│   │
│   ├── utils/                 # Helper functions
│   │   ├── colors.js          # Civio color system
│   │   ├── locale.js          # Number formatters
│   │   └── clickOutside.svelte.js
│   │
│   ├── a11y/                  # Accessibility helpers
│   │   ├── index.js           # Type definitions and exports
│   │   └── mainChart.js       # Chart description generator
│   │
│   └── assets/                # Static assets
│       ├── civio.svg          # Civio logo
│       └── civio-dots.svg     # Civio dots pattern
│
├── public/                    # Static files (copied to dist/)
│   ├── civio.png              # Civio logo for sharing
│   └── iframes/               # Generated iframe HTML files
│
└── dist/                      # Production build output
    ├── index.html
    ├── civio.png
    ├── iframes/
    └── assets/
        ├── index.js
        └── index.css
```

## Commands

```bash
# Development
npm run dev              # Start Vite dev server (localhost:5173)
npm run build            # Production build to dist/
npm run preview          # Preview production build

# Linting & Formatting
npm run lint             # Run Oxlint on src/
npm run lint:fix         # Auto-fix Oxlint issues
npm run lint:deps        # Check unused dependencies with Knip
npm run lint:all         # Full lint + dependency check

npm run format           # Format with Prettier
npm run format:check     # Check formatting

# Iframe Generation (generates one file per type × language)
npm run iframe                                    # All types (sancion + proteccion) in Spanish
npm run iframe --languages=es,en                  # All types in Spanish and English
npm run iframe --type=sancion                     # Only sancion type in Spanish
npm run iframe --type=proteccion --languages=es,en  # Only proteccion in Spanish and English
npm run iframe --selector=chart-id                # Specific chart selector
npm run iframe:public                             # Generate iframes for public/ directory
```

## Architecture

### Entry Point

- `index.html` - Contains two `<div class="sanciones-administracion">` mount points, one per chart type (`type="sancion"` and `type="proteccion"`)
- `src/main.js` - Mounts App component on each target div. Supports `?type=` URL param to mount only one chart type (used by iframe generation)

### State Management (Svelte 5 Runes)

Located in `src/states/`:

- `data.svelte.js` - `Data` class with `value` ($state), `grouped` ($derived via d3 `groups`: year → administration → categories), `loading`, `error`. Data is hardcoded inline as exported arrays (`sancion`, `proteccion`), not fetched from network
- `language.svelte.js` - `Lang` class with i18n texts (Spanish only), number formatters per language
- `utils.svelte.js` - URL params (`?lang=`, `?a11y`, `?alt`, `?type=`), `isCivio` hostname detection, mobile breakpoint via `MediaQuery`

### Components

- `src/App.svelte` - Main component. Props: `lang`, `chartID`, `a11y`, `alt`, `type`. Assigns inline data (not network fetch), injects CSS color variables, supports a11y debug mode (`?a11y`) and alt description mode (`?alt`)
- `src/lib/ChartContainer.svelte` - Stacked bar chart: d3 scales, SVG bars per year/administration, toggle between ratio (‰) and absolute values. Contains centralized color functions:
  - `getCategoryColor(adm, catIndex, orientation)` — for SVG fills (returns fill string, uses per-admin hatch patterns for sancion type)
  - `getCategoryBackground(adm, catIndex)` — for div backgrounds (returns CSS background string, uses `repeating-linear-gradient` for hatched categories)
- `src/lib/VerticalChart.svelte` - Desktop vertical stacked bar chart (SVG)
- `src/lib/HorizontalChart.svelte` - Mobile horizontal stacked bar chart (SVG)
- `src/lib/SvgPatternDefs.svelte` - Shared SVG `<pattern>` definitions for per-admin hatch patterns (used by both chart orientations)
- `src/lib/Tooltip.svelte` - Modal overlay showing sanction breakdown per administration for a selected year; receives `getCategoryBackground` for consistent color rendering. Supports prev/next year navigation via `yearIndex`/`yearCount`
- `src/lib/footer/Footer.svelte` - Source/methodology text, share button. Receives `type` for unique DOM IDs per chart instance
- `src/lib/footer/ShareContainer.svelte` - Embed code copy. Uses `type` in iframe URL (`{chartID}-{type}-{lang}-responsive.md`)
- `src/lib/ScreenReaderDescription.svelte` - Renders accessible descriptions (list/table format). Supports `visible` prop for alt mode display

### Utilities

- `src/utils/colors.js` - Civio brand colors, project-specific palettes (`justicia` area), CSS variable generation. Admin palettes via CSS relative colors (`makePalette`): AGE (`#c76deb`), PV (`#109bf6`), CAT (`#08a6bf`) with auto-generated light/mid/dark variants
- `src/utils/locale.js` - Number formatters (ES/EN decimals, integers)
- `src/utils/clickOutside.svelte.js` - Click outside directive

### Accessibility (a11y)

- `src/a11y/mainChart.js` - `getMainChartA11y()` generates table-format descriptions with ratio (‰) + total per admin per year
- `src/a11y/index.js` - `A11yDescription` typedef and re-exports
- Debug mode: Add `?a11y` URL param or `data-a11y` attribute to visualize sr-only elements
- Alt mode: Add `?alt` URL param or `data-alt` attribute to display the chart description visually below the chart

## Key Patterns

### Data Initialization

```javascript
// In App.svelte — data is hardcoded, not fetched
import { Data, proteccion, sancion } from './states/data.svelte';
const chartData = new Data();

onMount(() => {
  chartData.value = type === 'sancion' ? sancion : proteccion;
  vizLang.setLang(urlInfo.lang ?? lang);
});
```

### Reactive State Classes

```javascript
export class Data {
  value = $state(undefined);
  grouped = $derived(this.value && groups(this.value, d => d.year, d => d.adm).map(...));
  loading = $state(true);
  error = $state(null);
}
// Instantiated per chart in App.svelte: const chartData = new Data();
```

### Color System

Colors are injected as CSS variables on the chart container:

- `--civio-blue`, `--civio-yellow`, `--civio-green`, `--civio-lightYellow`, `--civio-lightGreen` (main brand)
- `--primary`, `--secondary`, `--light` (project area: `justicia`)
- `--bw0` to `--bw990` (grayscale ramp)
- `--age`, `--cat`, `--pv` (admin base colors) with `_cat_1`/`_cat_2`/`_cat_3`/`_gradient` variants generated via CSS relative colors

### Dual Chart Types

This project renders two independent chart instances on the same page:

- `type="sancion"` — sanction data (2 stacked categories: aislamiento + fin de semana, hatched pattern for 2nd category)
- `type="proteccion"` — protection isolation data (single category per admin, gradient colors)

Each type has its own data source, iframe file, and unique DOM IDs. The `?type=` URL param isolates one chart for iframe measurement.

### Embedding

Charts are embedded via the code in `README.md`. The `generate-breakpoints.js` script uses Playwright to capture responsive heights for iframe generation. It iterates over types × languages, producing files like `sanciones-administracion-sancion-es-responsive.md`.

