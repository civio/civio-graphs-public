<script>
  import { vizLang } from '../../states/language.svelte.js';
  import { thresholds, permanentColor } from './colorScale.js';

  // Mirror the first vigente row's color so the historic-vs-vigente example
  // visually matches the top bar of the chart. Falls back to the first
  // threshold tint when no current row is available yet (e.g. pre-load).
  const { exampleColor: exampleColorProp = null } = $props();
  const exampleColor = $derived(exampleColorProp ?? thresholds[0].color);
</script>

<div class="legend" aria-hidden="true">
  <div class="colors">
    <span class="title">{vizLang.texts.plazosChart.legend.yearsTitle}</span>
    <div class="color-swatches">
      {#each thresholds as t (t.label)}
        <span class="color-swatches-chip" style:background={t.color}>{t.label}</span>
      {/each}
      <span class="color-swatches-chip permanent" style:background={permanentColor}>
        {vizLang.texts.plazosChart.legend.permanent}
      </span>
    </div>
  </div>

  <div class="example" role="img" aria-label={vizLang.texts.plazosChart.legend.howToReadAria}>
    <div class="example-row">
      <span class="tag">{vizLang.texts.plazosChart.legend.historic}</span>
      <div class="bars" aria-hidden="true">
        <span class="bar bar-past" style:background={exampleColor}></span>
        <span class="bar bar-current" style:background={exampleColor}></span>
        <span class="bar-marker"></span>
      </div>
      <span class="tag tag-current">{vizLang.texts.plazosChart.legend.current}</span>
    </div>
  </div>
</div>

<style>
  .legend {
    display: flex;
    align-items: flex-end;
    gap: 1rem;
    margin: 1rem 0;
    justify-content: space-evenly;
  }

  /* color legend */
  .color-swatches {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 1rem;
    font-size: 0.75rem;
    color: var(--bw600);
  }

  .color-swatches-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 3px 10px;
    border-radius: 4px;
    font-size: 0.72rem;
    font-weight: 600;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    line-height: 1.3;
  }

  .color-swatches-chip.permanent {
    margin-left: 4px;
  }

  .colors {
    display: flex;
    flex-direction: column;
    row-gap: 0.35rem;

    .title {
      font-size: 0.72rem;
      color: var(--bw700);
      font-weight: 600;
      letter-spacing: 0.02em;
      line-height: 1;
    }
  }

  .legend :global(.color-swatches) {
    margin: 0;
  }

  .example {
    position: relative;
    border-radius: 6px;
    /*padding: 12px 10px;*/
    /*align-self: center;*/
  }

  .example-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .tag {
    font-size: 0.7rem;
    color: var(--bw500);
    line-height: 1;
    white-space: nowrap;
  }

  .tag-current {
    color: var(--bw900);
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .bars {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .bar {
    width: 40px;
    height: 21px;
    border-radius: 2px;
    display: block;
    cursor: default !important;
  }

  .bar-past {
    opacity: 0.3;
  }

  .bar-marker {
    width: 3px;
    height: 21px;
    background: var(--bw900);
    border-top-right-radius: 2px;
    border-bottom-right-radius: 2px;
    margin-left: -5px;
    z-index: 5;
  }

  @media (max-width: 600px) {
    .legend {
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      margin: 1.5rem;
    }
  }
</style>
