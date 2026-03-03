# Motivos de sanciones de aislamiento

Interactive square-packing visualization showing prison isolation sanctions by disciplinary reason code (2020-2025). Concentric year rings per motivo, filterable by administration (AGE, Cataluña) and gender. Sanctions are classified as violent vs non-violent with 18 distinct reason codes.

![Preview](preview.png)

## Live preview

**Dataviz URL**: https://graphs.civio.es/justicia/aislamiento-prisiones/motivos-sanciones/dist
**Investigation URL**: https://civio.es/justicia/2026/03/04/aislamiento-el-castigo-en-prision-que-viola-todas-las-recomendaciones-de-la-onu/

## Stack

- **Framework**: Svelte 5
- **Bundler**: Vite 7
- **Other**: D3 (CSV parsing, rollup, scales), Playwright (iframe generation)

## Accessibility

Screen reader descriptions with data tables generated from chart hierarchy. Debug mode (`?a11y`) and alt-text mode (`?alt`). Three-tier responsive label system (inline, displaced, code) ensures readability at all sizes.

## Development

Requires Node v24.13.0.

```bash
nvm install 24.13.0 # if you don't have it
nvm use
npm install
npm run dev
```

## Build

```bash
npm run build
```
