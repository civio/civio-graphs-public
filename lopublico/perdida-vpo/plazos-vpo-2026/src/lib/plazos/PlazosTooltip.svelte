<script>
  import { vizLang } from '../../states/language.svelte.js';
  import { subColor, subLabel, isFullyPermanent } from './colorScale.js';

  const { data, x, anchorTop, anchorBottom } = $props();

  let tooltipEl = $state(null);
  let tooltipWidth = $state(0);
  let tooltipHeight = $state(0);

  const viewportPad = 8;
  const gap = 8;

  // Flip below the bar if the tooltip would overflow the top of the viewport.
  const placeBelow = $derived.by(() => {
    if (!tooltipHeight || typeof window === 'undefined') return false;
    return anchorTop - gap - tooltipHeight < viewportPad;
  });

  const y = $derived(placeBelow ? anchorBottom + gap : anchorTop - gap);

  const safeX = $derived.by(() => {
    if (!tooltipWidth || typeof window === 'undefined') return x;
    const vw = window.innerWidth;
    const half = tooltipWidth / 2;
    return Math.max(half + viewportPad, Math.min(x, vw - half - viewportPad));
  });

  const protection = $derived.by(() => {
    if (!data) return null;
    if (isFullyPermanent(data))
      return {
        prefix: vizLang.texts.tooltip.protectionPrefix,
        bold: vizLang.texts.tooltip.protectionPermanentValue,
      };
    if (data.years != null)
      return {
        prefix: vizLang.texts.tooltip.protectionDuringPrefix,
        bold: vizLang.texts.tooltip.yearsValue(data.years),
      };
    if (data.minYears != null && data.maxYears != null)
      return {
        prefix: vizLang.texts.tooltip.protectionRangePrefix,
        bold: vizLang.texts.tooltip.yearsRangeValue(data.minYears, data.maxYears),
      };
    return null;
  });
</script>

{#if data}
  <div
    bind:this={tooltipEl}
    bind:offsetWidth={tooltipWidth}
    bind:offsetHeight={tooltipHeight}
    class={['plazos-vigentes-tooltip', placeBelow ? 'below' : 'above']}
    style="top: {y}px; left: {safeX}px;border-color:{subColor(data)}"
    aria-hidden="true"
  >
    <p class="header info-row">
      <span class="icon" aria-hidden="true">📍</span>
      {vizLang.ccaaLabel(data.ccaa)}
    </p>

    <p class="info-row">
      <span class="icon" aria-hidden="true">🏠</span>
      {data.label === 'Todos' ? vizLang.texts.tooltip.allHouses : data.label}
    </p>
    <p class="info-row protection">
      <span class="icon" aria-hidden="true">🗓️</span>
      <span>
        {#if protection}
          {protection.prefix}<b>{protection.bold}</b>{#if data.note}, {data.note.toLowerCase()}{/if}
        {/if}
      </span>
    </p>
  </div>
{/if}

<style>
  .plazos-vigentes-tooltip {
    position: fixed;
    transform: translate(-50%, -100%);
    background: white;
    color: var(--bw800);
    border: 2px solid var(--bw500);
    border-radius: 10px;
    padding: 10px 12px;
    font-family: Lato, sans-serif;
    font-size: 0.78rem;
    line-height: 1.2;
    pointer-events: none;
    z-index: 999999;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
    width: min(320px, calc(100vw - 16px));
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    row-gap: 0.7rem;
    animation: tooltip-in-up 120ms cubic-bezier(0.22, 1, 0.36, 1) both;

    & p {
      width: 100%;
      margin-bottom: 0;
    }

    .info-row {
      display: flex;
      align-items: center;

      &:not(.header) .icon {
        margin-right: 5px;
      }

      & b {
        margin-left: 0.25em;
      }

      &.header {
        justify-content: center;
        flex-wrap: wrap;
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--bw700);
        font-weight: 600;
        overflow-wrap: anywhere;
        gap: 0.35rem;
      }
    }
  }

  .plazos-vigentes-tooltip.below {
    transform: translate(-50%, 0);
    animation-name: tooltip-in-down;
  }

  @keyframes tooltip-in-up {
    from {
      opacity: 0;
      transform: translate(-50%, calc(-100% + 4px));
    }
    to {
      opacity: 1;
      transform: translate(-50%, -100%);
    }
  }

  @keyframes tooltip-in-down {
    from {
      opacity: 0;
      transform: translate(-50%, -4px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
</style>
