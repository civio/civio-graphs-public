<script>
  import { ascending, group, scaleSqrt } from 'd3';
  // Aliased so it doesn't shadow the `data` prop (this region's rows)
  import { data as dataState, severeFiresThreshold } from '../../states/data.svelte';
  import { vizLang } from '../../states/language.svelte';
  import Canvas from '../canvas/Canvas.svelte';
  import CanvasLayer from '../canvas/CanvasLayer.svelte';
  import Tooltip from './Tooltip.svelte';
  import YearDetail from './YearDetail.svelte';
  import InteractionHint from '../ui/InteractionHint.svelte';
  import { circleColor, severeOutlineColor } from '../../utils/colors.svelte';
  import { monthTicks, dayOfYear } from '../../utils/calendar';
  import { isMobile } from '../../states/utils.svelte';

  let { data = [], maxValue = 1 } = $props();

  const marginLeft = 45;
  const marginRight = 10;
  const marginTop = 8;
  const rowHeight = 14;
  const daysInYear = 366;

  // Month axis below the rows: gap from the last row to the labels, plus
  // the labels' line box (0.6875rem at the default 16px root, line-height 1)
  const monthLabelGap = 4;
  const monthLabelHeight = 11;

  let width = $state(0);

  // Selected year row: click opens its detail dialog. The Tooltip is a
  // modal with a dimmed overlay, so while it's open the chart underneath is
  // not interactive — closing it (overlay click, button or Escape) is the
  // only way back.
  let selectedYear = $state(null);

  function closeTooltip() {
    selectedYear = null;
  }

  let yearIndex = $derived(new Map(dataState.years.map((y, i) => [y, i])));

  // Year stepper in the tooltip header: move through the region's years
  // without closing the dialog
  let selectedYearIndex = $derived(yearIndex.get(selectedYear) ?? -1);

  function stepYear(delta) {
    const year = dataState.years[selectedYearIndex + delta];
    if (year !== undefined) selectedYear = year;
  }

  // Grouped once so opening the tooltip doesn't scan the whole region's rows
  let rowsByYear = $derived(group(data, (d) => d.fecha.getUTCFullYear()));

  let selectedYearRows = $derived(rowsByYear.get(selectedYear) ?? []);

  // Years holding the region's worst days, highlighted in the year axis
  // and with a gray row stripe behind the transparent canvas. Stripes are
  // DOM spans, so they can use CSS variables and the draw pass stays
  // untouched.
  let worstYears = $derived(new Set(dataState.worstDays.map((d) => d.fecha.getUTCFullYear())));

  // Regular ticks every 5 years, plus the worst years and the selected year
  // so they always get a label. A regular tick right next to one of those is
  // dropped: at 14px per row two adjacent labels would collide, and the
  // highlighted year wins.
  let yearTicks = $derived.by(() => {
    const highlighted = new Set(worstYears);
    if (selectedYear !== null) highlighted.add(selectedYear);
    return dataState.years.filter(
      (y) =>
        highlighted.has(y) || (y % 5 === 0 && !highlighted.has(y - 1) && !highlighted.has(y + 1))
    );
  });

  let rowsHeight = $derived(dataState.years.length * rowHeight);

  let monthLabelTop = $derived(marginTop + rowsHeight + monthLabelGap);

  // The canvas hugs the painted content — rows plus month axis — with the
  // same breathing room below the labels as above the rows.
  let height = $derived(monthLabelTop + monthLabelHeight + marginTop);

  let cellWidth = $derived((width - marginLeft - marginRight) / daysInYear);

  // Circle fill alpha — lower it below 1 to keep overlapping circles visible
  const circleAlpha = 1;

  // While a year is selected, the rest fade out to keep its row readable
  const dimmedAlpha = isMobile.current ? 0.05 : 0.2;

  // `scaleSqrt` so the circle *area* (not the radius) is proportional to
  // the number of active fires.
  let radius = $derived(
    scaleSqrt()
      .domain([1, maxValue])
      .range([1.5, rowHeight * 0.66])
    // .range([0, (rowHeight / Math.PI) * 2])
  );

  // Rounded to whole pixels so adjacent cells don't leave seams
  function xAt(doy) {
    return Math.round(marginLeft + doy * cellWidth);
  }

  // Outlined like in YearDetail and FireBadge: severe days always get one,
  // and the region's worst day(s) do too even below the threshold.
  let regionWorstDays = $derived(new Set(dataState.worstDays));

  // Cells + paint order depend only on the data, the geometry and the sort
  // order — NOT on the selection — so clicking a year only rebuilds the
  // cheap paint closure below instead of re-mapping and re-sorting the
  // whole region (~10k cells) to change an alpha.
  // Paint order controls stacking: the last cell painted sits on top.
  // Ascending paints the biggest circles last (on top); descending paints
  // them first, keeping the small ones visible above.
  let sortedCells = $derived.by(() => {
    const cells = data.map((d) => {
      const doy = dayOfYear(d.fecha);
      const year = d.fecha.getUTCFullYear();
      const x = xAt(doy);
      return {
        x,
        y: marginTop + yearIndex.get(year) * rowHeight,
        width: xAt(doy + 1) - x,
        year,
        value: d.incendios_activos,
        radius: radius(d.incendios_activos),
        fill: circleColor(d.incendios_activos),
        outlined: d.incendios_activos > severeFiresThreshold || regionWorstDays.has(d),
      };
    });
    return cells.toSorted((a, b) => ascending(a.value, b.value));
  });

  // Single draw pass for every cell: one registered function per heatmap
  // instead of thousands of per-cell components. `$derived.by` so the
  // function identity changes whenever its reactive inputs change, which
  // makes CanvasLayer re-register and repaint.
  let drawHeatmap = $derived.by(() => {
    const currentYear = selectedYear;
    const cells = sortedCells;

    return (ctx) => {
      ctx.lineWidth = 1;
      ctx.strokeStyle = severeOutlineColor;
      for (const cell of cells) {
        const dimmed = currentYear !== null && cell.year !== currentYear;
        ctx.globalAlpha = dimmed ? dimmedAlpha : circleAlpha;
        ctx.fillStyle = cell.fill;
        // Circle centered in the cell, sized by the number of fires
        ctx.beginPath();
        ctx.arc(cell.x + cell.width / 2, cell.y + rowHeight / 2, cell.radius, 0, 2 * Math.PI);
        ctx.fill();
        // Opaque outline so the highlighted days keep a readable edge
        // when they overlap
        if (cell.outlined) {
          ctx.globalAlpha = dimmed ? dimmedAlpha : circleAlpha;
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    };
  });
</script>

<!--
  A11Y: the canvas is hidden from screen readers. Equivalent information
  is provided via ScreenReaderDescription in App.svelte.
-->
<div class="heatmap-wrapper">
  <!-- Pointer-only affordance, like the year rows above: screen readers get
     the equivalent per-year detail via ScreenReaderDescription -->
  <div class="chart-hint" aria-hidden="true">
    <InteractionHint
      touchText="Toca cualquier año para ver su información"
      mouseText="Haz clic en cualquier año para ver su información"
    />
    <div class="heatmap" bind:clientWidth={width} aria-hidden="true">
      {#if width > 0 && dataState.years.length > 0}
        <!-- Worst-year stripes sit behind the month lines and the canvas -->
        <div>
          {#each dataState.years as year (year)}
            {#if worstYears.has(year)}
              <span
                class="row-stripe"
                style:top="{marginTop + yearIndex.get(year) * rowHeight}px"
                style:height="{rowHeight}px"
              ></span>
            {/if}
          {/each}
        </div>

        <!-- Axis labels live in the DOM, not in the canvas -->
        <div>
          <!-- On mobile, show every other month label. Filtering happens inside
           the each: slicing the array first would reset the index, and
           `month` must stay the real month number to format the right name. -->
          {#each monthTicks as doy, month (doy)}
            <span
              class="month-line"
              style:left="{xAt(doy)}px"
              style:top="{marginTop}px"
              style:height="{rowsHeight}px"
            ></span>
            {#if month % 2 === 0}
              <span class="month-label" style:left="{xAt(doy)}px" style:top="{monthLabelTop}px">
                {vizLang.formatMonthShort.format(new Date(Date.UTC(2000, month, 1)))}
              </span>
            {/if}
          {/each}
        </div>

        <div>
          {#each yearTicks as year (year)}
            <!-- While a year is selected, the other labels fade out with the
             same alpha as their circles -->
            <span
              class={['year-label', worstYears.has(year) && 'worst-year']}
              style:opacity={selectedYear !== null && year !== selectedYear ? dimmedAlpha : null}
              style:width="{marginLeft - 8}px"
              style:top="{marginTop + (yearIndex.get(year) + 0.5) * rowHeight}px"
            >
              {year}
            </span>
          {/each}
        </div>

        <Canvas {width} {height}>
          <CanvasLayer draw={drawHeatmap} />
        </Canvas>

        <!-- Click target per year row, full width so it's easy to hit on touch.
         Purely a mouse/touch affordance: the equivalent per-year detail is
         also available via ScreenReaderDescription, so this stays out of
         the a11y tree instead of exposing an unlabeled button. -->
        <div class="year-rows" aria-hidden="true">
          {#each dataState.years as year (year)}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="year-row"
              style:top="{marginTop + yearIndex.get(year) * rowHeight}px"
              style:height="{rowHeight}px"
              onclick={() => (selectedYear = year)}
            ></div>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  {#if selectedYear !== null}
    <Tooltip
      label="{dataState.selectedRegion} · {selectedYear}"
      title={dataState.selectedRegion}
      onclose={closeTooltip}
    >
      {#snippet headerNav()}
        <div class="year-nav">
          <button
            class="year-nav-button"
            onclick={() => stepYear(-1)}
            disabled={selectedYearIndex <= 0}
            aria-label={vizLang.texts.previousYear}
          >
            ‹
          </button>
          <span class="year-nav-year">{selectedYear}</span>
          <button
            class="year-nav-button"
            onclick={() => stepYear(1)}
            disabled={selectedYearIndex >= dataState.years.length - 1}
            aria-label={vizLang.texts.nextYear}
          >
            ›
          </button>
        </div>
      {/snippet}
      <YearDetail rows={selectedYearRows} />
    </Tooltip>
  {/if}
</div>

<style>
  .heatmap {
    position: relative;
    overflow: hidden;
    width: 100%;
    color: var(--bw550);
    background-color: white;
    border-radius: 15px;
  }

  .row-stripe {
    position: absolute;
    left: 0;
    width: 100%;
    background-color: var(--bw50);
  }

  .month-label,
  .month-line,
  .year-label {
    position: absolute;
    font-size: 0.6875rem;
    line-height: 1;
  }

  /* Vertical geometry set inline from the same constants as the canvas */
  .month-label {
    transform: translateX(-50%);
  }
  .month-line {
    transform: translateX(-50%);
    width: 1px;
    border-left: solid 1px var(--bw100);
  }

  .year-label {
    left: 0;
    transform: translateY(-50%);
    text-align: right;

    &.worst-year {
      font-weight: bold;
      color: var(--bw850);
    }
  }

  .year-row {
    position: absolute;
    left: 0;
    width: 100%;
    cursor: pointer;
  }

  .chart-hint {
    margin-top: 6px;
  }

  /* Year stepper rendered in the tooltip header via the headerNav snippet */
  .year-nav {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .year-nav-year {
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .year-nav-button {
    width: 20px;
    height: 20px;
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--bw200);
    border-radius: 50%;
    background-color: white;
    color: var(--bw600);
    font-family: inherit;
    font-size: 0.875rem;
    line-height: 1;
    cursor: pointer;

    &:hover:not(:disabled) {
      border-color: var(--bw400);
      background-color: var(--bw70);
    }

    &:disabled {
      opacity: 0.35;
      cursor: default;
    }
  }
</style>
