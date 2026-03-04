# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow section
Before making any file edits or starting implementation, FIRST provide a concise summary of findings/plan to the user and wait for confirmation. Do not spend excessive time reading files without delivering intermediate findings.

## Code Review

When performing code reviews, ALWAYS use the svelte-code-writer skill for any Svelte (.svelte) file validation. Do not skip this step even if the review seems straightforward.

## Project Overview

Visualización de tiempos en limbo del sistema de aislamiento en prisiones. Proyecto Svelte 5 de Civio.

## Project Structure

```
tiempos-limbo/
├── index.html                 # HTML entry point with <div id="tiempos-limbo">
├── package.json               # Dependencies and npm scripts
├── vite.config.js             # Vite + Svelte configuration
├── svelte.config.js           # Svelte preprocessor config
├── jsconfig.json              # JS/TS path aliases config
├── oxlint.json                # Linting rules
├── knip.json                  # Dead code detection config
├── .prettierrc                # Prettier configuration
├── .prettierignore            # Prettier ignore rules
├── .nvmrc                     # Node.js version
├── generate-breakpoints.js    # Playwright script for iframe heights
├── breakpoints-report.md      # Generated breakpoints report
├── README.md                  # Embedding code and documentation
│
├── src/
│   ├── main.js                # App mount point (reads lang, data-a11y, data-alt)
│   ├── App.svelte             # Main component
│   ├── vite-env.d.ts          # Vite type declarations
│   │
│   ├── states/                # Reactive state (Svelte 5 runes)
│   │   ├── data.svelte.js     # Hardcoded data array
│   │   ├── language.svelte.js # i18n texts and formatters
│   │   └── utils.svelte.js    # URL params, mobile detection
│   │
│   ├── lib/                   # Reusable components
│   │   ├── WaffleChart.svelte        # Main waffle chart (canvas-based grouped squares)
│   │   ├── Selector.svelte           # Radio button selector (grouped/detail view)
│   │   ├── ScreenReaderDescription.svelte # A11y: SR descriptions (list/table)
│   │   ├── canvas/
│   │   │   ├── Canvas.svelte         # Canvas rendering container
│   │   │   └── CanvasSquare.svelte   # Square shape for Canvas
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
│       ├── civio.svg           # Civio logo
│       └── civio-dots.svg      # Civio dots logo
│
├── public/                    # Static files (copied to dist/)
│   └── civio.png              # Civio logo for sharing
│
└── dist/                      # Production build output
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

# Iframe Generation
npm run iframe                                    # Generate iframes for all charts
npm run iframe --languages=es,en                  # Multiple languages
npm run iframe --selector=chart-id                # Specific chart
npm run iframe --selector=chart-id --languages=en # Combined
```

## Architecture

### Entry Point

- `index.html` - Contains `<div id="tiempos-limbo">` mount point
- `src/main.js` - Mounts App component, reads `lang`, `data-a11y`, and `data-alt` attributes from target element

### Props

The App component receives these props from `main.js`:

- `lang` - Language code (`'es'` default)
- `chartID` - Element ID (`'tiempos-limbo'`)
- `a11y` - Accessibility debug mode (from `data-a11y` attribute)
- `alt` - Alt-text mode (from `data-alt` attribute)

### State Management (Svelte 5 Runes)

Located in `src/states/`:

- `data.svelte.js` - Hardcoded data as exported `const data` array (no async loading)
- `language.svelte.js` - `Lang` class with `$state`/`$derived`: i18n texts, number formatters, groupLabels
- `utils.svelte.js` - `UrlInfo` class with `$state`/`$derived`: URL params (`?lang=`, `?a11y`, `?alt`), `isMobile` via `MediaQuery`

### Components

- `src/App.svelte` - Main component with color injection, debug modes
- `src/lib/WaffleChart.svelte` - Canvas-based waffle chart with grouped/expanded views
- `src/lib/Selector.svelte` - Radio button toggle (grouped/detail view)
- `src/lib/ScreenReaderDescription.svelte` - A11y component: generates sr-only descriptions (list or table format)
- `src/lib/footer/` - Footer and sharing components
- `src/lib/canvas/` - Canvas rendering components (Canvas + CanvasSquare)

### Utilities

- `src/utils/colors.js` - Civio brand colors, project-specific palettes, CSS variable generation
- `src/utils/locale.js` - Number formatters (ES/EN decimals, integers)
- `src/utils/clickOutside.svelte.js` - Click outside directive

### Accessibility (a11y)

- `src/lib/ScreenReaderDescription.svelte` - Reusable component that renders sr-only descriptions as list or table
- `src/a11y/` - Functions that generate screen reader descriptions from data
- `src/a11y/mainChart.js` - `getMainChartA11y()` generates description from `vizLang` and data. Group labels come from `vizLang.texts.groupLabels`
- Debug mode: Add `?a11y` URL param or `data-a11y` attribute to visualize sr-only elements
- Alt-text mode: Add `?alt` URL param or `data-alt` attribute to show alt description

## Key Patterns

### Data

Data is hardcoded as a static array in `data.svelte.js` (no async fetch):

```javascript
export const data = [
  ["<= 15", { count: 3760, perc: 48.2 }],
  [">15 & <= 30", { count: 1559, perc: 19.99 }],
  // ... [label, { count, perc }] tuples
];
```

### Reactive State Classes

`language.svelte.js` and `utils.svelte.js` use classes with Svelte 5 runes:

```javascript
class Lang {
  value = $state('es');
  texts = $derived(texts[this.value]);
  formatDecimals = $derived(formatDecimals[this.value] ?? formatDecimals['es']);
  setLang(lang) { ... }
}
export const vizLang = new Lang();
```

### Color System

Colors are injected as CSS variables on the chart container:

- `--civio-blue`, `--civio-yellow`, `--civio-green`, `--civio-lightYellow`, `--civio-lightGreen` (main brand)
- `--primary`, `--secondary`, `--light` (project area)
- `--bw0` to `--bw990` (grayscale ramp)

### Embedding

Charts are embedded via the code in `README.md`. The `generate-breakpoints.js` script uses Playwright to capture responsive heights for iframe generation.
