<script>
  import { getContext } from 'svelte';
  import { subBackground, subLabel } from './colorScale.js';

  const { row, gridRow } = $props();
  const ctx = getContext('plazosChart');
</script>

<div class={['label', !row.isCurrent && 'inactive']} style:grid-row={gridRow}>
  <span class={['text', row.isCurrent && 'current']} title={row.label}>{row.label}</span>
</div>

<div
  class="track"
  style:grid-row={gridRow}
  style:grid-column="2 / {ctx.years.length + 2}"
  aria-hidden="true"
></div>

{#each row.spans as span, spi (span.startYear)}
  <div
    class={[
      'bar',
      'sub',
      span.endYear === ctx.lastYear && 'current',
      span.endYear !== ctx.lastYear && 'inactive',
    ]}
    style:grid-row={gridRow}
    style:grid-column="{ctx.yearToCol(span.startYear)} / {ctx.yearToCol(span.endYear) + 1}"
    style:background={subBackground(span)}
    role="presentation"
    onpointerenter={(e) => ctx.handleSubPointerEnter(e, span, row.label, row.ccaaName)}
    onpointerleave={ctx.handlePointerLeave}
  >
    <span class="value">{@html subLabel(span)}</span>
  </div>
{/each}

<style>
  .bar {
    position: relative;
    z-index: 1;
    border-radius: 2px;
    margin: 2px 1px;
    cursor: pointer;
    transition: opacity 0.32s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .bar.current {
    z-index: 2;
  }

  /* Vigent marker: a 3px right cap matching IntroLegend's .bar-marker.
     Done as a pseudo-element instead of `border-right` so the bar's own
     border-radius doesn't clip its corners and make it look thinner. */
  .bar.current::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 3px;
    background: var(--bw900);
    border-radius: 0 2px 2px 0;
    pointer-events: none;
  }

  .bar:hover {
    opacity: 0.8 !important;
    outline: 2px solid var(--bw800);
    outline-offset: -1px;
    z-index: 10;
  }
  .label {
    grid-column: 1;
    background: transparent;
    padding: 0 6px 0 18px;
    min-height: 24px;
    display: flex;
    align-items: center;
    position: sticky;
    left: 0;
    z-index: 2;
  }

  .label.inactive {
    opacity: 0.5;
  }

  .text {
    font-size: 0.64rem;
    color: var(--bw600);
    line-height: 1.15;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
  }

  .text.current {
    font-weight: 700;
    color: var(--bw900);
  }

  .track {
    background: transparent;
  }

  .sub {
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .inactive {
    opacity: 0.3;
  }

  .value {
    font-size: 0.55rem;
    font-weight: 600;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    white-space: nowrap;
  }

  @media (max-width: 640px) {
    .label {
      padding: 0 4px 0 12px;
    }
  }
</style>
