<script>
  import { onMount } from 'svelte';
  import { max, scaleLinear, curveStepAfter } from 'd3';
  import { Tween } from 'svelte/motion';
  import { innerHeight } from 'svelte/reactivity/window';
  import { cubicOut } from 'svelte/easing';

  import {
    housesData,
    summarize,
    summarizeByPlan,
    summarizeByPromotor,
    summarizeByTenencia,
  } from '../states/housesData.svelte';
  import { view, urlInfo, chartLayout } from '../states/utils.svelte';
  import {
    stackOrder as protectionStackOrder,
    planStackOrder,
    promotorStackOrder,
    tenenciaStackOrder,
    firstProjectionYear,
  } from '../states/chartConfig';
  import { vizLang } from '../states/language.svelte';
  import { getCcaaChartA11y } from '../a11y';

  import YAxis from './stackedChart/YAxis.svelte';
  import XAxis from './stackedChart/XAxis.svelte';
  import StackedAreas from './stackedChart/StackedAreas.svelte';
  import BuiltLine from './stackedChart/BuiltLine.svelte';
  import HoverMarker from './stackedChart/HoverMarker.svelte';
  import ProjectionOverlay from './stackedChart/ProjectionOverlay.svelte';
  import NumberBoxes from './stackedChart/NumberBoxes.svelte';
  import RadialSelector from './stackedChart/RadialSelector.svelte';
  import ScreenReaderDescription from './ScreenReaderDescription.svelte';
  import TouchIcon from './TouchIcon.svelte';
  import Footer from './footer/Footer.svelte';
  import { isMobile } from '../states/utils.svelte.js';

  let { ccaa, chartID, active = true } = $props();

  // Snapshot the global planView only while this chart is visible. Hidden
  // charts keep their last value so they don't re-derive sumData / re-fire
  // tweens when the user toggles the RadialSelector on a different CCAA.
  let frozenPlanView = $state(view.planView);
  $effect(() => {
    if (active) frozenPlanView = view.planView;
  });

  const stackOrderByView = {
    protection: protectionStackOrder,
    plan: planStackOrder,
    promotor: promotorStackOrder,
    tenencia: tenenciaStackOrder,
  };
  const summarizeByView = {
    protection: summarize,
    plan: summarizeByPlan,
    promotor: summarizeByPromotor,
    tenencia: summarizeByTenencia,
  };

  let rows = $derived(housesData.forCcaa(ccaa));
  let stackOrder = $derived(stackOrderByView[frozenPlanView] ?? protectionStackOrder);
  let summarizeFn = $derived(summarizeByView[frozenPlanView] ?? summarize);
  let a11y = $derived(
    getCcaaChartA11y(vizLang, {
      ccaa: rows[0]?.ccaa ?? ccaa,
      ccaaTitle: vizLang.texts.ccaasWithArticle[ccaa],
      rows,
      years: housesData.years,
      firstProjectionYear,
      planView: frozenPlanView,
    })
  );

  let sumData = $derived(
    housesData.years.map((year) => ({
      year,
      ...summarizeFn(rows, year),
    }))
  );
  // Synthetic closing row so curveStepAfter renders the last year's step
  // across its full horizontal slot.
  let renderData = $derived(
    sumData.length > 0
      ? [...sumData, { ...sumData.at(-1), year: sumData.at(-1).year + 1 }]
      : sumData
  );
  let maxViviendas = $derived(max(sumData, (d) => d.built) || 1);

  let containerWidth = $derived(chartLayout.containerWidth);
  let chartHeight = $derived(Math.min((innerHeight.current ?? 800) * 0.4, 400));
  const margin = { top: 0, left: 35, bottom: 20, right: 0 };

  const tweenOpts = { duration: 600, easing: cubicOut };
  let firstYear = $derived(housesData.years[0] ?? 1991);
  let lastYear = $derived(housesData.years.at(-1) ?? 2030);
  const maxViviendasTween = Tween.of(() => maxViviendas, tweenOpts);

  // Domain ends one year past the last data year so curveStepAfter renders
  // the final year's step across its full slot (matches renderData's
  // synthetic closing row).
  let scaleX = $derived(
    scaleLinear()
      .domain([firstYear, lastYear + 1])
      .range([margin.left, containerWidth - margin.right])
  );
  let scaleY = $derived(
    scaleLinear()
      .domain([0, maxViviendasTween.current])
      .range([chartHeight - margin.bottom, 5])
  );

  let hoveredYear = $state(null);
  let hoveredKey = $state(null);
  let hoveredRow = $derived(
    hoveredYear === null ? null : sumData.find((d) => d.year === hoveredYear)
  );

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < margin.left || x > containerWidth - margin.right) {
      hoveredYear = null;
      return;
    }
    const year = Math.floor(scaleX.invert(x));
    hoveredYear = sumData.some((d) => d.year === year) ? year : null;
  }

  function handleMouseLeave() {
    hoveredYear = null;
  }
</script>

{#if housesData.loading && housesData.value === undefined}
  <p class="chart-status">{vizLang.texts.ccaaChart.loading}</p>
{:else if housesData.error}
  <p class="chart-status">{vizLang.texts.ccaaChart.error(housesData.error)}</p>
{:else if rows.length === 0}
  <p class="chart-status">{vizLang.texts.ccaaChart.noData(vizLang.texts.ccaas[ccaa])}</p>
{:else}
  <div class="chart-container">
    <h4 class="title">{vizLang.texts.ccaaChart.title(vizLang.texts.ccaasWithArticle[ccaa])}</h4>

    <div class="dimension-filter visible">
      <div class="filter-group">
        <span class="dimension-label" aria-hidden="true">{vizLang.texts.ccaaChart.filterLabel}</span
        >
        <RadialSelector
          name="dimension-{ccaa}"
          legend={vizLang.texts.ccaaChart.filterAriaLegend}
          options={vizLang.texts.ccaaChart.dimensions}
          selected={view.planView}
          onchange={(v) => (view.planView = v)}
        />
      </div>
    </div>

    <div aria-hidden="true">
      <NumberBoxes
        {hoveredYear}
        {sumData}
        {stackOrder}
        {hoveredKey}
        onHoverKey={(k) => (hoveredKey = k)}
      />
    </div>

    <p class="subtitle">
      <TouchIcon variant="light" />
      {vizLang.texts.ccaaChart.hoverHint(isMobile.current)}
    </p>

    {#if a11y}
      <ScreenReaderDescription {...a11y} visible={urlInfo.alt} />
    {/if}

    <svg
      width={containerWidth}
      height={chartHeight}
      role="presentation"
      aria-hidden="true"
      onmousemove={handleMouseMove}
      onmouseleave={handleMouseLeave}
    >
      <YAxis {scaleX} {scaleY} {margin} visible={true} />

      <defs>
        <clipPath id="chart-area-clip-{ccaa}">
          <rect
            x={scaleX.range()[0]}
            y={0}
            width={Math.max(0, scaleX.range()[1] - scaleX.range()[0])}
            height={chartHeight}
          />
        </clipPath>
      </defs>

      <g clip-path="url(#chart-area-clip-{ccaa})">
        <StackedAreas
          sumData={renderData}
          {scaleX}
          {scaleY}
          curve={curveStepAfter}
          {stackOrder}
          uid={ccaa}
          {hoveredKey}
        />
        <BuiltLine sumData={renderData} {scaleX} {scaleY} curve={curveStepAfter} {hoveredKey} />
      </g>

      <ProjectionOverlay {scaleX} chartHeight={chartHeight - margin.bottom} />

      <XAxis {scaleX} {scaleY} {chartHeight} {hoveredYear} />

      <HoverMarker {hoveredYear} {hoveredRow} {scaleX} {scaleY} {stackOrder} />
    </svg>

    <Footer
      embedID="{chartID}-{ccaa}-area"
      source={vizLang.texts.sources.ccaaChart}
      note={vizLang.texts.ccaaChart.notes?.[ccaa] ?? ''}
    />
  </div>
{/if}

<style>
  * :global {
    font-family: Lato;
  }

  .chart-status {
    margin: 0;
    padding: 1rem;
    text-align: center;
    color: var(--bw600);
  }

  .title {
    font-size: clamp(1rem, 2.2vw, 1.25rem);
    font-weight: 700;
    margin: 0 auto 0.5rem;
    color: var(--bw900);
    letter-spacing: -0.01em;
    text-align: center;
    max-width: 700px;
    &:before {
      display: none;
    }
  }

  .dimension-filter {
    display: flex;
    flex-wrap: wrap;
    row-gap: 0.5rem;
    column-gap: 1.5rem;
    align-items: flex-end;
    justify-content: center;
    padding: 0.5rem 0;
    font-size: 0.85rem;
    opacity: 0;
    margin-bottom: 0.66rem;
    transition: opacity 0.3s ease;

    &.visible {
      opacity: 1;
    }

    .filter-group {
      display: flex;
      /* flex-direction: column; */
      flex-direction: row;
      align-items: center;
      justify-content: center;
      /* gap: 0.25rem; */
      gap: 1rem;
      flex-wrap: wrap;
    }

    .dimension-label {
      font-weight: 400;
      color: var(--bw700);
    }
  }
</style>
