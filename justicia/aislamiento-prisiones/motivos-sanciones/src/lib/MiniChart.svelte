<script>
  import { scaleLinear } from 'd3';
  import { vizLang } from '../states/language.svelte';

  let { dataPoints = [], globalMaxPct = 1, fillColor = '#999', highlightYear = null } = $props();

  const chartWidth = 260;
  const chartHeight = 100;
  const margin = { top: 35, right: 30, bottom: 20, left: 40 };

  let xScale = $derived(
    scaleLinear()
      .domain([dataPoints[0]?.year ?? 0, dataPoints[dataPoints.length - 1]?.year ?? 1])
      .range([margin.left, chartWidth - margin.right])
  );

  let yScale = $derived(
    scaleLinear()
      .domain([0, globalMaxPct])
      .range([chartHeight - margin.bottom, margin.top])
  );

  let linePath = $derived(
    dataPoints.length > 1
      ? 'M' + dataPoints.map((d) => `${xScale(d.year)},${yScale(d.pct)}`).join('L')
      : ''
  );

  const midTicks = [25, 50];

  function formatPct(pct) {
    if (pct === 0) return '0%';
    return pct < 1 ? '<1%' : `${Math.round(pct)}%`;
  }
</script>

{#if dataPoints.length > 1}
  <svg width={chartWidth} height={chartHeight} class="mini-chart">
    <!-- Y axis lines -->
    <line
      x1={margin.left}
      x2={chartWidth - margin.right}
      y1={yScale(0)}
      y2={yScale(0)}
      stroke="var(--bw200)"
      stroke-width="1"
    />
    {#each midTicks as t}
      <line
        x1={margin.left}
        x2={chartWidth - margin.right}
        y1={yScale(t)}
        y2={yScale(t)}
        stroke="var(--bw100)"
        stroke-width="1"
      />
      <text
        x={margin.left - 4}
        y={yScale(t)}
        dx="-15"
        text-anchor="end"
        dominant-baseline="central"
        class="axis-label"
      >
        {t}%
      </text>
    {/each}
    <text
      x={margin.left - 4}
      y={yScale(0)}
      dx="-15"
      text-anchor="end"
      dominant-baseline="central"
      class="axis-label"
    >
      0%
    </text>

    <!-- Line -->
    <path d={linePath} fill="none" stroke="var(--bw300)" stroke-width="1.5" />

    <!-- Points + labels -->
    {#each dataPoints as d (d.year)}
      <g transform="translate({xScale(d.year)}, 0)">
        <circle cx="0" cy={yScale(d.pct)} r="3.5" fill={fillColor} />
        <!-- % value above point -->
        <text x="0" y={yScale(d.pct) - 8} text-anchor="middle" class="value-label" fill={fillColor}>
          {formatPct(d.pct)}
        </text>
        <!-- Absolute value below point -->
        <text x="0" y={yScale(d.pct) - 20} text-anchor="middle" class="abs-label">
          {vizLang.formatIntegers(d.value)}
        </text>

        <!-- Year label at bottom -->
        <text
          x="0"
          y={chartHeight}
          text-anchor="middle"
          class="year-label"
          fill={highlightYear && String(d.year) === String(highlightYear) ? 'var(--bw900)' : 'var(--bw500)'}
          font-weight={highlightYear && String(d.year) === String(highlightYear)
            ? '900'
            : 'normal'}
        >
          {d.year}{d.year === '2025' ? '*' : ''}
        </text>
      </g>
    {/each}
  </svg>
{:else if dataPoints.length === 1}
  <p class="single-value">
    {dataPoints[0].year}{dataPoints[0].year === '2025' ? '*' : ''}:
    <strong>{formatPct(dataPoints[0].pct)}</strong>
    ({vizLang.formatIntegers(dataPoints[0].value)})
  </p>
{/if}

<p class="tooltip-note">{vizLang.texts.notes[0]}</p>

<style>
  .mini-chart {
    display: block;
    margin: 0 auto;
  }

  .axis-label {
    font-size: 0.625rem;
    fill: var(--bw400);
  }

  .value-label {
    font-size: 0.6875rem;
    font-weight: bold;
  }

  .abs-label {
    font-size: 0.625rem;
    fill: var(--bw400);
  }

  .year-label {
    font-size: 0.6875rem;
  }

  .single-value {
    text-align: center;
    font-size: 0.85rem;
    margin: 0.5rem 0;
  }

  .tooltip-note {
    font-size: 0.75rem;
    color: var(--bw500);
    margin-top: 1rem;
    margin-bottom: 0;
    line-height: 1.2;
  }
</style>
