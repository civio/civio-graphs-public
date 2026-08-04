# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow section

Before making any file edits or starting implementation, FIRST provide a concise summary of findings/plan to the user and wait for confirmation. Do not spend excessive time reading files without delivering intermediate findings.

## Code Review

When performing code reviews, ALWAYS use the svelte-code-writer skill for any Svelte (.svelte) file validation. Do not skip this step even if the review seems straightforward.

## Project Overview

Table of "dias negros": the days with the most simultaneous active fires per comunidad or provincia in Spain, with a territorial level switch, filters and pagination. Spanish only (`languages: ["es"]`), part of `medioambiente/dias-negros`. Built with Svelte 5 (runes) + Vite from the Civio svelte-5 template.

Data (fetched in `App.svelte` onMount):

- URL: `https://data.civio.es/espanaenllamas/fires-map/dias_negros/incendios_por_dia_provincia.csv`
- Columns: `provincia`, `comunidad`, `incendios_activos`, `fecha` (autoTyped to Date)
- The `Data` class precomputes **two ranked levels** from the single CSV: `provincia` (raw rows) and `comunidad` (one row per comunidad and day, `incendios_activos` summed across its provincias via `flatRollup`). Each level is sorted by `incendios_activos` descending and every row gets `month` (0-11), `year` and `order` — the global position in that ranked level (`i + 1`), unique per row even when days tie.

## Project Structure

```
tabla-incendios/
├── index.html                 # Mount div + Civio article wrappers (see template docs)
├── package.json               # Scripts + `civio` config (appId: tabla-incendios)
├── generate-breakpoints.js    # Playwright script for iframe heights
└── src/
    ├── main.js                # Mounts App, reads lang / data-a11y / data-alt
    ├── App.svelte             # Title, data loading, color injection, a11y/alt modes
    ├── states/
    │   ├── data.svelte.js     # Data class: fetch, two-level ranking, filters
    │   ├── language.svelte.js # ES texts, formatters, monthNames
    │   └── utils.svelte.js    # urlInfo, isMobile, prefersReducedMotion
    ├── lib/
    │   ├── FiresTable.svelte  # Orchestrates filters + table + pagination
    │   ├── Filters.svelte     # Level pills + community/province/year/month selects
    │   ├── Table.svelte       # Ranked table with color-scaled bars
    │   ├── Pagination.svelte  # Page buttons with ellipsis
    │   ├── RadialSelector.svelte      # Radiogroup pills (territorial level)
    │   ├── ScreenReaderDescription.svelte
    │   └── footer/            # Footer.svelte, ShareContainer.svelte
    ├── utils/                 # colors.svelte.js, locale.js, clickOutside.svelte.js
    └── a11y/                  # index.js, mainChart.js
```

The project was cleaned of unused template pieces (Tooltip, TouchIcon, TweenedNumber, inView, swipe, scrolling are gone).

## Commands

```bash
npm run dev / build / preview        # Vite
npm run lint / lint:fix / lint:deps / lint:all   # Oxlint + Knip
npm run format / format:check        # Prettier
npm run iframe [-- --selector=id --languages=es] # Generate iframes
npm run iframe:public                # Same, with --public
```

## Architecture / State

### `data.svelte.js` (singleton `data`)

- State: `level` ('comunidad' | 'provincia', default 'comunidad'), `loading`, `error`, `filterCount` (default 100), `selectedCommunity` / `selectedProvince` / `selectedYear` / `selectedMonth` (null = no filter). The two precomputed levels live in a private `#datasets` ($state.raw: only reassigned, never mutated).
- Derived: `value` (ranked rows of the active level), `communities` and `years` (filter options from the active level), `provinces` (always from the provincia dataset, chained to the community filter), `hasActiveFilters`, `maxActiveFires` (first row of the active level; color/bar scale domain end), `filteredData` — the top for the current filters: filters applied to the full ranked level, then first `filterCount` rows. Rows keep their global `order`, so with filters active the numbering is not consecutive.
- `regionName(row)` returns the row's comunidad or provincia according to the active level.
- Setters: `setLevel` (switching is synchronous — both levels are precomputed; leaving provincia drops the province filter), `setCommunityFilter` (drops the province filter if it no longer belongs to the selected community), `setProvinceFilter`, `setYearFilter`, `setMonthFilter`, `clearFilters`. `loadFromUrl(url)` is idempotent (shared in-flight promise, cached result).

### `language.svelte.js` (singleton `vizLang`)

- `texts` (ES only, includes `texts.table.*` for the table UI and `texts.levels` for the level pills), `formatDecimals` / `formatIntegers`, `formatFullDate` (Intl, UTC), `monthNames` (localized, lowercase, indexed 0-11 like `Date#getMonth()`).

### `utils.svelte.js`

- `urlInfo`: reactive URL — `lang`, `a11y`, `alt`, `isCivio`. A11y debug mode via `?a11y` or `data-a11y`; alt mode via `?alt` or `data-alt`.
- `isMobile` / `prefersReducedMotion`: `MediaQuery` singletons.

### `colors.svelte.js`

- Injects Civio/project/custom palettes + the `--bw*` scale as CSS variables from `App.svelte`. Custom vars: `--success` / `--success-light` (copy-embed feedback state).
- `fireColor(value)` / `fireTextColor(value)`: sequential HCL scale (yellow → dark brown) over `[1, data.maxActiveFires]`; text color picked by WCAG relative luminance.

## Key Patterns

- Pagination (`FiresTable.svelte`): `pageSize = 10`; `requestedPage` is $state and `currentPage` is derived as `min(requestedPage, totalPages)`, so the page self-clamps when filters shrink the result set. Filter handlers reset `requestedPage = 1` via the `onfilter` callback.
- Cascading filters (`Filters.svelte`): a selected province disables the community select, a single-province community disables the province select; the province select only renders at the provincia level.
- Month filter options come from `vizLang.monthNames` (capitalized at display), values are the 0-11 month index matching `d.month`.
- Share modal (`Footer.svelte`): `role="dialog"` + `aria-modal`, focus moves into the dialog on open and back to the toggle button on close (Escape or click outside).
