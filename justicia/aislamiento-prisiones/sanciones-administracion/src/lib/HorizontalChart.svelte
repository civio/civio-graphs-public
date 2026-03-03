<script>
  import { scaleLinear, sum } from 'd3';
  import { vizLang } from '../states/language.svelte';
  import SvgPatternDefs from './SvgPatternDefs.svelte';

  let { grouped, type, displayedValue, maxValue, getCategoryColor, onYearClick, blurBackground } =
    $props();

  const labelWidth = 40;
  const barHeight = 17;
  const admGap = 1;
  const yearGap = 15;
  const axisHeight = 30;
  const numberWidth = 40;

  let chartWidth = $state(300);

  let barScale = $derived(
    scaleLinear()
      .domain([0, maxValue ?? 0])
      .range([0, chartWidth - labelWidth - numberWidth])
  );

  let svgHeight = $derived.by(() => {
    if (!grouped) return 0;
    let height = 0;
    for (let i = 0; i < grouped.length; i++) {
      const year = grouped[i];
      const admCount = year.data.length;
      const yearBlockHeight = admCount * barHeight + (admCount - 1) * admGap;
      height += yearBlockHeight;
      if (i < grouped.length - 1) {
        height += yearGap;
      }
    }
    return height + axisHeight;
  });

  function getYearY(yearIndex) {
    if (!grouped) return 0;
    let y = 0;
    for (let i = 0; i < yearIndex; i++) {
      const admCount = grouped[i].data.length;
      y += admCount * barHeight + (admCount - 1) * admGap + yearGap;
    }
    return y;
  }

  function getAdmY(yearIndex, admIndex) {
    return getYearY(yearIndex) + admIndex * (barHeight + admGap);
  }

  function getCategoryX(adm, categoryIndex) {
    let x = labelWidth;
    for (let i = 0; i < categoryIndex; i++) {
      x += barScale(+adm.categories[i][displayedValue]);
    }
    return x;
  }
</script>

<div class={['chart-container', blurBackground && 'blur-background']} bind:clientWidth={chartWidth}>
  {#if grouped}
    <svg width={chartWidth} height={svgHeight}>
      <SvgPatternDefs {grouped} {type} orientation="h" />

      <!-- axis ticks -->
      <g transform="translate({labelWidth}, {svgHeight})">
        {#each barScale.ticks(4) as tick, i (tick)}
          <line
            x1={barScale(tick)}
            y1={-svgHeight}
            x2={barScale(tick)}
            y2={-axisHeight / 2}
            stroke="#ccc"
            stroke-width={tick === 0 ? 2 : 1}
            stroke-dasharray={tick === 0 ? 0 : 16}
          />
          <text x={barScale(tick)} y={0} text-anchor="middle" fill="var(--bw500)">
            {vizLang.formatIntegers(tick)}
            {displayedValue === 'relX1000' && i === barScale.ticks(4).length - 1 ? '‰' : ''}
          </text>
        {/each}
      </g>

      <!-- rects -->
      {#each grouped as year, yearIndex (year.year)}
        {@const yearY = getYearY(yearIndex)}
        {@const yearAdmCount = year.data.length}
        {@const yearBlockHeight = yearAdmCount * barHeight + (yearAdmCount - 1) * admGap}

        <g
          tabindex="0"
          role="button"
          aria-label={vizLang.texts.barAriaLabel[type].replace('{year}', year.year)}
          onclick={() => onYearClick(year.data, yearIndex)}
          onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onYearClick(year.data, yearIndex))}
        >
          <text
            x={0}
            y={yearY + yearBlockHeight / 2}
            dominant-baseline="central"
            class="year-label"
          >
            {year.year}{year.year === 2025 ? '*' : ''}
          </text>
          {#each year.data as adm, admIndex (adm.adm)}
            {@const admY = getAdmY(yearIndex, admIndex)}
            {@const admTotal = sum(adm.categories.map((category) => category[displayedValue]))}
            <text
              y={admY + barHeight / 2 - 1}
              x="0"
              alignment-baseline="central"
              fill="white"
              stroke="white"
              style="transform:translateX({barScale(admTotal) + labelWidth + 5}px)"
            >
              {vizLang.formatIntegers(admTotal)}
            </text>
            <text
              y={admY + barHeight / 2 - 1}
              x="0"
              alignment-baseline="central"
              fill="var(--bw600)"
              style="transform:translateX({barScale(admTotal) + labelWidth + 5}px)"
            >
              {vizLang.formatIntegers(admTotal)}
            </text>
            <g>
              {#each adm.categories as category, catIndex (catIndex)}
                {@const color = getCategoryColor(adm, catIndex)}
                <rect
                  x={getCategoryX(adm, catIndex)}
                  y={admY}
                  width={barScale(+category[displayedValue])}
                  height={barHeight}
                  class={['bar', catIndex === adm.categories.length - 1 && 'rounded']}
                  fill={color}
                />
              {/each}
            </g>
          {/each}
        </g>
      {/each}

      <g transform="translate({labelWidth}, {svgHeight})">
        <line
          x1={barScale(0)}
          y1={-svgHeight}
          x2={barScale(0)}
          y2={-axisHeight / 2}
          stroke="var(--bw700)"
          stroke-width="2"
        />
        <text x={barScale(0)} y={0} text-anchor="middle" fill="var(--bw500)"> 0 </text>
      </g>
    </svg>
  {/if}
</div>

<style>
  .chart-container {
    width: 100%;
    filter: none;
    transition: filter 0.3s;

    &.blur-background {
      filter: blur(4px) opacity(0.4);
    }
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

    g:focus {
      outline: none;
    }

    g:focus-visible {
      outline: 2px solid var(--bw900);
      outline-offset: 2px;
    }
  }
</style>
