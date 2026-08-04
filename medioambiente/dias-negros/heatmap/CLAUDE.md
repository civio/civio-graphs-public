# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow section

Before making any file edits or starting implementation, FIRST provide a concise summary of findings/plan to the user and wait for confirmation. Do not spend excessive time reading files without delivering intermediate findings.

## Code Review

When performing code reviews, ALWAYS use the svelte-code-writer skill for any Svelte (.svelte) file validation. Do not skip this step even if the review seems straightforward.

## Project Overview

**Días negros heatmap**: a canvas-based heatmap of the worst wildfire days per region (comunidad or provincia) in Spain (one row per year, one cell per day, sized/colored by active fires). Built on the Civio **Svelte 5 template** (`svelte-5/`), part of the *españa en llamas / días negros* project.

## Project Structure

```
heatmap/
├── index.html                 # HTML entry point with mount div
├── package.json               # Dependencies, npm scripts and `civio` config
├── vite.config.js             # Vite + Svelte configuration
├── svelte.config.js           # Svelte preprocessor config
├── .oxlintrc.json             # Linting rules (auto-discovered by oxlint)
├── knip.json                  # Dead code detection config
├── generate-breakpoints.js    # Playwright script for iframe heights
│
├── src/
│   ├── main.js                # App mount point
│   ├── App.svelte             # Main component: data loading, colors, layout
│   │
│   ├── states/                # Reactive state (Svelte 5 runes)
│   │   ├── data.svelte.js     # Data class + worstDays/countSevereDays helpers
│   │   ├── language.svelte.js # i18n texts and formatters
│   │   └── utils.svelte.js    # URL params (?lang, ?a11y, ?alt), isMobile, isTouchDevice
│   │
│   ├── lib/
│   │   ├── canvas/
│   │   │   ├── Canvas.svelte      # Canvas context provider (spiegel template)
│   │   │   └── CanvasLayer.svelte # Draw layer registered on the shared canvas
│   │   ├── chart/
│   │   │   ├── Heatmap.svelte     # Main chart: year rows × day columns, click opens tooltip
│   │   │   ├── YearDetail.svelte  # Single-year month-grid mini heatmap inside the tooltip
│   │   │   └── Tooltip.svelte     # Chart detail dialog: overlay card (desktop) / bottom sheet (mobile)
│   │   ├── ui/
│   │   │   ├── RegionSelector.svelte    # Comunidades/provincias pills + region <select>
│   │   │   ├── RadialSelector.svelte    # Pill radio group from the svelte-5 template
│   │   │   ├── WorstDaysSummary.svelte  # Intro/tooltip text with worst days + severe count
│   │   │   ├── FireBadge.svelte         # Circular badge with a fire count (filled/outlined)
│   │   │   ├── DayByDayList.svelte      # Keyboard/SR day-by-day alternative to the tooltip
│   │   │   ├── InteractionHint.svelte
│   │   │   ├── ScreenReaderDescription.svelte
│   │   │   └── TouchIcon.svelte
│   │   └── footer/
│   │       ├── Footer.svelte
│   │       └── ShareContainer.svelte
│   │
│   ├── utils/
│   │   ├── colors.svelte.js   # Civio colors + chart scales (circleColor, severeOutlineColor…)
│   │   ├── calendar.js        # monthTicks and dayOfYear (366-day leap-year domain)
│   │   ├── locale.js          # Number formatters
│   │   ├── focusTrap.js       # Shared dialog focus management (Tooltip + share modal)
│   │   └── clickOutside.svelte.js
│   │
│   ├── a11y/                  # Screen reader description generators
│   │   ├── index.js
│   │   ├── mainChart.js
│   │   ├── dayByDay.js
│   │   └── helpers.js
│   │
│   └── assets/                # Static assets (images, fonts)
│
├── public/                    # Static files (copied to dist/)
│   └── civio.png
│
└── dist/                      # Production build output
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
npm run iframe           # Generate iframes for all charts
npm run iframe:public    # Generate iframes against the public URL
```

## Architecture

### Data

- One source CSV, `https://data.civio.es/espanaenllamas/fires-map/dias_negros/incendios_por_dia_provincia.csv` (`fecha`, `provincia`, `comunidad`, `incendios_activos`), feeds both territorial levels: the comunidad reading is derived by summing its provincias day by day (`flatRollup`), an exact count because every fire belongs to a single provincia. Ceuta is absent from the file (never more than one active fire in a day).
- `src/states/data.svelte.js` holds the `Data` class:
  - A single fetch (`load()` is idempotent: concurrent/repeated calls share one in-flight promise) precomputes both levels via `makeLevel`: rows grouped by region name (O(1) region lookup, no deep proxying), the `regions` selector list sorted by worst day, and the level-wide `maxActiveFires`.
  - `level` (`comunidad` | `provincia`) picks the active precomputed level; `setLevel` is synchronous — no fetch, just a lookup — and clears the selection so it falls back to the new level's default region.
  - `selectedRegion` is a getter/setter: it defaults to the level's region with the worst day until the user picks one (the selector's `bind:value` writes through the setter).
  - Derived state: `selectedData`, `worstDays` (all ties at the max, not just the first) and `severeDaysCount` for the selected region; `maxActiveFires` and `years` span the whole level/dataset so scales stay comparable when switching region.
  - Exports `severeFiresThreshold` (currently 50) and the `worstDays`/`countSevereDays` helpers, shared by intro texts, tooltip and heatmap outlines so they always stay in sync.

### Chart rendering

- The heatmap draws on **canvas** via `Canvas.svelte` + `CanvasLayer.svelte` (adapted from spiegelgraphics' Svelte 5 templates); axes/labels are HTML/SVG on top.
- `Heatmap.svelte`: one row per year, one cell per day (366-day leap domain from `utils/calendar.js`), `scaleSqrt` radius, `circleColor` fill, `severeOutlineColor` outline above the threshold. Clicking a year row opens a `Tooltip` with `YearDetail` (its own local radius scale, chart-wide color scale).
- Cells are circles on a white background, with a gray row stripe on the region's worst years (the `shape`/`background` test controls were removed once these variants were chosen).

### State & URL params

- `src/states/utils.svelte.js`: `?lang=`, `?a11y`, `?alt` URL params, `isMobile`, `isTouchDevice`, `prefersReducedMotion`.
- `src/states/language.svelte.js`: i18n texts and date/number formatters (project is `es`-only).

### Colors

- `src/utils/colors.svelte.js` (note: `.svelte.js`, area `medioambiente`) exposes the Civio CSS variables injected on the chart container — `--civio-*` brand colors, `--primary`/`--secondary`/`--light`, `--bw0`–`--bw990` — plus the chart scales: `circleColor(value)`, `circleTextColor(value)`, `severeOutlineColor`.

### Accessibility (a11y)

- `src/a11y/` - Functions that generate screen reader descriptions from data
- `src/lib/ui/ScreenReaderDescription.svelte` - Renders accessible descriptions
- Debug mode: Add `?a11y` URL param or `data-a11y` attribute to visualize sr-only elements

### Dependencies

- `d3` (scales, time utils, csv/autoType, grouping).

## Project Configuration

Project URLs and IDs are centralized in the `civio` field of `package.json`:

```json
{
  "civio": {
    "appId": "heatmap",
    "projectPath": "medioambiente/dias-negros/heatmap",
    "investigationUrl": null,
    "languages": ["es"]
  }
}
```

`vite.config.js` reads these values and injects them via `define` (for JS/Svelte) and `transformIndexHtml` (for HTML). `generate-breakpoints.js` reads `package.json` directly.

## Embedding

Charts are embedded via the code in `README.md`. The `generate-breakpoints.js` script uses Playwright to capture responsive heights for iframe generation.
