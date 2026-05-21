<script>
  import { scale, fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { cubicOut } from 'svelte/easing';
  import { visibility, firstProjectionYear } from '../../states/steps.svelte';
  import { prefersReducedMotion } from '../../states/utils.svelte';
  import { vizLang } from '../../states/language.svelte';
  import TweenedNumber from './TweenedNumber.svelte';

  const {
    hoveredYear,
    sumData,
    step,
    stackOrder,
    getAreaKeys,
    hoveredKey = null,
    onHoverKey,
  } = $props();

  const areaLabels = $derived(vizLang.texts.mainChart.areaLabels);

  const scaleIn = $derived(
    prefersReducedMotion.current ? { duration: 0 } : { duration: 250, start: 0.8, easing: cubicOut }
  );
  const flipOpts = $derived(
    prefersReducedMotion.current ? { duration: 0 } : { duration: 350, easing: cubicOut }
  );
  const fadeOpts = $derived(
    prefersReducedMotion.current ? { duration: 0 } : { duration: 250, easing: cubicOut }
  );

  const effectiveYear = $derived.by(() => {
    if (hoveredYear) return hoveredYear;
    if (step < 4) return firstProjectionYear - 1;
    return 2030;
  });
  const effectiveRow = $derived(sumData.find((d) => d.year === effectiveYear));
  const builtValue = $derived(effectiveRow?.built ?? 0);
  const showBuilt = $derived(step >= visibility.builtLine);

  // Incremental built in the hovered year. First year has no prior row so the
  // delta equals the row's own built value. Only shown in step 0, where the
  // BuiltLine is the sole focus.
  const builtYearDelta = $derived.by(() => {
    if (!hoveredYear || !effectiveRow) return 0;
    const idx = sumData.findIndex((d) => d.year === hoveredYear);
    if (idx <= 0) return effectiveRow.built ?? 0;
    return (effectiveRow.built ?? 0) - (sumData[idx - 1].built ?? 0);
  });
  const showYearDelta = $derived(step === 0 && hoveredYear !== null && builtYearDelta > 0);

  // Scopes the keyed each by stackOrder so 'lost' (present in multiple views)
  // is treated as a fresh box on view switch instead of being FLIP-animated
  // across an entirely different sibling layout.
  const viewId = $derived(stackOrder.join('|'));

  const rows = $derived.by(() => {
    if (!effectiveRow) return [];
    const out = [];
    for (const key of stackOrder) {
      const sumKeys = getAreaKeys(key, step);
      if (sumKeys.length === 0) continue;
      const value = sumKeys.reduce((s, k) => s + (effectiveRow[k] ?? 0), 0);
      if (value) out.push({ key, label: areaLabels[key] ?? key, value });
    }
    return out;
  });

  // Widest formatted number per key across all years for the current step.
  // Reserved beneath the tweened number so the box width stays constant.
  const maxTextByKey = $derived.by(() => {
    const out = {};
    for (const key of stackOrder) {
      const sumKeys = getAreaKeys(key, step);
      let maxVal = 0;
      for (const d of sumData) {
        const v = sumKeys.reduce((s, k) => s + (d[k] ?? 0), 0);
        if (v > maxVal) maxVal = v;
      }
      out[key] = vizLang.formatIntegers(Math.round(maxVal));
    }
    return out;
  });

  // Widest formatted built value across all years. Reserved by the ghost
  // year-content so the .year grid cell keeps a stable width and height
  // regardless of step or hover.
  const maxBuiltText = $derived.by(() => {
    let maxVal = 0;
    for (const d of sumData) {
      const v = d.built ?? 0;
      if (v > maxVal) maxVal = v;
    }
    return vizLang.formatIntegers(Math.round(maxVal));
  });

  // Ghost rows reserve the maximum possible layout height/width regardless of
  // step, hover or planView. Worst case is the Promoción view (6 stacked boxes
  // + lost). Without this reservation, the layout shifts pixels when boxes
  // appear with the steps and the surrounding chart jitters. Derived so label
  // widths stay accurate if the language changes.
  const ghostRows = $derived([
    { key: 'publico', label: areaLabels.publico },
    { key: 'privado', label: areaLabels.privado },
    { key: 'autopromotor', label: areaLabels.autopromotor },
    { key: 'sinAnimoLucro', label: areaLabels.sinAnimoLucro },
    { key: 'sinInfo', label: areaLabels.sinInfo },
    { key: 'lost', label: areaLabels.lost },
  ]);
</script>

<div class={['number-boxes', rows.length === 0 && 'no-areas', step < 1 && 'flipped']}>
  <div class={['year', !showBuilt && 'hidden']}>
    <div class="year-content">
      {#if showYearDelta}
        <span class="year-delta" transition:fade|local={fadeOpts}>
          +{vizLang.formatIntegers(builtYearDelta)}
          {vizLang.texts.mainChart.builtYearLabel}
          {hoveredYear}
        </span>
      {/if}
      <b class="built-value">
        <svg
          class="year-icon"
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M1 15V7.83721H9V1H15" stroke-width="2" />
        </svg>
        <TweenedNumber value={builtValue} />
      </b>
      <span class="year-caption">
        {vizLang.texts.mainChart.builtCaption}
        <span class="year-range">
          {vizLang.texts.mainChart.builtRangePrefix}
          <b>{Math.min(effectiveYear, firstProjectionYear - 1)}</b>
        </span>
      </span>
    </div>
    <div class="year-content year-content-ghost" aria-hidden="true" inert>
      <b class="built-value">
        <svg
          class="year-icon"
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M1 15V7.83721H9V1H15" stroke-width="2" />
        </svg>
        <span>{maxBuiltText}</span>
      </b>
      <span class="year-caption">
        {vizLang.texts.mainChart.builtCaption}
        <span class="year-range">
          {vizLang.texts.mainChart.builtRangePrefix} <b>2030</b>
        </span>
      </span>
    </div>
  </div>

  <div class="boxes-stack">
    <div class="boxes ghost" aria-hidden="true" inert>
      {#each ghostRows as { key, label } (key)}
        <div class="box" data-key={key}>
          <span class="swatch"></span>
          <div class="content">
            <span class="value">000.000</span>
            <span class="label">{label}</span>
          </div>
        </div>
      {/each}
    </div>

    <div class="boxes real">
      {#each rows as { key, label, value } (`${viewId}-${key}`)}
        <div
          class={['box', hoveredKey !== null && hoveredKey !== key && 'dimmed']}
          data-key={key}
          role="group"
          aria-label={label}
          onmouseenter={() => onHoverKey?.(key)}
          onmouseleave={() => onHoverKey?.(null)}
          in:scale|global={scaleIn}
          animate:flip={flipOpts}
        >
          <span class="swatch"></span>
          <div class="content">
            <span class="value value-stable">
              <span><TweenedNumber {value} /></span>
              <span class="value-reserve" aria-hidden="true">{maxTextByKey[key] ?? ''}</span>
            </span>
            <span class="label">{label}</span>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .number-boxes {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    margin-bottom: 1rem;
    max-width: 100%;
    position: relative;
    transition:
      width 0.4s ease,
      gap 0.4s ease;

    &.flipped {
      flex-direction: column-reverse;
    }
  }

  .year {
    font-size: 0.75rem;
    color: var(--bw700);
    margin: 0;
    display: grid;

    &.hidden {
      visibility: hidden;
    }

    & > .year-content {
      grid-area: 1 / 1;
    }
  }

  .year-content-ghost {
    visibility: hidden;
    pointer-events: none;
  }

  .year-content {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    position: relative;

    .built-value {
      color: var(--bw700);
      font-size: 0.9rem;
      font-weight: 900;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }

    .year-range {
      display: inline-block;
      white-space: nowrap;
    }

    .year-icon {
      flex-shrink: 0;

      path {
        stroke: var(--bw900);
      }
    }

    .year-delta {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      margin-bottom: 0.2rem;
      font-size: 0.72rem;
      color: var(--bw600);
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
  }

  .boxes-stack {
    position: relative;
    overflow: hidden;
    transition: width 0.4s ease;
  }

  .boxes {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-content: center;
    gap: 0.35rem;
  }

  .boxes.ghost {
    visibility: hidden;
    pointer-events: none;
  }

  .boxes.real {
    position: absolute;
    inset: 0;
  }

  /* Mobile-first: compact single-line boxes. */
  .box {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.3rem 0.55rem;
    background: var(--bw30);
    border-radius: 5px;
    border: solid 2px var(--box-color);
    height: fit-content;
    transition: opacity 0.2s ease;

    &.dimmed {
      opacity: 0.3;
    }

    & .swatch {
      background: var(--box-color);
      width: 10px;
      height: 10px;
      border-radius: 2px;
      display: inline-block;
      flex-shrink: 0;
    }
  }

  .content {
    display: flex;
    flex-direction: row;
    align-items: baseline;
    gap: 0.4rem;
    line-height: 1;
  }

  .value {
    font-variant-numeric: tabular-nums;
    font-weight: 700;
    font-size: 0.9rem;
    line-height: 0.9;
  }

  /* Stack the tweened number on top of a hidden span containing the widest
     formatted number for this key, so the box width is constant across the
     tween and flexbox doesn't reflow rows mid-animation. */
  .value-stable {
    display: inline-grid;
  }
  .value-stable > * {
    grid-area: 1 / 1;
  }
  .value-reserve {
    visibility: hidden;
    pointer-events: none;
  }

  .label {
    font-size: 0.7rem;
    color: var(--bw700);
  }

  /* Desktop: header next to a wrapping ghost grid. The grid keeps the
     row height constant across steps — the ghost-stack column always
     reserves the wrapped natural height regardless of how many real boxes
     are revealed. */
  @media (width >= 600px) {
    .number-boxes {
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: center;
      width: 100%;
      margin: 0 auto 1rem;
      column-gap: 0.75rem;
      container-type: inline-size;
      transition:
        grid-template-columns 0.4s ease,
        column-gap 0.4s ease,
        width 0.4s ease,
        gap 0.4s ease;
    }

    /* Steps without revealed areas: collapse the boxes-stack column to 0fr
       so the .year column (1fr) spans the whole row. grid-template-columns
       and column-gap transition between states for a smooth width animation;
       .boxes-stack uses overflow: hidden so the ghost-stack doesn't bleed
       through during the collapse. */
    .number-boxes.no-areas {
      grid-template-columns: 1fr 0fr;
      column-gap: 0;

      .year {
        padding-right: 0;
        border-right: none;
      }

      .boxes.ghost {
        width: 100cqi;
      }

      .year-content:not(.year-content-ghost) {
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        line-height: 1.5;
        gap: 0.4rem;
      }
    }

    .year {
      align-self: center;
      padding-right: 0.75rem;
      border-right: 1px var(--bw500) solid;
    }

    .year-content {
      flex-direction: column;
      align-items: flex-end;
      text-align: right;
      line-height: 1.5;
      gap: 0.2rem;

      .built-value {
        font-size: 1.05rem;
        display: inline-block;
      }

      .year-icon {
        position: relative;
        bottom: 3px;
      }

      .year-caption {
        display: grid;
      }
    }

    .boxes {
      align-items: center;
      min-width: 70cqi;
    }
    .box {
      padding: 0.4rem 0.6rem;
      border-radius: 6px;
    }

    .content {
      flex-direction: column;
      align-items: stretch;
      gap: 0;
      line-height: 1.1;
    }

    .value {
      font-size: 0.9rem;
      line-height: inherit;
    }
  }

  .box[data-key='permanent'],
  .box[data-key='estatal'],
  .box[data-key='publico'],
  .box[data-key='propiedad'] {
    --box-color: var(--civio-blue);
  }
  .box[data-key='protected'],
  .box[data-key='autonomico'],
  .box[data-key='privado'],
  .box[data-key='alquiler'] {
    --box-color: var(--primary);
  }
  .box[data-key='maybe'] {
    --box-color: var(--secondary);

    .swatch {
      background-image: repeating-linear-gradient(-45deg, var(--secondary) 0 3px, white 3px 6px);
    }
  }
  .box[data-key='mixto'],
  .box[data-key='sinAnimoLucro'] {
    --box-color: var(--secondary);
  }
  .box[data-key='autopromotor'] {
    --box-color: var(--civio-yellow);
  }
  .box[data-key='sinInfo'] {
    --box-color: var(--bw150);
  }
  .box[data-key='lost'] {
    --box-color: var(--bw600);

    /*.swatch {
      background-image: repeating-linear-gradient(-45deg, var(--bw700) 0 3px, white 3px 6px);
    }*/
  }
</style>
