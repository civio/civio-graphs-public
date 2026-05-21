# Desaparición VPO acumulada

Scrollytelling visualization tracking the evolution of Spain's protected housing stock (VPO) from 1991 to 2030: built stock, permanent vs. temporary protection, loss of protection, voluntary disqualification and a projection to 2030 (real data through 2025). The final step lets the reader explore the data freely across four dimensions: protection status, funding plan, developer type and tenure.

![Preview](preview.gif)

## Live preview

**Dataviz URL**: https://graphs.civio.es/lopublico/perdida-vpo/scroll-desaparicion-vpo/dist

**Investigation URL**: https://civio.es/lo-publico/2026/05/21/evolucion-vpo-desde-1991-proteccion-en-vigor-por-comunidades-autonomas/

## Stack

- **Framework**: Svelte 5 (runes)
- **Bundler**: Vite
- **Languages**: Spanish
- **Other**: D3, custom `IntersectionObserver`-based scrollytelling

## Accessibility

The visual chart is entirely hidden from screen readers (`aria-hidden` + `inert` on the SVG, number boxes, step indicator and visual selector). In parallel, a labelled region holds six nested `<section>`s — one per narrative step — that are exposed to assistive tech instead. Each step contains:

- An `sr-only` heading (`Paso N de 6: …`) so screen-reader users can navigate the story by headings.
- The narrative text with the highlighted figures pulled live from the data.
- A complementary description of the **shape** of the chart at that step — which layers are visible, how the axis grows, what the projection introduces — without repeating numbers.
- A data table whose rows and columns reflect only what is painted at that step, mirroring the progressive disclosure of the scroll.

All six sections are rendered statically — no mount/unmount during scroll — so the screen-reader reading is never interrupted. The interactive selector of the final step has a parallel accessible version (`<fieldset>` with `sr-only` radios) that duplicates the visual control across the four dimensions.

Debug modes via URL params or host attributes:

- `?a11y` / `data-a11y` — reveals the `.sr-only` content, paints `aria-label`s on landmarks and lowers opacity for `aria-hidden` elements.
- `?alt` / `data-alt` — surfaces the chart descriptions as a visible `alt-description` block for editorial reuse.

The `prefers-reduced-motion` preference is honoured for animations.

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
