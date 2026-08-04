<script>
  import { ascending, descending, max, range, scaleSqrt } from 'd3';
  import Canvas from '../canvas/Canvas.svelte';
  import CanvasLayer from '../canvas/CanvasLayer.svelte';
  import { circleColor, focusRingColor, severeOutlineColor } from '../../utils/colors.svelte';
  import { severeFiresThreshold, worstDays } from '../../states/data.svelte';
  import { vizLang } from '../../states/language.svelte';
  import { isMobile } from '../../states/utils.svelte';
  import InteractionHint from '../ui/InteractionHint.svelte';

  /**
   * Month-grid mini heatmap for one year, shown inside the tooltip when a
   * year row is selected. One row per month, one column per day of the
   * month, so each circle gets far more room than in the main chart's
   * single-row layout. The radius scale is local to this year's own max
   * value (not the chart-wide maxValue), so a quiet year isn't flattened to
   * invisible dots next to the chart's worst year. Color stays on the
   * chart-wide `circleColor` scale so hue stays comparable across years.
   *
   * The reading lives in a strip above the grid: it shows the hovered day,
   * else the clicked day, else the year's worst day, with a focus ring on
   * that day in the grid. A footer lists the year's top days as chips.
   */
  let { rows = [] } = $props();

  const monthsInYear = 12;
  // Widest month; shorter months just leave trailing space
  const daysInMonth = 31;
  const rowHeight = 24;
  const marginTop = 4;
  const marginBottom = 0;
  // Left gutter for the month labels; right margin so day-31 circles
  // aren't clipped by the canvas bounds
  const marginLeft = 32;
  const marginRight = 12;
  const circleAlpha = 1;

  let width = $state(0);
  const height = marginTop + monthsInYear * rowHeight + marginBottom;

  let gridWidth = $derived(width - marginLeft - marginRight);
  let cellWidth = $derived(gridWidth / daysInMonth);

  let maxValue = $derived(max(rows, (d) => d.incendios_activos) ?? 0);

  let radius = $derived(
    scaleSqrt()
      .domain([1, maxValue])
      // Capped by both the row and the column so circles outgrow neither
      .range([2, Math.min(rowHeight * 0.45, cellWidth)])
  );

  // dayIndex: 0-based day of the month
  function xAt(dayIndex) {
    return Math.round(marginLeft + (dayIndex + 0.5) * cellWidth);
  }

  // Vertical center of a month's row
  function yAt(month) {
    return marginTop + month * rowHeight + rowHeight / 2;
  }

  // Same definition of "severe day" as countSevereDays and the outlines
  let severeDays = $derived(rows.filter((d) => d.incendios_activos > severeFiresThreshold));

  // Quiet years, with no day above the threshold: the year's own worst days
  // (ties included) keep the outlines, so the grid always highlights
  // something.
  let yearWorstDays = $derived(worstDays(rows));

  // Day picked by clicking/tapping its cell in the grid or a footer chip.
  // `$state.raw`: rows from the dataset, only ever reassigned.
  let selectedDay = $state.raw(null);
  // Day under the pointer (mouse only), a temporary reading on top of the
  // selection
  let hoveredDay = $state.raw(null);

  // Ignore selection/hover left over from another year (the tooltip keeps
  // this component mounted while `rows` changes), without an effect to
  // reset them
  let shownDay = $derived(rows.includes(selectedDay) ? selectedDay : null);
  let pointedDay = $derived(rows.includes(hoveredDay) ? hoveredDay : null);

  // Day the user is pointing at or has clicked, if any
  let activeDay = $derived(pointedDay ?? shownDay);

  // Day the reading strip and the focus ring describe: hover wins over the
  // clicked day; with neither, default to the year's worst day so the strip
  // is never empty
  let focusedDay = $derived(activeDay ?? yearWorstDays[0] ?? null);

  // With no hover/selection, a tie at the year's max reads as a count
  // ("N días con X incendios") instead of a single date — same logic as the
  // intro's WorstDaysSummary
  let showWorstTie = $derived(activeDay === null && yearWorstDays.length > 1);

  // While a day is hovered or selected, the rest of the grid dims so the
  // reading focuses on it
  let hasFocus = $derived(activeDay !== null);

  // The year's top days, listed as chips in the footer
  const topDaysCount = 4;
  let topDays = $derived(
    rows
      .toSorted((a, b) => descending(a.incendios_activos, b.incendios_activos))
      .slice(0, topDaysCount)
  );

  // O(1) lookup for the hit test below, which runs on every pointermove
  let dayByCell = $derived(
    new Map(rows.map((d) => [d.fecha.getUTCMonth() * 100 + d.fecha.getUTCDate(), d]))
  );

  // Cell under a pointer event (month row × day column), or null outside the
  // grid or on an empty cell. Cell-based instead of hitting the exact
  // circle: far more forgiving on touch, where the smallest circles are
  // only a few px wide.
  function dayAtEvent(event) {
    const month = Math.floor((event.offsetY - marginTop) / rowHeight);
    const dayIndex = Math.floor((event.offsetX - marginLeft) / cellWidth);
    if (month < 0 || month >= monthsInYear || dayIndex < 0 || dayIndex >= daysInMonth) {
      return null;
    }
    return dayByCell.get(month * 100 + dayIndex + 1) ?? null;
  }

  function handleGridClick(event) {
    // Same day again toggles it off; an empty cell or the margins clear
    // the selection
    toggleDay(dayAtEvent(event));
  }

  function handleGridHover(event) {
    hoverDay(dayAtEvent(event), event);
  }

  // Shared by the grid cells and the footer chips, so both read the same on
  // hover. Touch has no hover: a moving finger is a scroll/tap, not a
  // reading, and a tap already goes through `toggleDay`.
  function hoverDay(day, event) {
    if (event.pointerType === 'touch') return;
    hoveredDay = day;
  }

  function toggleDay(day) {
    selectedDay = day === selectedDay ? null : day;
  }

  // While a day is in focus, the rest fade out to keep it readable — same
  // pattern as the year rows in the main heatmap
  const dimmedAlpha = 0.25;

  // Focus ring drawn around the focused day's circle
  const focusRingWidth = 1.5;
  const focusRingGap = 3;

  // Cells + paint order depend only on the data, the geometry and the
  // scales — NOT on the hover/selection — so pointer moves only rebuild the
  // cheap paint closure below instead of re-sorting and re-coloring the
  // year's rows on every event. Same split as the main Heatmap.
  let sortedCells = $derived.by(() => {
    // Outline the severe days (matching the main heatmap) or, on quiet
    // years, the year's own maximum.
    const highlightYearMax = severeDays.length === 0 && maxValue > 0;
    return rows
      .toSorted((a, b) => ascending(a.incendios_activos, b.incendios_activos))
      .map((d) => ({
        day: d,
        x: xAt(d.fecha.getUTCDate() - 1),
        y: yAt(d.fecha.getUTCMonth()),
        radius: radius(d.incendios_activos),
        fill: circleColor(d.incendios_activos),
        outlined:
          d.incendios_activos > severeFiresThreshold ||
          (highlightYearMax && d.incendios_activos === maxValue),
      }));
  });

  let drawGrid = $derived.by(() => {
    const cells = sortedCells;
    const focus = focusedDay;
    const dimOthers = hasFocus;
    // The clicked day keeps an outline while selected
    const selected = shownDay;

    // One ring per highlighted day: the user's focused day or, by default,
    // every day tied at the year's max so ties stay visible
    const ringDays = activeDay !== null ? [activeDay] : yearWorstDays;
    const rings = ringDays.map((d) => ({
      x: xAt(d.fecha.getUTCDate() - 1),
      y: yAt(d.fecha.getUTCMonth()),
      radius: radius(d.incendios_activos) + focusRingGap,
    }));

    return (ctx) => {
      ctx.lineWidth = 1;
      ctx.strokeStyle = severeOutlineColor;
      for (const cell of cells) {
        const dimmed = dimOthers && cell.day !== focus;
        ctx.globalAlpha = dimmed ? dimmedAlpha : circleAlpha;
        ctx.fillStyle = cell.fill;
        ctx.beginPath();
        ctx.arc(cell.x, cell.y, cell.radius, 0, 2 * Math.PI);
        ctx.fill();
        if (cell.outlined || cell.day === selected) {
          ctx.globalAlpha = dimmed ? dimmedAlpha : 1;
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      ctx.lineWidth = focusRingWidth;
      ctx.strokeStyle = focusRingColor;
      for (const ring of rings) {
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    };
  });
</script>

<!-- Single source for the hint shown in the strip (mobile) and below the
   footer (desktop) -->
{#snippet interactionHint()}
  <InteractionHint
    touchText="Toca cualquier día para ver el número de incendios"
    mouseText="Pasa el ratón por cualquier día para ver el número de incendios"
  />
{/snippet}

<!-- Reading strip: the focused day's data, always visible above the grid -->
{#if focusedDay !== null}
  <div class={['reading-strip', isMobile.current && 'mobile']}>
    {#if showWorstTie}
      <span class="color-dot" style:background-color={circleColor(maxValue)}></span>
      <span>
        <b>{yearWorstDays.length} días</b> con
        <b>{maxValue}</b>
        {maxValue === 1 ? 'incendio registrado' : 'incendios registrados'}
      </span>
    {:else}
      <span class="color-dot" style:background-color={circleColor(focusedDay.incendios_activos)}
      ></span>
      <span>
        <b>{vizLang.formatDayMonth.format(focusedDay.fecha)}</b>:
        <b>{focusedDay.incendios_activos}</b>
        {focusedDay.incendios_activos === 1 ? 'incendio registrado' : 'incendios registrados'}
      </span>
    {/if}
    {#if severeDays.length > 0}
      <span class="strip-aside">
        {severeDays.length}
        {severeDays.length === 1 ? 'día' : 'días'} con más de {severeFiresThreshold}
      </span>
    {/if}

    <!-- Mobile only: the hint lives inside the strip and steps aside as
       soon as the user interacts. On desktop it renders below the footer
       instead, always visible. -->
    {#if isMobile.current && activeDay === null}
      {@render interactionHint()}
    {/if}
  </div>
{/if}

<div class="year-detail" bind:clientWidth={width} aria-hidden="true">
  {#if width > 0}
    <div>
      {#each range(monthsInYear) as month (month)}
        {#if month > 0}
          <span
            class="month-line"
            style:top="{marginTop + month * rowHeight}px"
            style:left="{marginLeft}px"
            style:width="{gridWidth}px"
          ></span>
        {/if}
        <span class="month-label" style:top="{yAt(month)}px">
          {vizLang.formatMonthShort.format(new Date(Date.UTC(2000, month, 1)))}
        </span>
      {/each}
    </div>
    <Canvas {width} {height} contextName="year-detail-canvas">
      <CanvasLayer draw={drawGrid} contextName="year-detail-canvas" />
    </Canvas>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="hit-area"
      onclick={handleGridClick}
      onpointermove={handleGridHover}
      onpointerleave={() => (hoveredDay = null)}
    ></div>
  {/if}
</div>

<!-- Footer: the year's top days as chips, on a single row -->
<div class={['detail-footer', isMobile.current && 'mobile']}>
  <span class="footer-label">Peores días</span>
  {#each topDays as d (d.fecha)}
    <!-- Chips behave like the grid circles: hover reads the day on desktop,
       tap/click selects it. `active` follows the day being read (hover or
       selection) so pointing at a circle also lights up its chip, while
       `aria-pressed` stays on the actual selection. -->
    <button
      class={['day-chip', d === activeDay && 'active']}
      aria-pressed={d === shownDay}
      onclick={() => toggleDay(d)}
      onpointerenter={(event) => hoverDay(d, event)}
      onpointerleave={(event) => hoverDay(null, event)}
    >
      <span class="color-dot small" style:background-color={circleColor(d.incendios_activos)}
      ></span>
      {vizLang.formatDayMonthShort.format(d.fecha)}: <b>{d.incendios_activos}</b>
    </button>
  {/each}
</div>

<!-- Desktop only: persistent hint below the footer, outside the gray strip -->
{#if !isMobile.current}
  <div class="footer-hint">
    {@render interactionHint()}
  </div>
{/if}

<style>
  .reading-strip {
    display: flex;
    align-items: center;
    gap: 9px;
    flex-wrap: wrap;
    margin-top: 10px;
    padding: 8px 13px;
    background-color: var(--bw70);
    border-radius: 8px;
    font-size: 0.875rem;

    & b {
      font-variant-numeric: tabular-nums;
    }
  }

  .color-dot {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    flex: none;
    border: 1px solid rgb(0 0 0 / 0.25);

    &.small {
      width: 8px;
      height: 8px;
    }
  }

  .strip-aside {
    margin-left: auto;
    font-size: 0.78125rem;
    color: var(--bw600);
    flex: none;
  }

  .year-detail {
    position: relative;
    margin-top: 10px;
  }

  .month-label {
    position: absolute;
    left: 0;
    font-size: 0.625rem;
    line-height: 1;
    color: var(--bw550);
    transform: translateY(-50%);
  }

  .month-line {
    position: absolute;
    border-top: solid 1px var(--bw100);
  }

  /* Per-cell hover/click target over the whole grid */
  .hit-area {
    position: absolute;
    inset: 0;
    cursor: pointer;
  }

  .detail-footer {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: nowrap;
    margin-top: 8px;
  }

  .footer-label {
    font-size: 0.75rem;
    color: var(--bw500);
    flex: none;
  }

  .day-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 1px solid var(--bw200);
    background-color: white;
    border-radius: 50px;
    padding: 3px 10px;
    font-size: 0.75rem;
    font-family: inherit;
    cursor: pointer;

    /* Highlight driven by `active` (hover or selection), not by `:hover`:
       the state also lights the chip up from the grid, and `:hover` would
       stick on touch after a tap */
    &.active {
      border-color: var(--bw400);
      background-color: var(--bw70);
    }
  }

  .footer-hint {
    margin-top: 6px;
  }

  /* Mobile styles keyed off the isMobile class (not a media query), so the
     breakpoint lives in one place: states/utils.svelte.js */
  .reading-strip.mobile {
    font-size: 0.78125rem;
    padding: 8px 11px;

    & .strip-aside {
      display: none;
    }
  }

  /* Tighter chips allowed to wrap */
  .detail-footer.mobile {
    flex-wrap: wrap;

    & .day-chip {
      padding: 5px 10px;
      font-size: 0.71875rem;
    }
  }
</style>
