# CLAUDE.md

## Workflow

Before making any file edits or starting implementation, FIRST provide a concise summary of findings/plan to the user and wait for confirmation.

## Code Review

When performing code reviews, ALWAYS use the svelte-code-writer skill for any Svelte (.svelte) file validation.

## Project Overview

Visualization of **prison isolation sanction reasons** in Spain (2020-2025). Shows disciplinary measures broken down by reason code (`motivo`), classified as violent vs non-violent, across different prison administrations (AGE, CAT). Built with Svelte 5 (runes) + Vite, minimal D3 usage.

**Live URL**: `https://graphs.civio.es/justicia/aislamiento-prisiones/motivos-sanciones/`
**Data source**: `https://data.civio.es/justicia/aislamiento-prisiones/motivos_aislamiento.csv`

## Commands

```bash
# IMPORTANT: Always run this first for correct Node.js version (v24.13.0)
source ~/.nvm/nvm.sh && nvm use

npm run dev              # Vite dev server (localhost:5173)
npm run build            # Production build to dist/
npm run preview          # Preview production build

npm run lint             # Oxlint on src/
npm run lint:fix         # Auto-fix lint issues
npm run lint:deps        # Unused dependency check (Knip)
npm run lint:all         # Full lint + dependency check

npm run format           # Prettier format
npm run format:check     # Check formatting

npm run iframe           # Generate iframes (uses Playwright)
```

## Architecture

### Data Flow

1. `src/main.js` mounts App, reads `lang`, `data-a11y` and `data-alt` from target `<div id="motivos-sanciones">`, passes `chartID`
2. `App.svelte` loads CSV via `data.loadFromUrl()` in `onMount`
3. `data.svelte.js` processes CSV: filters by admin/gender, groups by motivo
4. `SquarePacking.svelte` renders the main visualization

### State Management (`src/states/`)

- **`data.svelte.js`** — Core state class using `$state` and `$derived`. Filters: `selectedAdm` (AGE/CAT), `selectedSex` (V/M/''), `selectedYear`. Chain: `value` → `filteredRows` (by adm) → `rows` (by sex) → `concentricHierarchy`. `baseConcentricHierarchy` uses max % across all filter combos for stable layout sizing.
- **`language.svelte.js`** — Spanish-only i18n. Contains the full motivo dictionary (18 sanction types, codes 108a–108i + 109a–109i) with labels, descriptions, type (grave/muy grave), and violence flag.
- **`utils.svelte.js`** — URL params (`?lang=`, `?a11y`, `?alt`), mobile detection via Svelte 5 `MediaQuery` and `SvelteURL` from `svelte/reactivity`.

### Visualization Components (`src/lib/`)

- **`SquarePacking.svelte`** — Main viz. Square packing with concentric year rings per motivo. Three label modes (inline/displaced/code) with mobile-specific logic. See tunables section below.
- **`Tooltip.svelte`** — Year breakdown on hover/click with `MiniChart`. Desktop: positioned popover. Mobile: centered modal. Uses `clickOutside` attachment.
- **`MiniChart.svelte`** — Small line chart inside tooltips showing % evolution per motivo across years.
- **`Selector.svelte`** — Animated radio selector with sliding indicator for admin/sex filters.
- **`ScreenReaderDescription.svelte`** — Accessible chart descriptions (generic, reusable).
- **`footer/Footer.svelte`** — Source link, methodology, share button.
- **`footer/ShareContainer.svelte`** — Embed code copy with clipboard API + fallback.

### Utilities (`src/utils/`)

- **`squarePacking.js`** — `packSquaresBestFit()` greedy packing algorithm (larger-first, closest to center).
- **`colors.js`** — Civio brand colors + per-administration colors (`admColors`). Generates CSS vars: `--age`, `--cat`, `--primary`, `--bw0`–`--bw990`.
- **`locale.js`** — Number formatters (`formatIntegers`, `formatDecimals`) for ES/EN locales.
- **`clickOutside.svelte.js`** — Svelte attachment for click-outside detection.

### Accessibility (`src/a11y/`)

- **`mainChart.js`** — `buildMainChartA11y()` builds screen reader descriptions and data tables for the main chart. Receives hierarchy, causes dictionary, and filter labels; returns `{ description, title, columns, items }` for `ScreenReaderDescription`.

### Data Model

CSV fields: `motivo`, `year`, `adm`, `tipo_sancion`, `sexo` (M=mujeres/V=hombres), `total`.
Each motivo (e.g., "108a", "109b") maps to a full description in `language.svelte.js` with violence classification.
Years are **strings** ('2020'–'2025') from CSV parsing.

## Key Patterns

### Reactive State Classes (Svelte 5 Runes)

```javascript
class Data {
  value = $state(undefined);
  selectedAdm = $state('AGE');
  rows = $derived(/* filter logic */);
}
export const data = new Data();
```

### Color System

CSS variables injected on chart container via `@html <style>`: `--civio-blue`, `--primary`, `--secondary`, `--bw0`–`--bw990`, plus per-admin colors (`--age`, `--cat`). No fallback values needed — always injected.

### D3 Usage (Minimal)

Only `csv()` for loading, `rollup()` for aggregation, `range()` + `scaleLinear()` for BW scale and MiniChart, `formatLocale()` for number formatting in `locale.js`. No D3 axes or SVG generation — layout is custom JS, rendering is Svelte SVG.

### Naming Conventions

- **camelCase** for all JS constants and variables (no UPPER_CASE)
- **CSS**: No fallback values for `--bw*` or project vars (always available via injected `<style>`)

### Linter Notes

Oxlint reports `prefer-const` warnings on `$state`/`$derived`/`$props` — these are false positives (Svelte 5 runes require `let`). Ignore them.

## SquarePacking.svelte — Tunables & Label System

### Opacity Tunables

| Constant | Value | Purpose |
|----------|-------|---------|
| `inactiveOpacity` | 0.05 | Label text when motivo has 0 in highlighted year |
| `baseLabelOpacity` | 1 | Label text (inline/code) on desktop |
| `baseLabelOpacityMobile` | 0.8 | Label text (inline/code) on mobile |
| `displacedLabelOpacity` | 0.8 | Displaced (external) labels, both desktop & mobile |
| `rectFillOpacity` | 0.85 | Solid rect fill (no year highlighted) |
| `rectInactiveOpacity` | 0.08 | Rect fill for inactive motivos |

### Layout & Label Tunables

| Constant | Value | Purpose |
|----------|-------|---------|
| `mobileInlineSide` | 120 | Threshold: side >= this -> inline label; < this -> displaced/code |
| `displacedFontSize` | 11 | Font size for displaced labels (x fontScale) |
| `displacedStatsInsideMin` | 20 | Threshold: side >= this -> % inside square; < this -> % appended to external label |
| `displacedMaxChars` | 20 | Max characters per line for displaced labels |
| `displacedGap` | 5 | Gap between square edge and displaced label |
| `targetHeight` | 400 | Target height for packing algorithm scaling |

### Label Modes

**Desktop:**
1. **displaced** — Has `labelOffsets` entry → label positioned outside square
2. **inline** — Otherwise → full label + stats centered inside square

**Mobile (three tiers by square size):**
1. **inline** — side >= `mobileInlineSide` → full label + stats centered inside square
2. **displaced** — Has `mobileLabelOffsets` entry → code inside square + label outside
3. **code** — Otherwise → motivo code inside square + full text in HTML legend below

To move a motivo between displaced/code: add/remove from the corresponding offsets object (`labelOffsets` for desktop, `mobileLabelOffsets` for mobile).

### Legend Order

`legendOrder` is captured **once** on first render via `$effect`, sorted by **% descending** for the initial filters (AGE, all population, 2025). Order stays fixed across filter changes to allow visual comparison.
