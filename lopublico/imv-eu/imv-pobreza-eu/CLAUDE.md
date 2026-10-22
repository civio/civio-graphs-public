# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow section

Before making any file edits or starting implementation, FIRST provide a concise summary of findings/plan to the user and wait for confirmation. Do not spend excessive time reading files without delivering intermediate findings.

## Code Review

When performing code reviews, ALWAYS use the svelte-code-writer skill for any Svelte (.svelte) file validation. Do not skip this step even if the review seems straightforward.

## Project Overview

This is the **Svelte 5 template** for Civio data visualizations. New projects are created from this template using `./create-sv5.sh` from the repository root.

## Project Structure

```
svelte-5/
├── index.html                 # HTML entry point with mount div
├── package.json               # Dependencies and npm scripts
├── vite.config.js             # Vite + Svelte configuration
├── svelte.config.js           # Svelte preprocessor config
├── .oxlintrc.json             # Linting rules (auto-discovered by oxlint)
├── knip.json                  # Dead code detection config
├── generate-breakpoints.js    # Playwright script for iframe heights
│
├── src/
│   ├── main.js                # App mount point
│   ├── App.svelte             # Main component
│   │
│   ├── states/                # Reactive state (Svelte 5 runes)
│   │   ├── data.svelte.js     # Data fetching and filtering
│   │   ├── language.svelte.js # i18n texts and formatters
│   │   └── utils.svelte.js    # URL params, mobile detection
│   │
│   ├── lib/                   # Reusable components
│   │   ├── Component.svelte   # Example component
│   │   ├── ScreenReaderDescription.svelte
│   │   ├── TouchIcon.svelte   # Touch vs cursor hint (driven by isTouchDevice)
│   │   ├── RadialSelector.svelte # Segmented control with sliding pill (radiogroup)
│   │   ├── Tooltip.svelte     # Chart tooltip: popover (desktop) / modal (mobile)
│   │   ├── TweenedNumber.svelte  # Animated number (respects reduced-motion)
│   │   └── footer/
│   │       ├── Footer.svelte
│   │       └── ShareContainer.svelte
│   │
│   ├── utils/                 # Helper functions
│   │   ├── colors.js          # Civio color system
│   │   ├── locale.js          # Number formatters
│   │   ├── clickOutside.svelte.js
│   │   ├── inView.svelte.js   # IntersectionObserver attachment (onEnter/onExit)
│   │   ├── swipe.svelte.js    # Horizontal swipe attachment (onSwipeLeft/Right)
│   │   └── scrolling.svelte.js # scrollActivity singleton (isScrolling)
│   │
│   ├── a11y/                  # Accessibility helpers
│   │   ├── index.js           # Type definitions and exports
│   │   └── mainChart.js       # Chart description generator
│   │
│   └── assets/                # Static assets (images, fonts)
│
├── public/                    # Static files (copied to dist/)
│   └── iframes/               # Generated iframe HTML files
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
# The `--` is required: without it npm keeps the options and the script never sees them
npm run iframe                                       # All charts, languages from package.json
npm run iframe -- --languages=es,en                  # Multiple languages
npm run iframe -- --selector=chart-id                # Specific chart
npm run iframe -- --selector=chart-id --languages=en # Combined
```

## Architecture

### Entry Point

- `index.html` - Contains `<div id="__APP_ID__">` mount point wrapped in Civio's article classes (`<body class="__APP_AREA__">`, `.post-content`, `.multimedia.full-width`) so the standalone/embedded preview matches how charts look on civio.es. App.svelte does **not** add these wrappers. A small inline script replicates `civio.es/.../article.js`, sizing `.full-width` to the full viewport (for full-bleed charts).
- `src/main.js` - Mounts App component, reads `lang` and `data-a11y` attributes from target element

### State Management (Svelte 5 Runes)

Located in `src/states/`:

- `data.svelte.js` - Data loading/filtering class with `$state` and `$derived`
- `language.svelte.js` - i18n texts, number formatters per language
- `utils.svelte.js` - URL params (`?lang=`, `?a11y`), `isMobile`, `isTouchDevice`, `prefersReducedMotion`

### Components

- `src/App.svelte` - Main component with data loading, filters, color injection
- `src/lib/` - Reusable components (Footer, ScreenReaderDescription, TouchIcon, RadialSelector, Tooltip, TweenedNumber)

### Utilities

- `src/utils/colors.js` - Civio brand colors, project-specific palettes, CSS variable generation
- `src/utils/locale.js` - Number formatters (ES/EN decimals, integers)
- `src/utils/clickOutside.svelte.js` - Click outside directive
- `src/utils/inView.svelte.js` - IntersectionObserver attachment (enter/exit viewport)
- `src/utils/swipe.svelte.js` - Horizontal swipe attachment for touch devices
- `src/utils/scrolling.svelte.js` - `scrollActivity` singleton (is the page scrolling?)

### Accessibility (a11y)

- `src/a11y/` - Functions that generate screen reader descriptions from data
- `src/lib/ScreenReaderDescription.svelte` - Renders accessible descriptions (list/table format)
- Debug mode: Add `?a11y` URL param or `data-a11y` attribute to visualize sr-only elements

## Key Patterns

### Data Loading

```javascript
// In App.svelte onMount
await data.loadFromUrl('https://data.civio.es/path/to/data.csv');
vizLang.setLang(urlInfo.lang ?? lang);
```

### Reactive State Classes

```javascript
class Data {
  value = $state(undefined);
  filterCount = $state(10);
  derivedData = $derived(this.value?.slice(0, this.filterCount) ?? []);
}
export const data = new Data();
```

### Color System

Colors are injected as CSS variables on the chart container:

- `--civio-blue`, `--civio-yellow`, `--civio-green`, `--civio-lightYellow`, `--civio-lightGreen` (main brand)
- `--primary`, `--secondary`, `--light` (project area)
- `--bw0` to `--bw990` (grayscale ramp)

### Embedding

Charts are embedded via the code in `README.md`. The `generate-breakpoints.js` script uses Playwright to capture responsive heights for iframe generation.

## Project Configuration

Project URLs and IDs are centralized in the `civio` field of `package.json`:

```json
{
  "civio": {
    "appId": "my-chart",
    "projectPath": "justicia/my-chart",
    "investigationUrl": null,
    "languages": ["es"]
  }
}
```

`vite.config.js` reads these values and injects them via `define` (for JS/Svelte) and `transformIndexHtml` (for HTML). `generate-breakpoints.js` reads `package.json` directly.

When creating new projects, `create-sv5.sh` uses `jq` to set the `civio` fields in `package.json`. Only `__APP_AREA__` is still replaced via `sed` (in `index.html` and `colors.js`).
