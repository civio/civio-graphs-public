# CLAUDE.md

Guidance for Claude Code when working in this project.

## Workflow

Before non-trivial edits, share a concise summary of findings/plan and wait for confirmation. Don't read files exhaustively without delivering intermediate findings.

## Code Review

For `.svelte` file review/validation, ALWAYS use the `svelte-code-writer` skill. Do not skip it.

## Project Overview

**Despiece por CCAA — Pérdida de VPO** (`lopublico` area). Interactive visualization of social housing (VPO) evolution per Spanish autonomous community: built, under protection, permanent, "maybe protected" and lost stock, with an alternate grouping by funding plan (estatal/autonómico).

- `appId`: `despiece-ccaa`
- `projectPath`: `lopublico/perdida-vpo/despiece-ccaa`
- Languages: `es`
- Data sources:
  - Houses (StackedChart): `https://data.civio.es/lopublico/desaparicion-vpo/output/journalist.csv`
  - Plazos (PlazosChart): two CSVs from `https://data.civio.es/lopublico/desaparicion-vpo/graficos/`
    (`marco-legal-estructurado.csv` + `plazos-viviendas-estructurado.csv`).

## Embedding model (important)

This project is **not** a single chart. The host page embeds one `<section data-ccaa="...">` per CCAA, each containing one or more `<div area-chart></div>` and/or `<div laws-chart></div>` placeholders plus editorial prose. Display names come from the catalog (`ccaaDisplayNames`), keyed by `data-ccaa` — the embed only needs the id. On mount:

1. `src/main.js` reads all `section[data-ccaa]` under `#despiece-ccaa`, removes them from the DOM, seeds `urlInfo.attrA11y`/`attrAlt` from `data-a11y`/`data-alt`, and passes the sections as `ccaaSections` to `App.svelte`.
2. `App.svelte` wraps each section in a `.ccaa-block` (region landmark, `aria-labelledby` pointing at the section's `<h2>`), appends a `ScrollUpButton`, and triggers the shared CSV fetch.
3. `ccaa.svelte.js` drives selection: auto-detects the user's CCAA via `get.geojs.io/v1/ip/geo.json` (2.5s timeout), falls back to random, and exposes `select(id)` / `prev()` / `next()` for selector and nav controls.
4. Charts use a **single-CCAA mount strategy**: only the active CCAA carries chart instances. Each section can host two chart kinds, declared in `chartMounts` (`App.svelte`). On CCAA change, `unmountCurrentCharts` destroys the previous apps and `mountChartsFor` walks the new section's placeholders — `[area-chart]` → `StackedChart`, `[laws-chart]` → `PlazosChart` — mounting one app per match. The swap runs inside the `flushSync` that drives the view transition so the crossfade absorbs the ~50–100ms mount cost. Rationale: accumulating 38 charts (19 CCAAs × 2 kinds) was OOM-crashing tabs on mobile after the reader bounced through several communities.
5. An `$effect` toggles `display` per block (only the selected one is visible) and assigns `view-transition-name: ccaa-block` only to the active block; `withTransition` wraps select/prev/next so the browser crossfades between CCAAs (directional slide via `data-ccaa-direction` on `<html>`).

Debug override: `?mode=ip|random|manual`. Embed-level overrides: `data-a11y`, `data-alt` attributes on the host element (equivalent to `?a11y` / `?alt`).

## Structure

```
src/
├── main.js                      # Extracts sections, seeds attr overrides, mounts App
├── App.svelte                   # Selector + nav, single-CCAA chart mounting, view transitions
│
├── states/
│   ├── ccaa.svelte.js           # Section registry, IP detection, selection (prev/next)
│   ├── ccaaCatalog.js           # Canonical CCAAS table + ipRegionToId + ccaaDisplayNames
│   ├── data.svelte.js           # Shared Data class (base for all datasets), normalises legacy CSV ids
│   ├── housesData.svelte.js     # Houses dataset instance + summarize/summarizeByPlan/Promotor/Tenencia
│   ├── plazosData.svelte.js     # Plazos dataset instance (loads detalle + proteccion JSONs)
│   ├── chartConfig.js           # stackOrder + plan/promotor/tenenciaStackOrder, firstProjectionYear
│   ├── language.svelte.js       # i18n (es/en texts, formatters)
│   └── utils.svelte.js          # urlInfo, isMobile, isTouchDevice, prefersReducedMotion,
│                                #   view (planView), selector (height), chartLayout (width)
│
├── lib/
│   ├── CcaaSelector.svelte      # <select> + animated mode icon (ip/manual)
│   ├── NavButtons.svelte        # Sticky prev/next + ←/→ keyboard nav
│   ├── ScrollUpButton.svelte    # Per-section button back to selector when off-screen
│   ├── TouchIcon.svelte         # Touch vs cursor icon (driven by isTouchDevice)
│   ├── StackedChart.svelte      # Per-CCAA stacked-area chart ([area-chart] placeholder);
│   │                            #   loads data, scales, hover, pauses while !active
│   ├── PlazosChart.svelte   # Per-CCAA Gantt-style timeline of protection terms + laws
│   │                            #   ([laws-chart] placeholder); CSS Grid layout
│   ├── plazosChart/
│   │   ├── SubRow.svelte            # One housing-type row with its protection-period bars
│   │   ├── NormaTrack.svelte        # Per-category legislation track (range lines + dots)
│   │   ├── IntroLegend.svelte       # Color legend + "cómo leer" mini chart
│   │   ├── Tooltip.svelte           # Floating tooltip (sub / norma kinds)
│   │   ├── colorScale.js            # Threshold palette + diagonalGradient compositor
│   │   └── plazosUtils.js           # buildSubRows, entryGroupsForRowName
│   ├── stackedChart/
│   │   ├── RadialSelector.svelte    # Radio-group control (protection / plan / promotor / tenencia)
│   │   ├── StackedAreas.svelte      # d3 stack, curveStepAfter
│   │   ├── BuiltLine.svelte         # Total built; solid pre-2025, dashed from firstProjectionYear
│   │   ├── ProjectionOverlay.svelte # Visual cue for projection region
│   │   ├── HoverMarker.svelte       # Vertical guide + values on hover
│   │   ├── NumberBoxes.svelte       # Headline numbers (tweened)
│   │   ├── TweenedNumber.svelte
│   │   └── XAxis.svelte / YAxis.svelte
│   └── ScreenReaderDescription.svelte
│
├── utils/
│   ├── colors.js                # appArea = 'lopublico'; main + project palettes + bw ramp
│   ├── locale.js                # ES/EN formatters
│   ├── clickOutside.svelte.js
│   ├── inView.svelte.js         # IntersectionObserver attachment (onEnter/onExit/onProgress)
│   ├── swipe.svelte.js          # Touch swipe attachment (onSwipeLeft/Right)
│   └── scrolling.svelte.js      # scrollActivity singleton (isScrolling)
│
├── a11y/
│   ├── index.js                 # getCcaaChartA11y(...) used by StackedChart
│   └── mainChart.js
│
└── assets/                      # civio.svg, civio-dots.svg
```

## Commands

```bash
npm run dev              # Vite dev server
npm run build            # Production build to dist/
```

Node: use `source ~/.nvm/nvm.sh && nvm use` before npm/npx (see `.nvmrc`).

## Data architecture

Data loading is split into three modules:

- **`data.svelte.js`** — Shared `Data` class (reactive CSV loader with `loadFromUrl`, `forCcaa`). On ingest, normalises legacy CSV CCAA labels (e.g. `Castilla_y_Leon`, `Balears`) into canonical ids.
- **`housesData.svelte.js`** — `housesData` instance + all house-specific summarizers.
- **`plazosData.svelte.js`** — `plazosData` instance, fetches the two plazos
  CSVs (`marco-legal-estructurado` + `plazos-viviendas-estructurado`) from
  `data.civio.es` and consumed by `PlazosChart`. Multiple CSV rows in marco-legal
  that share the same `code` are grouped into a single entry whose `urls` array
  carries every alternative source URL (original BOE link + each subsequent
  modification); the tooltip lists all of them.

The `Data` class accepts optional `{ filter, sort, ccaaField }` config at construction.

## CCAA catalog

`src/states/ccaaCatalog.js` exports `CCAAS` — the single source of truth for the 19 autonomous communities. Keys are lowercase ascii ids (`andalucia`, `castillayleon`, `paisvasco`, …) and are the same shape used in:

- HTML `<section data-ccaa="…">` attributes
- houses CSV `ccaa` column and plazos CSVs `region` column — both normalised at ingest through the catalog's `csvAliasToId` (every accepted raw label is listed in each CCAA's `csvAliases`)

Each row also carries `es` (UI display name) and `ipRegions` (geojs.io English labels for IP-based detection). Two derived maps are exported:

- `ipRegionToId` — used by `ccaa.svelte.js` to map geojs.io's `region` to a section id.
- `ccaaDisplayNames` — wired into `vizLang.texts.ccaas` so `vizLang.texts.ccaas[id]` returns the human-readable label everywhere.

Adding a CCAA = one row in `CCAAS` (listing every raw label the data sources use in `csvAliases`), plus rows in the source CSVs (houses `journalist.csv` and the two plazos CSVs). No other files need editing.

## Data model (houses)

CSV columns consumed: `ccaa`, `year`, `value`, `min_end_of_protection`, `max_end_of_protection`, `voluntary_release`, `plan` (`estatal` / `autonomico`), `promotor`, `tenencia`.

Internal `classifyRow(row, year)` returns one of:

- `notBuilt` — `year < row.year`
- `permanent` — either protection bound starts with "Permanente" (case-insensitive)
- `protected` — `year < min(voluntary_release, min_end_of_protection)`
- `maybe` — between that threshold and `max_end_of_protection`
- `lost` — `year > max_end_of_protection`

Year-like fields are parsed by `parseYear` (non-numeric tokens like "No se permite" / "Pendiente" / "" → `Infinity`, never triggers). `voluntary_release` uses `parseVoluntaryRelease`: "Sin plazo" → `-Infinity` (always in "maybe" once built).

Exported summarizers (all sum `value` over rows):

- `summarize(rows, year)` → `{ built, permanent, protected, maybe, lost }`.
- `summarizeByPlan(rows, year)` → `{ built, estatal, autonomico, sinInfo, lost }`.
- `summarizeByPromotor(rows, year)` → `{ built, publico, privado, autopromotor, sinAnimoLucro, sinInfo, lost }`.
- `summarizeByTenencia(rows, year)` → `{ built, propiedad, alquiler, mixto, sinInfo, lost }`.

`built` is the cumulative total of all built rows (includes `lost`). The non-`built` keys for the live stock buckets sum to `built − lost`.

`housesData.years = range(1991, 2031)` (1991–2030 inclusive). `firstProjectionYear = 2026` (`chartConfig.js`) is the single source of truth — the `BuiltLine` solid/dashed split, `ProjectionOverlay` and the a11y descriptions all derive from it. Values from that year on are rendered as projection (dashed line + overlay).

CCAA name handling now goes through the canonical catalog in `src/states/ccaaCatalog.js` (see "CCAA catalog" above). The legacy CSV column values are normalised at ingest in `data.svelte.js`, so callers always see canonical ids.

## Reactive patterns

- State classes using Svelte 5 runes (`$state`, `$derived`, `$effect`). Singletons exported from `states/*`.
- `housesData.loadFromUrl` / `plazosData.load` are idempotent (shared in-flight promise, cached `value`). Multiple chart instances per CCAA all await the same fetch.
- Tweened numbers via `svelte/motion` `Tween.of`, `cubicOut`, ~600ms.
- `MediaQuery` and `SvelteURL` from `svelte/reactivity`.
- Single-CCAA mount strategy (see Embedding model): only the active CCAA is mounted, so charts always receive `active: true`. `StackedChart`'s `frozenPlanView` mechanism and `PlazosChart`'s `active`-driven tooltip clear are dormant under this strategy but kept so the chart components stay safe to use under any future mount strategy (e.g. LRU N=3).
- A single `ResizeObserver` lives in `App.svelte` (`observeWidth` attachment) and feeds `chartLayout.containerWidth`; charts read that instead of owning their own observer, so on-demand mounts get a valid width on first paint.
- Cross-CCAA crossfade uses the View Transitions API (`document.startViewTransition`) with `view-transition-name: ccaa-block` set only on the active block; falls back to a plain `flushSync` when the API or `prefers-reduced-motion: reduce` are unavailable.
- `PlazosChart`'s `Tooltip` portals itself to `.ccaa-content` via an `{@attach}` on mount. The active `.ccaa-block` creates a stacking context (via `view-transition-name`) that would trap the tooltip below `.nav-sticky` (`z-index: 5`); reparenting to the outer article frees the tooltip's `z-index: 999999` while still inheriting the chart's CSS vars (`--primary`, `--bw*`) which are scoped to `#<appId>`.

## Colors

Injected as CSS vars on `#<appId>` via an inline `<style>` block in `App.svelte`:

- Main: `--civio-blue`, `--civio-yellow`, `--civio-green`, `--civio-lightYellow`, `--civio-lightGreen`
- Project (`lopublico`): `--primary: #f74383`, `--secondary: #FEA2D4`, `--light: #ffecf6`
- Grayscale ramp: `--bw0` … `--bw990`

`appArea = 'lopublico'` in `src/utils/colors.js`.

## Configuration

`package.json` → `civio` field drives `appId`, `projectPath`, `languages`. `vite.config.js` injects those via `define` and replaces `__APP_ID__` / cache-busts `assets/index.{js,css}` in `transformIndexHtml`.

## Conventions

- Code in English (names, comments); UI copy in Spanish.
- camelCase variables/functions, PascalCase components, kebab-case CSS.
- No `console.log` in production code.
- Prefer editing existing files; avoid new abstractions unless needed.
