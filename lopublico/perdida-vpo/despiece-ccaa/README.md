# Despiece por CCAA — Pérdida de VPO

Per-region breakdown of how Spain's social housing stock (VPO) has evolved since 1991. The host article — written in Jekyll by Civio's journalists — provides one editorial section of prose per autonomous community; this project injects two charts inside each section that adapt to the data of the active CCAA:

- A **stacked-area chart** of protection states over time: built, protected, permanent, "maybe protected" and lost.
- A **Gantt-style timeline** of the legal terms and regulations that govern them.

Together they show when and why public housing leaves the protected pool in each region.

On load, the reader's region is detected by IP (`get.geojs.io`, 2.5 s timeout); if detection fails or times out, a random community is shown instead. A selector plus prev/next buttons (and ←/→ keys) let the reader move easily across the other 18 CCAAs, with a view-transition crossfade between blocks.

![Preview](preview.gif)

## Live preview

**Dataviz URL**: https://graphs.civio.es/lopublico/perdida-vpo/despiece-ccaa/dist

**Investigation URL**: https://civio.es/lo-publico/2026/05/21/evolucion-vpo-desde-1991-proteccion-en-vigor-por-comunidades-autonomas/

## Stack

- **Framework**: Svelte 5 (runes)
- **Bundler**: Vite
- **Languages**: Spanish
- **Other**: D3, View Transitions API, Playwright (iframe generation)

## Accessibility

Each CCAA section is a `region` landmark labelled by its heading. Charts ship with a `ScreenReaderDescription` generated from the data, and the embed accepts `data-a11y` / `data-alt` overrides (equivalent to `?a11y` / `?alt`). Cross-CCAA crossfades fall back to a plain swap under `prefers-reduced-motion: reduce`, and prev/next navigation is keyboard-accessible (←/→).

## Development

Requires Node v24.13.0.

```bash
nvm install v24.13.0 # if you don't have it
nvm use
npm install
npm run dev
```

## Build

```bash
npm run build
```
