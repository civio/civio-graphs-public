<script>
  import { fade } from 'svelte/transition';
  import { clickOutside } from '../utils/clickOutside.svelte';
  import { isMobile } from '../states/utils.svelte';
  import { vizLang } from '../states/language.svelte';
  import { data } from '../states/data.svelte';
  import MiniChart from './MiniChart.svelte';

  let {
    name,
    yearBreakdown,
    yearTotals = {},
    globalMaxPct = 1,
    fillColor,
    position = { x: 0, y: 0 },
    onclose,
    highlightYear = null,
  } = $props();

  let causes = $derived(vizLang.texts.causes);
  let cause = $derived(causes[name?.toLowerCase()] ?? {});
  let label = $derived(cause.labelShort ?? name);
  let typeLabel = $derived(cause.type ?? '');

  let years = $derived(
    yearBreakdown ? [...yearBreakdown.entries()].sort((a, b) => a[0] - b[0]) : []
  );

  // Compute percentage for each year: motivo count / year total * 100
  let dataPoints = $derived(
    years.map(([year, value]) => {
      const yt = yearTotals[year] ?? 0;
      const pct = yt ? (value / yt) * 100 : 0;
      return { year, value, pct };
    })
  );

  // a11y: move focus into tooltip on mount, restore on close
  let tooltipEl = $state(null);
  let previouslyFocused = document.activeElement;

  $effect(() => {
    if (tooltipEl) {
      tooltipEl.focus({ preventScroll: true });
    }
    return () => {
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  });
</script>

<div
  transition:fade={{ duration: 100 }}
  class="chart-tooltip"
  class:mobile={isMobile.current}
  class:desktop={!isMobile.current}
>
  <div
    bind:this={tooltipEl}
    class="tooltip-info"
    role="dialog"
    aria-label="{vizLang.texts.tooltipDetail}: {label}"
    tabindex="-1"
    style={!isMobile.current
      ? `position:absolute;top:${position.y}px;left:${position.x}px;transform:translate(-50%, -110%)`
      : ''}
    {@attach clickOutside({
      onClickOutside: () => onclose?.(),
    })}
  >
    <button onclick={() => onclose?.()} aria-label={vizLang.texts.closeTooltip}>x</button>

    <header class="tooltip-header">
      <p class="adm-label" style="background-color:{fillColor}">
        {vizLang.texts[data.selectedAdm.toLocaleLowerCase()]}
      </p>
      <p class="motivo-type">{name?.toUpperCase()} - {typeLabel}</p>
      <p class="motivo-label"><span>{label}</span></p>
    </header>

    <!-- Mini line chart (% values) -->
    <MiniChart {dataPoints} {globalMaxPct} {fillColor} {highlightYear} />
  </div>
</div>

<style>
  button {
    cursor: pointer;
    transition: transform 0.3s;
    background: none;
    border: none;
    font-size: 1rem;
    line-height: 1;
    position: absolute;
    right: 8px;
    top: 5px;

    &:active {
      transform: scale(0.93);
    }
  }

  p {
    margin-bottom: 0;
  }

  .chart-tooltip {
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 10;
  }

  .chart-tooltip.mobile {
    display: flex;
    align-items: center;
    justify-content: center;

    .tooltip-info {
      max-height: 95%;
      overflow-y: auto;
    }
  }

  .chart-tooltip.desktop {
    pointer-events: none;

    .tooltip-info {
      pointer-events: auto;
      min-width: 200px;
      z-index: 4;
    }
  }

  .tooltip-info {
    background-color: white;
    max-width: 300px;
    width: 90%;
    border: solid black 2px;
    border-radius: 10px;
    padding: 10px;
    position: relative;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  }

  .tooltip-header {
    margin-bottom: 0.25rem;
  }
  .motivo-label {
    font-size: 0.8rem;

    color: var(--bw600);
    margin-bottom: 0.25rem;
    line-height: 1.3;
    padding-right: 10px;

    span {
      font-weight: 800;
    }
  }
  .adm-label {
    font-size: 0.8rem;
    margin-bottom: 0.2rem;
    display: inline-block;
    padding: 0 0.5rem;
    border-radius: 0.25rem;
    color: #fff;
  }
  .motivo-type {
    color: var(--bw500);
    font-weight: normal;
    font-size: 0.7rem;
  }
</style>
