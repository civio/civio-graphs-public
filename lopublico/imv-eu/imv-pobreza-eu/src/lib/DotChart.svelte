<script>
  import { scaleLinear } from 'd3';
  import { fade } from 'svelte/transition';
  import { data, householdTypes } from '../states/data.svelte';
  import { vizLang } from '../states/language.svelte';
  import { fill } from '../utils/template';
  import { isTouchDevice, prefersReducedMotion } from '../states/utils.svelte';
  import { readerCountry } from '../states/readerCountry.svelte';
  import { RowLayout, MARGIN } from '../utils/rowLayout.svelte';
  import Tooltip from './Tooltip.svelte';
  import TooltipShortfall from './TooltipShortfall.svelte';

  const DOT_RADIUS = 4;
  const REFERENCE_TOP = -20;

  /*
    Estimated tooltip height, measured on the desktop popover: 78 px in English, 96 px in
    Spanish, more with a long programme name. RowLayout only needs it to decide whether the
    tooltip fits above the row and to offset it; a few pixels off is invisible.
  */
  const TOOLTIP_HEIGHT = 100;

  const layout = new RowLayout(() => TOOLTIP_HEIGHT);

  // Vertical centre of the row, within each country group
  const innerY = $derived((layout.blockHeight - layout.countryGap) / 2);

  const REFERENCE_PERCENT = { poverty: 100, extreme: (40 / 60) * 100 };
  const REFERENCE_RATIO = { poverty: 1, extreme: 40 / 60 };

  let { reference = 'poverty', onreferencechange = () => {} } = $props();

  const isPoverty = $derived(reference === 'poverty');
  const ratio = $derived(REFERENCE_RATIO[reference]);
  const activePercent = $derived(REFERENCE_PERCENT[reference]);

  const maxValue = $derived.by(() => {
    let max = 100;
    for (const entry of data.byCountry) {
      for (const type of householdTypes) {
        const adequacy = entry.rows[type.key]?.adequacy;
        if (adequacy != null) max = Math.max(max, adequacy);
      }
    }
    return max;
  });

  const x = $derived(scaleLinear().domain([0, maxValue]).nice().range([0, layout.innerWidth]));
  const povertyX = $derived(x(REFERENCE_PERCENT.poverty));
  const extremeX = $derived(x(REFERENCE_PERCENT.extreme));
  const activeX = $derived(x(activePercent));

  const isNarrow = $derived(layout.containerWidth < 500);
  const TICK_STEP = $derived(isNarrow ? 40 : 20);

  // On narrow screens the shortfall axis title spans the whole width, so the threshold labels go up a line.
  const markY = $derived(isNarrow ? -52 : -30);

  /*
    Clickable area behind each threshold label, so a tap doesn't have to land on the glyphs.
    Capped at half the distance between both labels so the two areas never overlap.
  */
  const markHitHalfWidth = $derived(Math.min(40, (povertyX - extremeX) / 2));
  const markHitTop = $derived(markY - 31);
  const MARK_HIT_HEIGHT = 37;

  const ticks = $derived.by(() => {
    const furthest = maxValue / ratio - 100;
    const out = [];
    for (let deviation = -100; deviation <= furthest; deviation += TICK_STEP) out.push(deviation);
    return out;
  });

  const tickX = (deviation) => x((deviation + 100) * ratio);

  const axisNoun = $derived(vizLang.texts.referenceNoun[reference]);
  const extremeMarkLines = $derived(vizLang.texts.extremeMark.split('\n'));
  const axisTitle = (template) => fill(template, { reference: axisNoun });

  const tickLabel = (deviation) => `${deviation > 0 ? '+' : ''}${deviation} %`;

  /*
    Svelte transitions run in JS, so the reduced-motion media query in App.svelte does not
    reach them: the duration has to be gated here.
  */
  const fadeOptions = $derived({ duration: prefersReducedMotion.current ? 0 : 250 });

  function handleLeave() {
    if (!isTouchDevice.current) layout.clear();
  }
</script>

<div
  class="chart"
  class:narrow={isNarrow}
  bind:clientWidth={layout.containerWidth}
  {@attach layout.track}
>
  {#if layout.containerWidth > 0 && layout.rows.length > 0}
    <svg
      width={layout.containerWidth}
      height={layout.chartHeight}
      aria-hidden="true"
      onpointermove={layout.handleMove}
      onpointerdown={layout.handleDown}
      onpointerleave={handleLeave}
    >
      <g transform="translate(0,{MARGIN.top})">
        <!--
          The reader's country band. Inside a translated row group, like the labels, so it
          follows the row when switching household re-sorts the countries. Only in the static
          state: while hovering, the hover highlight is the only band, so the two never compete.
        -->
        {#each layout.rows as row (row.iso)}
          {#if row.iso === readerCountry.iso && !layout.hovered}
            <g class="country-row" style="transform: translateY({row.top}px)">
              <rect
                class="reader-band"
                x="0"
                y={-layout.countryGap / 2}
                width={layout.containerWidth}
                height={layout.blockHeight}
              />
            </g>
          {/if}
        {/each}

        {#if layout.hovered}
          <rect
            class="highlight"
            x="0"
            y={layout.hovered.row.top - layout.countryGap / 2}
            width={layout.containerWidth}
            height={layout.blockHeight}
          />
        {/if}
      </g>

      <g transform="translate({layout.labelWidth},{MARGIN.top})">
        {#each ticks as deviation (deviation)}
          {#if deviation !== -100}
            <line
              class="grid"
              x1={tickX(deviation)}
              x2={tickX(deviation)}
              y1="0"
              y2={layout.innerHeight}
            />
          {/if}
          {#if deviation !== 0 && deviation !== -100}
            {#if deviation < 0}
              <text class="tick shortfall" x={tickX(deviation)} y="-12">
                {tickLabel(deviation)}
              </text>
            {:else}
              <text class="tick surplus" x={tickX(deviation)} y={layout.innerHeight + 16}>
                {tickLabel(deviation)}
              </text>
            {/if}
          {/if}
        {/each}

        <!--
          Mouse/touch shortcut for the reference selector: the svg is aria-hidden, so keyboard
          and screen reader users switch thresholds through the RadialSelector instead.
        -->
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <g
          class="threshold-target"
          class:lit={isPoverty}
          onclick={() => onreferencechange('poverty')}
        >
          <rect
            class="threshold-hit"
            x={povertyX - markHitHalfWidth}
            y={markHitTop}
            width={markHitHalfWidth * 2}
            height={MARK_HIT_HEIGHT}
          />
          <text class="threshold-mark" x={povertyX} y={markY}>
            {vizLang.texts.thresholdMark}
          </text>
        </g>
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <g
          class="threshold-target"
          class:lit={!isPoverty}
          onclick={() => onreferencechange('extreme')}
        >
          <rect
            class="threshold-hit"
            x={extremeX - markHitHalfWidth}
            y={markHitTop}
            width={markHitHalfWidth * 2}
            height={MARK_HIT_HEIGHT}
          />
          <!-- One <text> per line of the label; the last one sits on the same line as the other mark. -->
          {#each extremeMarkLines as line, j (j)}
            <text
              class="threshold-mark"
              x={extremeX}
              y={markY - (extremeMarkLines.length - 1 - j) * 17}
            >
              {line}
            </text>
          {/each}
        </g>

        <text class="axis-title shortfall" x="0" y="-30">
          {axisTitle(vizLang.texts.axisTitleShortfall)}
        </text>
        <text class="axis-title surplus" x={layout.innerWidth} y={layout.innerHeight + 33}>
          {axisTitle(vizLang.texts.axisTitleSurplus)}
        </text>

        {#each layout.rows as row (row.iso)}
          <g class="country-row" style="transform: translateY({row.top}px)">
            {#if row.hasDeviation}
              <!--
                Keyed by slot, not by household type. The mark to animate is "this country's
                dot"; keying it by `segment.key` made every household switch throw the circle
                away and mount a new one, leaving the transition nothing to interpolate from.
              -->
              <g transition:fade={fadeOptions}>
                {#each row.segments as segment, index (index)}
                  {#if segment.adequacy != null}
                    {@const isAbove = segment.adequacy >= activePercent}
                    {@const dotX = x(segment.adequacy)}
                    <!--
                      Rects rather than lines: `x1`/`x2` are plain SVG attributes and cannot be
                      transitioned, while `x` and `width` are CSS geometry properties and can.
                      The gap runs either side of the reference, hence the min/abs.
                    -->
                    <rect
                      class="guide"
                      x="0"
                      y={innerY - 0.5}
                      width={isAbove ? activeX : dotX}
                      height="1"
                    />
                    <rect
                      class={['gap-line', isAbove ? 'surplus' : 'shortfall']}
                      x={Math.min(activeX, dotX)}
                      y={innerY - 0.25}
                      width={Math.abs(dotX - activeX)}
                      height="0.5"
                    />
                    <circle
                      class={['dot', isAbove ? 'surplus' : 'shortfall']}
                      cy={innerY}
                      r={DOT_RADIUS}
                      style="transform: translateX({dotX}px)"
                    />
                  {/if}
                {/each}
              </g>
            {:else}
              <text class="no-data" x="2" y={innerY} transition:fade={fadeOptions}>
                {vizLang.texts.noRatio}
              </text>
            {/if}
          </g>
        {/each}

        <line
          class="reference"
          x1={povertyX}
          x2={povertyX}
          y1={REFERENCE_TOP}
          y2={layout.innerHeight}
        />
        <line
          class="reference"
          x1={extremeX}
          x2={extremeX}
          y1={REFERENCE_TOP}
          y2={layout.innerHeight}
        />
        <line
          class="reference lit"
          x1="0"
          x2="0"
          y1={REFERENCE_TOP}
          y2={layout.innerHeight}
          style="transform: translateX({activeX}px)"
        />
      </g>

      <g transform="translate(0,{MARGIN.top})">
        {#each layout.rows as row (row.iso)}
          <g class="country-row" style="transform: translateY({row.top}px)">
            <text
              class="country"
              class:empty={!row.hasDeviation}
              class:reader={row.iso === readerCountry.iso}
              x={layout.labelWidth - 10}
              y={innerY}
            >
              {row.country}
            </text>
          </g>
        {/each}
      </g>
    </svg>

    {#if layout.hovered}
      <Tooltip
        hover={!isTouchDevice.current}
        label={layout.hovered.row.country}
        position={{ x: layout.hovered.x, y: layout.hovered.y }}
        onclose={layout.clear}
      >
        <TooltipShortfall
          row={layout.hovered.row}
          {ratio}
          term={isPoverty ? vizLang.texts.povertyTerm : vizLang.texts.extremeTerm}
        />
      </Tooltip>
    {/if}
  {/if}
</div>

<style>
  .chart {
    position: relative;
    width: 100%;
    margin-top: 3.5rem;
    touch-action: pan-y;

    /* Room for the raised threshold labels */
    &.narrow {
      margin-top: 4.75rem;
    }
  }

  svg {
    display: block;
    overflow: visible;
  }

  .highlight {
    fill: var(--bw100);
  }

  /* Lighter than the hover highlight, so hovering the reader's country still reads */
  .reader-band {
    fill: var(--bw50);
  }

  .grid {
    stroke: var(--bw150);
    stroke-width: 0.5;
  }

  .reference {
    stroke: var(--bw250);
    stroke-width: 1;
    stroke-dasharray: 3 3;
  }

  .reference.lit {
    stroke: var(--bw900);
    stroke-width: 2;
    stroke-dasharray: none;
  }

  .threshold-mark {
    fill: var(--bw300);
    font-size: 0.9rem;
    font-weight: 400;
    text-anchor: middle;
  }

  .threshold-hit {
    fill: transparent;
  }

  .threshold-target {
    &:not(.lit) {
      cursor: pointer;

      &:hover .threshold-mark {
        fill: var(--bw600);
      }
    }

    &.lit .threshold-mark {
      fill: var(--bw900);
      font-weight: 700;
    }
  }

  .tick {
    fill: var(--bw500);
    font-size: 0.7rem;
    text-anchor: middle;
  }

  .tick.shortfall {
    fill: var(--shortfall-text);
  }

  .tick.surplus {
    fill: var(--surplus-text);
  }

  .axis-title {
    font-size: 0.75rem;
    font-weight: 700;
  }

  .axis-title.shortfall {
    fill: var(--shortfall-text);
    text-anchor: start;
  }

  .axis-title.surplus {
    fill: var(--surplus-text);
    text-anchor: end;
  }

  .country {
    fill: var(--bw800);
    font-size: 0.75rem;
    text-anchor: end;
    dominant-baseline: middle;
  }

  /* The reader's country, detected from their IP */
  .country.reader {
    fill: var(--bw900);
    font-weight: 700;
  }

  .country.empty {
    fill: var(--bw300);
  }

  .no-data {
    fill: var(--bw300);
    font-size: 0.7rem;
    font-style: italic;
    dominant-baseline: middle;
  }

  .guide {
    fill: var(--bw100);
  }

  .gap-line.shortfall {
    fill: #f74383;
  }

  .gap-line.surplus {
    fill: #08a6bf;
  }

  .dot.shortfall {
    fill: #f74383;
  }

  .dot.surplus {
    fill: #08a6bf;
  }

  @media (prefers-reduced-motion: no-preference) {
    .country-row {
      transition: transform 0.5s ease;
    }

    .guide {
      transition: width 0.5s ease;
    }

    .gap-line {
      transition:
        x 0.5s ease,
        width 0.5s ease,
        fill 0.5s ease;
    }

    .dot {
      transition:
        transform 0.5s ease,
        fill 0.5s ease;
    }

    .reference.lit {
      transition: transform 0.5s ease;
    }

    .threshold-mark {
      transition: fill 0.5s ease;
    }
  }
</style>
