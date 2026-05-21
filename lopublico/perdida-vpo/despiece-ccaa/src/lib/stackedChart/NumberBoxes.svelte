<script>
  import { scale } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { cubicOut } from 'svelte/easing';
  import { firstProjectionYear } from '../../states/chartConfig';
  import { prefersReducedMotion } from '../../states/utils.svelte';
  import { vizLang } from '../../states/language.svelte';
  import TweenedNumber from './TweenedNumber.svelte';

  const { hoveredYear, sumData, stackOrder, hoveredKey = null, onHoverKey } = $props();

  const areaLabels = $derived(vizLang.texts.ccaaChart.areaLabels);

  const scaleIn = $derived(
    prefersReducedMotion.current ? { duration: 0 } : { duration: 250, start: 0.8, easing: cubicOut }
  );
  const flipOpts = $derived(
    prefersReducedMotion.current ? { duration: 0 } : { duration: 350, easing: cubicOut }
  );

  const effectiveYear = $derived(hoveredYear ?? sumData.at(-1)?.year ?? firstProjectionYear);
  const effectiveRow = $derived(sumData.find((d) => d.year === effectiveYear));
  const builtValue = $derived(effectiveRow?.built ?? 0);

  // Scopes the keyed each by stackOrder so 'lost' (present in both plan and
  // protection views) is treated as a fresh box on view switch instead of
  // being FLIP-animated across an entirely different sibling layout.
  const viewId = $derived(stackOrder.join('|'));

  const rows = $derived.by(() => {
    if (!effectiveRow) return [];
    const out = [];

    for (const key of stackOrder) {
      const value = effectiveRow[key] ?? 0;
      if (value) out.push({ key, label: areaLabels[key] ?? key, value });
    }

    return out;
  });

  // Widest formatted number per key across all years. Reserved on each
  // .value (via a hidden span underneath the tweened number) so the box
  // width stays constant while TweenedNumber animates digits — otherwise
  // flexbox could wrap a box to the next row mid-tween, outside Svelte's
  // render cycle and so unreachable by animate:flip.
  const maxTextByKey = $derived.by(() => {
    const out = {};
    for (const key of stackOrder) {
      let maxVal = 0;
      for (const d of sumData) {
        const v = d[key] ?? 0;
        if (v > maxVal) maxVal = v;
      }
      out[key] = vizLang.formatIntegers(Math.round(maxVal));
    }
    return out;
  });
</script>

<div class="number-boxes">
  <div class={['year', rows.length === 0 && 'hidden']}>
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
      {vizLang.texts.ccaaChart.builtCaption}
      <span class="year-range">
        {vizLang.texts.ccaaChart.builtRangePrefix}
        <b>{Math.min(effectiveYear, firstProjectionYear - 1)}</b>
      </span>
    </span>
  </div>

  <div class="boxes">
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

<style>
  .number-boxes {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    margin-bottom: 1rem;
    max-width: 100%;
  }

  .year {
    font-size: 0.75rem;
    color: var(--bw700);
    margin: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;

    &.hidden {
      visibility: hidden;
    }

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
  }

  .boxes {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.35rem;
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

  /* Desktop: stacked content with larger padding. */
  @media (width >= 600px) {
    .number-boxes {
      flex-direction: row;
      width: fit-content;
      margin: 0 auto 1rem;
      gap: 0.75rem;
    }

    .year {
      display: inline-flex;
      flex-direction: column;
      align-items: flex-end;
      text-align: right;
      padding-right: 0.75rem;
      border-right: 1px var(--bw500) solid;
      line-height: 1.5;
      gap: 0.2rem;
      height: fit-content;
      justify-content: center;

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
    --box-color: var(--bw400);
  }
  .box[data-key='lost'] {
    --box-color: var(--bw700);
  }
</style>
