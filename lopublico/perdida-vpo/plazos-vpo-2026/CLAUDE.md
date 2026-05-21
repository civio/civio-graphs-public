# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This is a single visualisation inside the larger `civio-graphs` monorepo. Repo-wide conventions live in `../../../.claude/CLAUDE.md` (Svelte 5 + runes, npm/nvm setup, language). Read both.

## Commands

Always `source ~/.nvm/nvm.sh && nvm use` first — `.nvmrc` pins Node `v24.13.0`.

| Command                           | What it does                                                                                                                                                                                                                                                    |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                     | Vite dev server on `http://localhost:5173/`                                                                                                                                                                                                                     |
| `npm run build`                   | Production build to `dist/` (assets unhashed, see Vite config)                                                                                                                                                                                                  |
| `npm run preview`                 | Serve the built `dist/`                                                                                                                                                                                                                                         |
| `npm run lint`                    | `oxlint src` with the rules in `oxlint.json` (e18e + unicorn picks)                                                                                                                                                                                             |
| `npm run lint:fix`                | Same, with autofix                                                                                                                                                                                                                                              |
| `npm run lint:deps`               | `knip` — unused files/exports/deps from `src/main.js`                                                                                                                                                                                                           |
| `npm run lint:all`                | `lint` + `lint:deps`                                                                                                                                                                                                                                            |
| `npm run format` / `format:check` | Prettier (config in `.prettierrc`)                                                                                                                                                                                                                              |
| `npm run iframe`                  | Run `generate-breakpoints.js` to measure heights at fixed widths and emit `public/iframes/{appId}-{lang}-responsive.md` plus `breakpoints-report.md`. Boots the dev server with Playwright if not already up. Flags: `--selector=<id>`, `--languages=es,en,...` |
| `npm run iframe:public`           | Same as `iframe` but for the public-mode build                                                                                                                                                                                                                  |

There are no unit tests in this project.

## Architecture

### Mount + embed contract

`src/main.js` mounts `App.svelte` into `document.getElementById(__APP_ID__)`, where `__APP_ID__` is replaced at build time from `package.json#civio.appId` (`"plazos-vpo-2026"`). The host element's `id`, `lang`, `data-a11y`, and `data-alt` attributes flow in as the props `chartID`, `lang`, `a11y`, and `alt`.

`vite.config.js` does three project-specific things:

1. Defines `__APP_ID__`, `__PROJECT_PATH__`, `__INVESTIGATION_URL__` from the `civio` block in `package.json`.
2. Forces unhashed `assets/index.js` / `assets/index.css` filenames so the embed snippet stays stable across rebuilds.
3. A custom `html-transform` plugin substitutes `__APP_ID__` in `index.html` and appends `?v=<timestamp>` to the JS/CSS URLs for cache-busting.

The viz is consumed as an iframe. `generate-breakpoints.js` produces the responsive `<iframe>` + container-query CSS snippet that civio.es embeds; the iframe `src` is `https://graphs.civio.es/{civio.projectPath}/dist`.

### Data flow

CSV → store → typed structure → render. The store is the only place that talks to the network.

- **Source**: `https://data.civio.es/lopublico/desaparicion-vpo/graficos/plazos-viviendas-estructurado.csv` (semicolon-delimited, UTF-8 BOM).
- **Store**: `src/states/plazosData.svelte.js` exports a singleton `plazosData` (class with `$state` fields). `load()` is idempotent — shared in-flight promise, cached forever after success. Only rows with `end_year === 2026` (`CURRENT_END_YEAR`) are kept; older periods are dropped at parse time so the rest of the app never has to pick a period. Raw CSV region names are normalised by the local `regionToSlug()` helper using the `csvAliasToId` map exported by `src/states/ccaaCatalog.js`; **adding a new raw region name means adding a `csvAlias` to that catalog** (it throws otherwise).
- **Shape produced**: `{ rows: [{ name, scope: 'estatal'|'ccaa', subs: [{ label, years|isPermanent|minYears|maxYears, note? }] }] }`. There is no `years` array nor a `periods` level — only the current regulation survives, so each row holds its `subs` directly. `parsePlazo` handles `"15"`, `"P"`, `"10-30"`, `"15-P"` (empty → row dropped).
- **CCAA catalog**: `src/states/ccaaCatalog.js` is the single source of truth for the 19 autonomous communities — `CCAAS` (canonical entries with `es` label, `ipRegions`, `csvAliases`) plus the derived maps `csvAliasToId`, `ccaaDisplayNames`, `ipRegionToId`.
- **Sort**: `src/lib/plazos/sortRows.js` filters out Ceuta/Melilla (covered by state framework), keeps Estatal rows on top, then sorts CCAAs by the colour-tier mix of their current `subs` (more permissive bands first), with subs-less CCAAs last.
- **Render**: `App.svelte` → `PlazosVigentes.svelte` (owns tooltip + expanded-row state) + `Footer.svelte` (sources, methodology link, share modal). `PlazosVigentes.svelte` → `IntroLegend.svelte` (title + `ColorLegend.svelte` + `TouchIcon.svelte` + example bar) + `PlazosGrid.svelte` (grid with subgrid rows; one band row per CCAA, expanding into per-sub rows) + `PlazosTooltip.svelte` (fixed-position, viewport-clamped, flips above/below the bar based on available space) + `PlazosA11y.svelte` (semantic markup driven by `src/a11y/`).

### Visual encoding

`src/lib/plazos/colorScale.js` is the single source of truth for colour and labels. Bands are `≤15`, `16–30`, `31–90` (pinks → purples) and a separate "permanent" colour. `diagonalGradient(subs)` builds the multi-housing-type band as a 135° linear gradient with thin separators between subs. Per-sub rows use `subBackground` (solid colour, or a gradient when years are a range).

### Reactive state modules

Three `.svelte.js` modules in `src/states/` hold app-wide singletons using runes:

- `language.svelte.js` — `vizLang` (Lang class) holds the active language string set; only `es` is implemented. `vizLang.ccaaLabel(slug)` is the canonical CCAA→label lookup.
- `utils.svelte.js` — `urlInfo` (URL/`?lang`, `?a11y`, `?alt`, `isCivio` host check) and `prefersReducedMotion` (`MediaQuery`).
- `plazosData.svelte.js` — see above.

When you need a new collection that drives reactivity, prefer `SvelteMap` / `SvelteSet` from `svelte/reactivity` (the project already uses `MediaQuery`, `SvelteURL`).

Plain (non-reactive) helper modules live in `src/utils/`: `colors.js` (Civio palette → CSS-variable strings injected by `App.svelte`), `locale.js` (`d3` number formatters per language), and `clickOutside.svelte.js` (a Svelte attachment for outside-click detection).

### Accessibility

**Estrategia**: el gráfico visual está enteramente oculto a lectores de pantalla (`PlazosVigentes` envuelto en `aria-hidden`). `PlazosA11y.svelte` renderiza la versión semántica `sr-only` que sí lee el SR, construida por `getPlazosA11y(rows, vizLang)` desde `src/a11y/plazos.js`. Empieza con un `<h3>` (título), una **descripción de la forma del gráfico** (cuadrícula + código de color, qué CCAAs encabezan y cierran la lista) y una pista de navegación (`navHint`), seguidas de un `<h4>` por fila (Estatal + CCAAs) con su `<ul>` de tipos de VPO y plazo. SR primero entiende el gráfico, luego accede al detalle.

**Texto único compartido entre SR y `?alt`**: el campo `vizLang.texts.a11y.description` cumple doble función — lo lee el SR como intro del gráfico, y se renderiza visible como `.alt-description` en modo `?alt` (URL param o `data-alt` attribute) para que los periodistas lo copien junto a un pantallazo. Si el texto cambia, cambia en ambos sitios a la vez.

**Modo debug**: `?a11y` URL param o `data-a11y` attribute → hace visible el bloque `.sr-only` (caja amarilla), pinta los `aria-label` de landmarks (`section[aria-label]::before` verde) y baja a 10% la opacidad de elementos `aria-hidden` (con `!important` para vencer a estilos componentizados). Útil al cambiar el output de a11y.

**Modo periodista**: `?alt` URL param o `data-alt` attribute → renderiza un bloque `.alt-description` visible (italic, fondo gris, borde lateral) justo encima del footer con el mismo texto que oye el SR.

## Code style

- Comments in source files explain _why_ (subtle invariants, gotchas like the BOM strip, why Ceuta/Melilla are hidden). Match this style — don't add what-comments.
- Linter prefers ES2023+ idioms: `.toSorted`, `.at(-1)`, `Object.hasOwn`, `Date.now()`, `URL.canParse`, etc. (`oxlint.json` enforces). `eqeqeq` is configured with `{ "null": "ignore" }`, so the intentional `== null` / `!= null` checks are allowed.
- `prefer-const` is disabled for `*.svelte` files via an `overrides` block in `oxlint.json`. Reason: `oxlint` doesn't recognise that a `bind:` directive reassigns its target, so its `--fix` would rewrite `let` `$state` variables bound via `bind:this`/`bind:offsetWidth`/etc. to `const` and break the build with `Cannot bind to constant`. Keep that override — don't re-enable the rule for components.
- Prettier: 2-space indent, single quotes, no tabs, 100-col, ES5 trailing commas. Svelte order: `options-scripts-markup-styles`.
