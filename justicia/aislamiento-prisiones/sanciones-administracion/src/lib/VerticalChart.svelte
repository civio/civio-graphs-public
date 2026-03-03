<script>
  import { scaleLinear, sum } from 'd3';
  import { vizLang } from '../states/language.svelte';
  import SvgPatternDefs from './SvgPatternDefs.svelte';

  let {
    grouped,
    type,
    displayedValue,
    maxValue,
    getCategoryColor,
    onYearClick,
    selectedYearIndex,
  } = $props();

  const svgHeight = 350;
  const axisBottom = 30;
  const axisLeft = 50;
  const axisTop = 20;
  const admGap = 2;
  const yearGap = 12;

  let chartWidth = $state(300);

  let chartArea = $derived(svgHeight - axisBottom - axisTop);

  let barScale = $derived(
    scaleLinear()
      .domain([0, maxValue ?? 0])
      .range([0, chartArea])
  );

  let yearCount = $derived(grouped?.length ?? 0);
  let admCount = $derived(grouped?.[1]?.data.length ?? 0);

  let availableWidth = $derived(chartWidth - axisLeft);
  let yearWidth = $derived(yearCount > 0 ? availableWidth / yearCount : 0);
  let barWidth = $derived(admCount > 0 ? (yearWidth - yearGap - admCount * admGap) / admCount : 0);

  let yearPad = $derived(yearGap / 2);

  function getBarX(yearIndex, admIndex) {
    return axisLeft + yearIndex * yearWidth + yearPad + admIndex * (barWidth + admGap);
  }

  function getSegmentY(cumulativeHeight, segmentHeight) {
    return svgHeight - axisBottom - cumulativeHeight - segmentHeight;
  }
</script>

<div class="chart-container" bind:clientWidth={chartWidth}>
  {#if grouped}
    <svg width={chartWidth} height={svgHeight}>
      <SvgPatternDefs {grouped} {type} orientation="v" />

      <!-- value axis ticks (left) -->
      <g>
        {#each barScale.ticks(4) as tick, i (tick)}
          {@const y = svgHeight - axisBottom - barScale(tick)}
          <line
            x1={axisLeft}
            y1={y}
            x2={chartWidth}
            y2={y}
            stroke="#ccc"
            stroke-width={tick === 0 ? 2 : 1}
            stroke-dasharray={tick === 0 ? 0 : 16}
          />
          <text
            x={axisLeft - 5}
            {y}
            text-anchor="end"
            dominant-baseline="central"
            fill="var(--bw500)"
          >
            {vizLang.formatIntegers(tick)}{displayedValue === 'relX1000' &&
            i === barScale.ticks(4).length - 1
              ? '‰'
              : ''}
          </text>
        {/each}
      </g>

      <!-- bars -->
      {#each grouped as year, yearIndex (year.year)}
        <g
          tabindex="0"
          role="button"
          aria-label={vizLang.texts.barAriaLabel[type].replace('{year}', year.year)}
          onclick={() => onYearClick(year.data, yearIndex)}
          onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onYearClick(year.data, yearIndex))}
          style="cursor:pointer;opacity:{selectedYearIndex !== undefined &&
          selectedYearIndex !== yearIndex
            ? 0.25
            : 1}"
        >
          <!-- year label -->
          <text
            x={axisLeft + yearIndex * yearWidth + yearWidth / 2}
            y={svgHeight - axisBottom + 18}
            text-anchor="middle"
            class="year-label"
          >
            {year.year}{year.year === 2025 ? '*' : ''}
          </text>

          {#each year.data as adm, admIndex (adm.adm)}
            {@const barX = getBarX(yearIndex, admIndex)}
            {@const admTotal = sum(adm.categories.map((c) => c[displayedValue]))}
            {@const totalHeight = barScale(admTotal)}

            <!-- value label above bar -->
            <text
              x={barX + barWidth / 2}
              y={0}
              text-anchor="middle"
              fill="var(--bw600)"
              class="bar-text"
              style="transform:translateY({svgHeight - axisBottom - totalHeight - 4}px)"
            >
              {vizLang.formatIntegers(admTotal)}
            </text>

            <!-- stacked segments -->
            {#each adm.categories as category, catIndex (catIndex)}
              {@const segmentHeight = barScale(+category[displayedValue])}
              {@const cumulative = sum(
                adm.categories.slice(0, catIndex).map((c) => barScale(+c[displayedValue]))
              )}

              {@const color = getCategoryColor(adm, catIndex)}
              <rect
                x={barX}
                y={getSegmentY(cumulative, segmentHeight)}
                width={barWidth}
                height={segmentHeight}
                class={['bar', catIndex === adm.categories.length - 1 && 'rounded']}
                fill={color}
              />
            {/each}
          {/each}
        </g>
      {/each}

      <!-- baseline -->
      <line
        x1={axisLeft}
        y1={svgHeight - axisBottom}
        x2={chartWidth}
        y2={svgHeight - axisBottom}
        stroke="var(--bw700)"
        stroke-width="2"
      />
    </svg>
  {/if}
</div>

<style>
  .chart-container {
    width: 100%;
  }

  .year-label {
    font-size: 13px;
    fill: var(--bw600);
  }

  .bar {
    stroke: white;
    stroke-width: 1;
    transition: all 0.3s;
  }

  svg {
    text {
      font-size: 12px;
      transition: all 0.3s;
    }

    g {
      transition: all 0.3s;

      &:focus {
        outline: none;
      }

      &:focus-visible {
        outline: 2px solid var(--bw900);
        outline-offset: 2px;
      }
    }
  }
</style>
