<script>
  import { vizLang } from '../states/language.svelte.js';

  const { thresholds, permanentColor, colorMode } = $props();
</script>

<div class="color-legend">
  {#if colorMode === 'steps'}
    {#each thresholds as t (t.label)}
      <span class="color-legend__chip" style:background={t.color}>{t.label}</span>
    {/each}
  {:else}
    <span class="color-legend__label">{vizLang.texts.legend.minYears}</span>
    <div class="color-legend__bar"></div>
    <span class="color-legend__label">{vizLang.texts.legend.maxYears}</span>
  {/if}
  <span class="color-legend__chip color-legend__chip--permanent" style:background={permanentColor}
    >{vizLang.texts.legend.permanent}</span
  >
</div>

<style>
  .color-legend {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 1rem;
    font-size: 0.75rem;
    color: var(--bw600);
  }

  .color-legend__chip {
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

  .color-legend__chip--permanent {
    margin-left: 12px;
  }

  .color-legend__bar {
    width: 120px;
    height: 12px;
    border-radius: 3px;
    background: linear-gradient(to right, #f74383, #875cc3);
  }

  .color-legend__label {
    font-size: 0.72rem;
  }
</style>
