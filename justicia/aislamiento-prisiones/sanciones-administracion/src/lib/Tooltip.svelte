<script>
  import { fade } from 'svelte/transition';
  import { sum, max } from 'd3';

  import { clickOutside } from '../utils/clickOutside.svelte';
  import { isMobile } from '../states/utils.svelte';
  import { vizLang } from '../states/language.svelte';

  let {
    type,
    tooltipData = $bindable(),
    yearIndex = 0,
    yearCount = 1,
    getCategoryBackground,
  } = $props();

  let catDict = $derived(vizLang.texts.a11y.catDict);
  let admDict = $derived(vizLang.texts.a11y.admDict);

  let isFirstHalf = $derived(yearIndex < yearCount / 2);
  // Approximate X center of year group as percentage of chart width
  let yearCenterPct = $derived(
    isFirstHalf ? ((yearIndex + 1.3) / yearCount) * 100 : (yearIndex / yearCount) * 100
  );

  let year = $derived(tooltipData && tooltipData[0]?.categories?.[0].year);

  let maxValue = $derived(
    max(
      tooltipData.flatMap((d) => d.categories),
      (d) => +d.relX1000
    )
  );

  const totalCatDict = $derived({ '': 'Total', ...catDict });

  let tooltipHeight = $state(300);
  let yPosition = $derived(!isMobile.current && tooltipHeight > 345 ? 'bottom: -10px' : 'top:10px');
</script>

<div
  transition:fade={{ duration: 100 }}
  class="chart-tooltip"
  class:mobile={isMobile.current}
  class:desktop={!isMobile.current}
>
  <div
    transition:fade|global={{ duration: 100 }}
    bind:clientHeight={tooltipHeight}
    class="tooltip-info"
    style={!isMobile.current
      ? isFirstHalf
        ? `position:absolute;${yPosition};left:${yearCenterPct}%`
        : `position:absolute;${yPosition};left:${yearCenterPct}%;transform:translateX(-100%)`
      : ''}
    {@attach clickOutside({
      onClickOutside: () => (tooltipData = undefined),
    })}
  >
    <button onclick={() => (tooltipData = undefined)} aria-label={vizLang.texts.closeTooltip}
      >x</button
    >
    <p
      style="text-align: center;margin-top:5px;margin-bottom:0.75rem;font-size:1.15rem;font-weight: bold;"
    >
      {vizLang.texts.tooltipTitle[type].replace('{year}', year)}
    </p>

    <div>
      {#each tooltipData as group, i (group.adm)}
        {@const catTotal = sum(group.categories.map((d) => d.total))}
        {@const catRatio = sum(group.categories.map((d) => d.relX1000))}

        <div class="adm-group">
          <p style="font-weight: bold;margin-bottom: 0.25rem;">
            {admDict[group.adm]}: {vizLang.formatIntegers(catRatio)}{i === 0
              ? ` ${vizLang.texts.tooltipRatioSuffix[type]}`
              : '‰'} ({vizLang.formatIntegers(catTotal)}{i === 0
              ? ` ${vizLang.texts.tooltipTotalSuffix[type]}`
              : ''})
          </p>
          <div style="position: relative;width: 100%;">
            {#each group.categories as category, ii}
              {@const bg = getCategoryBackground(group, ii)}
              {#if group.categories.length > 1}
                <p class="category-info">
                  {totalCatDict[category.categoria] ?? category.tipo_sancion}: {vizLang.formatIntegers(
                    category.relX1000
                  )}‰ ({vizLang.formatIntegers(category.total)})
                </p>
              {/if}
              <div style="display:flex">
                <div
                  style="width: {(category.relX1000 / maxValue) * 100}%;height:10px;background:{bg}"
                ></div>
              </div>
            {/each}
          </div>
          {#if i !== tooltipData.length - 1}
            <hr />
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  button {
    cursor: pointer;
    transition: transform 0.3s;

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
  }

  .chart-tooltip.mobile {
    display: flex;
    align-items: center;
    justify-content: center;

    .tooltip-info {
      max-height: 95%;
      overflow-y: scroll;
    }
  }

  .chart-tooltip.desktop {
    pointer-events: none;

    .tooltip-info {
      pointer-events: auto;
      min-width: 250px;
      z-index: 4;
    }
  }

  .tooltip-info {
    background-color: white;
    max-width: 350px;
    width: 90%;
    border: solid black 2px;
    border-radius: 10px;
    padding: 10px;
    position: relative;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);

    transition: all 0.3s;
  }

  button {
    position: absolute;
    right: 10px;
    top: 5px;
  }

  .category-info {
    font-size: 0.8rem;
  }

  .adm-group {
    hr {
      width: 50%;
      margin: 1rem auto;
    }
  }
</style>
