<script>
  import { max, sum } from 'd3';
  import { vizLang } from '../states/language.svelte';
  import { isMobile, urlInfo } from '../states/utils.svelte';
  import Tooltip from './Tooltip.svelte';
  import HorizontalChart from './HorizontalChart.svelte';
  import VerticalChart from './VerticalChart.svelte';
  import ScreenReaderDescription from './ScreenReaderDescription.svelte';
  import { getMainChartA11y } from '../a11y';

  let { chartData, type } = $props();

  let displayedValue = $state('relX1000');

  let maxValue = $derived(
    max(chartData.grouped?.flatMap((year) => year.data) ?? [], (adm) =>
      sum(adm.categories, (c) => +c[displayedValue])
    )
  );

  let tooltipData = $state(undefined);
  let tooltipYearIndex = $state(undefined);

  function handleYearClick(yearData, yearIndex) {
    tooltipData = yearData;
    tooltipYearIndex = yearIndex;
  }

  // For SVG rects: returns fill string (hatched bars use per-admin pattern with color baked in)
  function getCategoryColor(adm, catIndex) {
    const admKey = adm.adm.toLowerCase();
    return catIndex === 0 ? `var(--${admKey})` : `url(#hatch_${admKey}_${type})`;
  }

  // For HTML divs (tooltip, legend): returns CSS background value
  function getCategoryBackground(adm, catIndex) {
    const adminColor = `var(--${adm.adm.toLowerCase()})`;
    if (type === 'sancion') {
      return catIndex === 0
        ? adminColor
        : `repeating-linear-gradient(-45deg, ${adminColor}, ${adminColor} 1px, transparent 1px, transparent 3px)`;
    }
    if (adm.categories.length === 1) {
      return `var(--${adm.adm.toLowerCase()})`;
    }
    return `var(--${adm.adm.toLowerCase()}_cat_${catIndex + 1})`;
  }

  let chartA11y = $derived(getMainChartA11y(vizLang, chartData.grouped, type));

  // make the slider reactive with the resize
  let labelDims = $state({ rel: { left: 0, width: 0 }, total: { left: 0, width: 0 } });

  function trackLabel(node, key) {
    function update() {
      labelDims[key] = { left: node.offsetLeft, width: node.offsetWidth };
    }
    const ro = new ResizeObserver(update);
    ro.observe(node);
    update();
    return { destroy: () => ro.disconnect() };
  }

  let sliderStyle = $derived.by(() => {
    const dims = displayedValue === 'relX1000' ? labelDims.rel : labelDims.total;
    return dims.width ? `left:${dims.left}px;width:${dims.width}px` : '';
  });
</script>

<fieldset class="options-container" aria-hidden="true">
  <span class="slider" style={sliderStyle}></span>
  <input
    type="radio"
    id="displayedValue-{type}-rel"
    name="displayedValue-{type}"
    value="relX1000"
    bind:group={displayedValue}
  />
  <label
    for="displayedValue-{type}-rel"
    class:active={displayedValue === 'relX1000'}
    use:trackLabel={'rel'}
  >
    {vizLang.texts.ratioLabel[type]}
  </label>
  <input
    type="radio"
    id="displayedValue-{type}-total"
    name="displayedValue-{type}"
    value="total"
    bind:group={displayedValue}
  />
  <label
    for="displayedValue-{type}-total"
    class:active={displayedValue === 'total'}
    use:trackLabel={'total'}
  >
    {vizLang.texts.totalLabel[type]}
  </label>
</fieldset>

<!-- legend -->
<div
  style="margin-bottom:1.5rem;display:flex;flex-direction: column;justify-content: center;font-size:.8rem;color:var(--bw600)"
>
  {#if type === 'sancion'}
    <div class="legend-container" aria-hidden="true" style="gap:1rem">
      <div style="display: flex;flex-direction: column;align-items: center;">
        <div style="background-color:var(--bw500);width: 75px;" class="bar"></div>
        <p>{vizLang.texts.legendIsolation}</p>
      </div>
      <div style="display: flex;flex-direction: column;align-items: center;">
        <div
          style="background:repeating-linear-gradient(-45deg, var(--bw500), var(--bw500) 1px, transparent 1px, transparent 3px);width: 75px;"
          class="bar"
        ></div>
        <p>{vizLang.texts.legendWeekend}</p>
      </div>
    </div>
  {/if}
</div>

<ScreenReaderDescription {...chartA11y} visible={urlInfo.alt} />

<div class="chart-wrapper">
  <div aria-hidden="true">
    {#if isMobile.current}
      <HorizontalChart
        grouped={chartData.grouped}
        {type}
        {displayedValue}
        {maxValue}
        {getCategoryColor}
        onYearClick={handleYearClick}
        blurBackground={isMobile.current && tooltipData}
      />
    {:else}
      <VerticalChart
        grouped={chartData.grouped}
        {type}
        {displayedValue}
        {maxValue}
        {getCategoryColor}
        onYearClick={handleYearClick}
        selectedYearIndex={tooltipData ? tooltipYearIndex : undefined}
      />
    {/if}

    {#if tooltipData}
      <Tooltip
        {type}
        bind:tooltipData
        yearIndex={tooltipYearIndex}
        yearCount={chartData.grouped?.length ?? 0}
        {getCategoryBackground}
      />
    {/if}
  </div>
</div>

<style>
  .chart-wrapper {
    width: 100%;
    position: relative;
  }

  .legend-container {
    display: flex;
    align-items: center;
    width: 100%;
    justify-content: center;

    p {
      margin-bottom: 0;
    }

    .bar {
      width: 20%;
      max-width: 75px;
      height: 10px;
      border: solid 1px white;
    }
  }

  .options-container {
    display: flex;
    justify-content: center;
    margin: 2rem auto 1rem;
    padding: 0;
    background: var(--bw100);
    border: solid 1px var(--bw500);
    width: fit-content;
    border-radius: 50px;
    position: relative;
    overflow: hidden;
    gap: 0.25rem;

    .slider {
      position: absolute;
      top: 0;
      height: 100%;
      background: var(--bw900);
      border-radius: 50px;
      transition:
        left 0.3s ease,
        width 0.3s ease;
      z-index: 0;
      pointer-events: none;
    }

    label {
      cursor: pointer;
      padding: 2px 10px;
      color: var(--bw700);
      border-radius: 50px;
      transition:
        color 0.3s ease,
        transform 0.3s;
      margin-bottom: 0;
      position: relative;
      z-index: 1;
      font-size: clamp(0.7rem, 3vw, 0.9rem);

      &:not(.active):hover {
        background: var(--bw200);
      }

      &:active {
        transform: scale(0.93);
      }

      &.active {
        color: white;
      }
    }

    input[type='radio'] {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;

      &:focus-visible + label {
        outline: 2px solid var(--bw900);
        outline-offset: 2px;
      }
    }
  }
</style>
