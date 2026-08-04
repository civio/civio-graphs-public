<script>
  import { max, scaleLinear, curveStepAfter } from 'd3';
  import { innerHeight } from 'svelte/reactivity/window';
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

  // Chart components — same as ChartAcumulado, minus the interactive bits.
  import YAxis from './chart/YAxis.svelte';
  import XAxis from './chart/XAxis.svelte';
  import StackedAreas from './chart/StackedAreas.svelte';
  import BuiltLine from './chart/BuiltLine.svelte';
  import ProjectionOverlay from './chart/ProjectionOverlay.svelte';
  import NumberBoxes from './chart/NumberBoxes.svelte';

  // Static snapshot of ChartAcumulado for dossier/print mode. `step` is fixed
  // for the lifetime of the instance, so no Tween, no scroll plumbing and no
  // interactive controls. PrintView mounts one of these per narrative step.
  // `boxesHeight` is bindable so the parent can offset the side text by half
  // its value and keep the prose centered on the SVG instead of the whole box.
  let { step, planView = 'protection', compact = false, boxesHeight = $bindable(0) } = $props();

  const rows = $derived(data.value ?? []);
  const isAlternate = $derived(step === visibility.interactive && planView !== 'protection');

  const stackOrder = $derived.by(() => {
    if (!isAlternate) return protectionStackOrder;
    if (planView === 'plan') return planStackOrder;
    if (planView === 'promotor') return promotorStackOrder;
    return tenenciaStackOrder;
  });
  const summarizeFn = $derived.by(() => {
    if (!isAlternate) return summarize;
    if (planView === 'plan') return summarizeByPlan;
    if (planView === 'promotor') return summarizeByPromotor;
    return summarizeByTenencia;
  });
  const getAreaKeys = $derived(isAlternate ? (key) => [key] : protectionAreaSum);

  const sumData = $derived(
    data.years.map((year) => ({
      year,
      ...summarizeFn(rows, year),
    }))
  );
  // Mirror the closing-row trick from ChartAcumulado so curveStepAfter renders
  // the final year's step across its whole slot.
  const renderData = $derived(
    sumData.length > 0
      ? [...sumData, { ...sumData.at(-1), year: sumData.at(-1).year + 1 }]
      : sumData
  );
  const maxViviendas = $derived(max(sumData, (d) => d.built) || 1);

  let containerWidth = $state(300);
  const chartHeight = $derived(compact ? Math.min(containerWidth * 0.55, 220) : Math.min(innerHeight.current * 0.4, 400));
  const margin = { top: 0, left: 40, bottom: 20, right: 5 };

  const firstYear = $derived(data.years[0] ?? 2005);
  const xUpper = $derived(xDomain(step, firstYear)[1]);

  const scaleX = $derived(
    scaleLinear()
      .domain([firstYear, xUpper + 1])
      .range([margin.left, containerWidth - margin.right])
  );
  const scaleY = $derived(
    scaleLinear()
      .domain([0, maxViviendas])
      .range([chartHeight - margin.bottom, 5])
  );
</script>

<div class="chart-container" class:compact bind:clientWidth={containerWidth}>
  <div class="number-boxes-static" aria-hidden="true" inert bind:clientHeight={boxesHeight}>
    <NumberBoxes
      hoveredYear={null}
      {sumData}
      {step}
      {stackOrder}
      {getAreaKeys}
      hoveredKey={null}
      onHoverKey={() => {}}
    />
  </div>

  <svg width={containerWidth} height={chartHeight} role="presentation" aria-hidden="true">
    {#if step >= visibility.yAxis}
      <YAxis {scaleX} {scaleY} {margin} />
    {/if}

    <defs>
      <clipPath id="chart-area-clip-static-{step}">
        <rect
          x={scaleX.range()[0]}
          y={0}
          width={Math.max(0, scaleX.range()[1] - scaleX.range()[0])}
          height={chartHeight}
        />
      </clipPath>
    </defs>

    <g clip-path="url(#chart-area-clip-static-{step})">
      <StackedAreas
        sumData={renderData}
        {step}
        {scaleX}
        {scaleY}
        curve={curveStepAfter}
        {stackOrder}
        {getAreaKeys}
        hoveredKey={null}
      />
      {#if step >= visibility.builtLine}
        <BuiltLine
          sumData={renderData}
          {scaleX}
          {scaleY}
          curve={curveStepAfter}
          hoveredKey={null}
        />
      {/if}
    </g>

    <ProjectionOverlay {scaleX} chartHeight={chartHeight - margin.bottom} />

    <XAxis {scaleX} {scaleY} {chartHeight} hoveredYear={null} />
  </svg>
</div>

<style>
  .chart-container {
    position: relative;
    width: 100%;
    overflow-anchor: none;

    svg {
      overflow: visible;
    }
  }

  /* Compact: year info left, legend boxes right, both vertically centered */
  .chart-container.compact .number-boxes-static {
    margin-bottom: 0.3rem;
  }

  .chart-container.compact :global(.number-boxes) {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    column-gap: 0.6rem;
    margin-bottom: 0;
  }

  .chart-container.compact :global(.boxes-stack) {
    overflow: visible;
  }

  .chart-container.compact :global(.boxes) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;
  }

  .chart-container.compact :global(.box) {
    padding: 0.2rem 0.4rem;
    gap: 0.35rem;
    border-width: 1.5px;
    border-radius: 4px;
  }

  .chart-container.compact :global(.box .swatch) {
    width: 8px;
    height: 8px;
  }

  .chart-container.compact :global(.box .content) {
    flex-direction: row;
    align-items: baseline;
    gap: 0.3rem;
  }

  .chart-container.compact :global(.box .value) {
    font-size: 0.75rem;
  }

  .chart-container.compact :global(.box .label) {
    font-size: 0.6rem;
  }

  .chart-container.compact :global(.year) {
    align-self: center;
    padding-right: 0.6rem;
    border-right: 1px solid var(--bw500);
  }

  .chart-container.compact :global(.year-content) {
    flex-direction: column;
    align-items: flex-end;
    text-align: right;
    gap: 0.15rem;
    font-size: 0.65rem;
    line-height: 1.4;
  }

  .chart-container.compact :global(.year-content .built-value) {
    font-size: 0.8rem;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }

  .chart-container.compact :global(.year-icon) {
    width: 12px;
    height: 12px;
  }
</style>
