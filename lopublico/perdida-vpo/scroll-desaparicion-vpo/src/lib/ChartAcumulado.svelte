<script>
  import { max, scaleLinear, curveStepAfter } from 'd3';
  import { Tween } from 'svelte/motion';
  import { innerHeight } from 'svelte/reactivity/window';
  import { cubicOut } from 'svelte/easing';
  import {
    data,
    summarize,
    summarizeByPlan,
    summarizeByPromotor,
    summarizeByTenencia,
  } from '../states/data.svelte';
  import {
    visibility,
    xDomain,
    stackOrder as protectionStackOrder,
    planStackOrder,
    promotorStackOrder,
    tenenciaStackOrder,
    areaSum as protectionAreaSum,
  } from '../states/steps.svelte';

  import { vizLang } from '../states/language.svelte';

  // Chart components
  import YAxis from './chart/YAxis.svelte';
  import XAxis from './chart/XAxis.svelte';
  import StackedAreas from './chart/StackedAreas.svelte';
  import BuiltLine from './chart/BuiltLine.svelte';
  import HoverMarker from './chart/HoverMarker.svelte';
  import ProjectionOverlay from './chart/ProjectionOverlay.svelte';
  import StepIndicator from './StepIndicator.svelte';
  import NumberBoxes from './chart/NumberBoxes.svelte';
  import RadialSelector from './RadialSelector.svelte';
  import TouchIcon from './TouchIcon.svelte';
  import { isMobile } from '../states/utils.svelte.js';

  let {
    step: rawStep,
    scrollThreshold = 0.6,
    selectorHeight = $bindable(0),
    planView: planViewProp = $bindable('protection'),
  } = $props();
  // `rawStep` is undefined both before the first section and after the last one.
  // Track the resolved step: reset to -1 when exiting above step 0, freeze otherwise.
  let step = $state(-1);
  // While an indicator-driven smooth scroll is settling, `programmaticScroll`
  // pins `step` to the clicked value so the IntersectionObserver round-trip
  // can't overwrite the explicit intent mid-animation.
  let programmaticScroll = $state(false);
  let scrollEndTimer;
  $effect(() => {
    if (programmaticScroll) return;
    if (typeof rawStep === 'number') step = rawStep;
    else if (step === 0) step = -1;
  });

  // Indicator click: fix the step authoritatively and pin it until the smooth
  // scroll settles (`releasePin` via <svelte:window>) or the fallback fires.
  function handleSelectStep(i) {
    step = i;
    programmaticScroll = true;
    clearTimeout(scrollEndTimer);
    scrollEndTimer = setTimeout(() => (programmaticScroll = false), 1200);
  }

  function releasePin() {
    clearTimeout(scrollEndTimer);
    programmaticScroll = false;
  }

  // Always show the national aggregate; no per-CCAA filtering.
  let rows = $derived(data.value ?? []);

  let planView = $derived(planViewProp);
  function setPlanView(v) {
    planViewProp = v;
  }
  let isAlternate = $derived(step === visibility.interactive && planView !== 'protection');
  $effect(() => {
    if (step !== visibility.interactive) planViewProp = 'protection';
  });

  let stackOrder = $derived.by(() => {
    if (!isAlternate) return protectionStackOrder;
    if (planView === 'plan') return planStackOrder;
    if (planView === 'promotor') return promotorStackOrder;
    return tenenciaStackOrder;
  });
  let summarizeFn = $derived.by(() => {
    if (!isAlternate) return summarize;
    if (planView === 'plan') return summarizeByPlan;
    if (planView === 'promotor') return summarizeByPromotor;
    return summarizeByTenencia;
  });
  let getAreaKeys = $derived(isAlternate ? (key) => [key] : protectionAreaSum);

  let sumData = $derived(
    data.years.map((year) => ({
      year,
      ...summarizeFn(rows, year),
    }))
  );
  // Append a synthetic closing row at lastYear + 1 mirroring the last real
  // values so curveStepAfter renders the final year's step across its whole
  // slot; `sumData` stays clean for hover detection and NumberBoxes.
  let renderData = $derived(
    sumData.length > 0
      ? [...sumData, { ...sumData.at(-1), year: sumData.at(-1).year + 1 }]
      : sumData
  );
  let maxViviendas = $derived(max(sumData, (d) => d.built) || 1);

  // chart dimensions
  let containerWidth = $state(300);
  let chartHeight = $derived(Math.min(innerHeight.current * 0.4, 400));
  const margin = { top: 0, left: 40, bottom: 20, right: 5 };

  // tweened X upper domain — animates 2025 ↔ 2030
  const tweenOpts = { duration: 600, easing: cubicOut };
  let firstYear = $derived(data.years[0] ?? 2005);
  let xUpper = new Tween(xDomain(0, data.years[0] ?? 2005)[1], tweenOpts);
  $effect(() => {
    if (step < 0) return;
    xUpper.set(xDomain(step, firstYear)[1]);
  });

  // tweened Y domain — animates when the step or planView changes
  const maxViviendasTween = Tween.of(() => maxViviendas, tweenOpts);

  // domain extends one year past the last value so every year owns a full
  // horizontal slot.
  let scaleX = $derived(
    scaleLinear()
      .domain([firstYear, xUpper.current + 1])
      .range([margin.left, containerWidth - margin.right])
  );
  let scaleY = $derived(
    scaleLinear()
      .domain([0, maxViviendasTween.current])
      .range([chartHeight - margin.bottom, 5])
  );

  // hover — reset on step change so circles/tooltip don't linger during transitions
  let hoveredYear = $state(null);
  let hoveredKey = $state(null);
  let hoveredRow = $derived(
    hoveredYear === null ? null : sumData.find((d) => d.year === hoveredYear)
  );
  $effect(() => {
    void step;
    hoveredYear = null;
    hoveredKey = null;
  });

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

  // The selector sits above NumberBoxes and the subtitle below them. Both
  // reserve space on non-interactive steps (opacity 0) so the layout doesn't
  // shift. Their combined height feeds `selectorHeight` so the parent's
  // centering offset compensates correctly.
  let headerHeight = $state(0);
  let subtitleHeight = $state(0);
  $effect(() => {
    selectorHeight = headerHeight + subtitleHeight;
  });
</script>

<svelte:window
  onscrollend={releasePin}
  onwheel={releasePin}
  ontouchmove={releasePin}
  onkeydown={releasePin}
/>

<div class="chart-container" bind:clientWidth={containerWidth}>
  <div
    class="interactive-header"
    class:visible={step === visibility.interactive}
    aria-hidden="true"
    inert={step !== visibility.interactive}
    bind:clientHeight={headerHeight}
  >
    <div class="dimension-filter">
      <div class="filter-group">
        <span class="dimension-label">{vizLang.texts.mainChart.filterLabel}</span>
        <RadialSelector
          name="dimension"
          options={vizLang.texts.mainChart.dimensions}
          selected={planView}
          onchange={setPlanView}
        />
      </div>
    </div>
  </div>

  <div aria-hidden="true" inert>
    <NumberBoxes
      {hoveredYear}
      {sumData}
      {step}
      {stackOrder}
      {getAreaKeys}
      {hoveredKey}
      onHoverKey={(k) => (hoveredKey = k)}
    />
  </div>

  <div
    class="subtitle-wrapper"
    class:visible={step === visibility.interactive}
    aria-hidden="true"
    inert={step !== visibility.interactive}
    bind:clientHeight={subtitleHeight}
  >
    <p class="subtitle">
      <TouchIcon variant="light" />
      {vizLang.texts.mainChart.interactionNote[isMobile.current ? 'mobile' : 'desktop']}
    </p>
  </div>

  <svg
    width={containerWidth}
    height={chartHeight}
    role="presentation"
    aria-hidden="true"
    onmousemove={handleMouseMove}
    onmouseleave={handleMouseLeave}
  >
    {#if step >= visibility.yAxis}
      <YAxis {scaleX} {scaleY} {margin} />
    {/if}

    <defs>
      <clipPath id="chart-area-clip">
        <rect
          x={scaleX.range()[0]}
          y={0}
          width={Math.max(0, scaleX.range()[1] - scaleX.range()[0])}
          height={chartHeight}
        />
      </clipPath>
    </defs>

    <g clip-path="url(#chart-area-clip)">
      <StackedAreas
        sumData={renderData}
        {step}
        {scaleX}
        {scaleY}
        curve={curveStepAfter}
        {stackOrder}
        {getAreaKeys}
        {hoveredKey}
      />
      {#if step >= visibility.builtLine}
        <BuiltLine sumData={renderData} {scaleX} {scaleY} curve={curveStepAfter} {hoveredKey} />
      {/if}
    </g>

    <ProjectionOverlay {scaleX} chartHeight={chartHeight - margin.bottom} />

    <XAxis {scaleX} {scaleY} {chartHeight} {hoveredYear} />

    <HoverMarker {hoveredYear} {hoveredRow} {scaleX} {scaleY} {step} {stackOrder} {getAreaKeys} />
  </svg>

  <StepIndicator {step} {scrollThreshold} onSelectStep={handleSelectStep} />
</div>

<style>
  .chart-container {
    position: relative;
    width: 100%;
    pointer-events: auto;
    overflow-anchor: none;

    svg {
      overflow: visible;
    }
  }

  .interactive-header,
  .subtitle-wrapper {
    opacity: 0;
    transition: opacity 0.3s ease;

    &.visible {
      opacity: 1;
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
    margin-bottom: 1rem;

    .filter-group {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }

    .dimension-label {
      font-weight: 400;
      color: var(--bw700);
    }

    :global {
      .options-container {
        box-sizing: border-box;
        min-height: 2rem;
      }
    }
  }

  .subtitle {
    font-size: 0.82rem;
    line-height: 1.45;
    color: var(--bw600);
    margin: 0 auto 0.85rem;
    text-align: center;
  }
</style>
