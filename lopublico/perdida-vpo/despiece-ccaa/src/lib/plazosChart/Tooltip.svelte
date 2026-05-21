<script>
  import { vizLang } from '../../states/language.svelte.js';
  import { subColor } from './colorScale.js';
  import { clickOutside } from '../../utils/clickOutside.svelte.js';

  // `data` shape per kind:
  //  sub:  { kind: 'sub',  startYear, endYear, label, ccaa, isPermanent, years, minYears, maxYears, note? }
  //  norma:{ kind: 'norma', entry: { startYear, endYear, category, title, subtitle?, note?, url? } }
  //
  // Subs carry vigent/expired status (from the per-period plazos data, which is
  // reliable). Normas don't: the dataset doesn't model whether a law is still
  // in force, so the tooltip shows neither a status badge nor reduced opacity.
  const {
    data,
    x,
    anchorTop,
    anchorBottom,
    lastYear,
    chartID,
    chartContainer,
    onPointerEnter,
    onPointerLeave,
    onClose,
  } = $props();

  // Portal up to .ccaa-content so the tooltip escapes the .ccaa-block stacking
  // context (created by view-transition-name) and renders above .nav-sticky.
  // Staying inside #chartID keeps the CSS vars (--primary, --bw*) in scope;
  // portaling to <body> would break var inheritance.
  function portal(node) {
    const target =
      node.closest('.ccaa-content') ?? document.getElementById(chartID) ?? document.body;
    target.appendChild(node);
    return () => node.remove();
  }

  let tooltipWidth = $state(0);
  let tooltipHeight = $state(0);

  const safeMargin = 8;
  const gap = 8;

  const note = $derived(data.kind === 'sub' ? data.note : data.entry.note);
  const headerText = $derived(
    data.kind === 'sub' ? (vizLang.texts.ccaas[data.ccaa] ?? data.ccaa) : data.entry.category
  );

  const isCurrentSub = $derived(data.kind === 'sub' && data.endYear === lastYear);
  const subStatusText = $derived.by(() => {
    if (data.kind !== 'sub') return null;
    if (isCurrentSub) return vizLang.texts.plazosChart.tooltip.since(data.startYear);
    if (data.startYear === data.endYear) return `${data.startYear}`;
    return `${data.startYear}–${data.endYear}`;
  });

  // Border color: dynamic subColor for subs (matches the duration palette in
  // the chart); neutral grey for normas, which don't carry a duration metric.
  const borderColor = $derived(data.kind === 'sub' ? subColor(data) : 'var(--bw500)');

  const protection = $derived.by(() => {
    if (data.kind !== 'sub') return null;
    const t = vizLang.texts.plazosChart.tooltip;
    if (data.isPermanent && data.years == null) return t.protectionPermanent;
    if (data.years != null) return t.protectionYears(data.years);
    if (data.minYears != null && data.maxYears != null)
      return t.protectionRange(data.minYears, data.maxYears);
    return null;
  });

  // Clamp X to the viewport and to the chart-container (mismo sistema que en
  // PlazosChart). Ancho fluido: medimos con bind:offsetWidth para clamp exacto.
  const clampedX = $derived.by(() => {
    if (!tooltipWidth || typeof window === 'undefined') return x;
    const half = tooltipWidth / 2;
    let min = safeMargin + half;
    let max = window.innerWidth - safeMargin - half;
    if (chartContainer) {
      const r = chartContainer.getBoundingClientRect();
      if (r.width >= tooltipWidth) {
        min = Math.max(min, r.left + half);
        max = Math.min(max, r.right - half);
      }
    }
    return Math.min(Math.max(x, min), max);
  });

  // Flip below the anchor if the tooltip would overflow the top of the viewport.
  const flipped = $derived.by(() => {
    if (!tooltipHeight || typeof window === 'undefined') return false;
    return anchorTop - gap - tooltipHeight < safeMargin;
  });
  const computedTop = $derived(flipped ? anchorBottom + gap : anchorTop - gap);
</script>

<div
  bind:offsetWidth={tooltipWidth}
  bind:offsetHeight={tooltipHeight}
  class={['plazos-ccaa-tooltip', flipped && 'flipped', data.kind]}
  role="tooltip"
  style:top="{computedTop}px"
  style:left="{clampedX}px"
  style:border-color={borderColor}
  onpointerenter={onPointerEnter}
  onpointerleave={onPointerLeave}
  {@attach portal}
  {@attach clickOutside({ exclude: '.bar.sub, .dot, .range', onClickOutside: onClose })}
>
  {#if data.kind === 'sub'}
    <p class="header info-row">
      <span><span class="icon" aria-hidden="true">📍</span> {headerText}</span>
      <span class={['status', isCurrentSub ? 'current' : 'expired']}>{subStatusText}</span>
    </p>

    <p class="info-row">
      <span class="icon" aria-hidden="true">🏠</span>
      {data.label}
    </p>

    <p class="info-row protection">
      <span class="icon" aria-hidden="true">🗓️</span>
      <span>
        {#if protection}
          {protection.prefix}<b>{protection.bold}</b>{#if note}, {note.toLowerCase()}{/if}
        {/if}
      </span>
    </p>
  {:else if data.kind === 'norma'}
    <p class="header info-row laws">
      <span class="icon" aria-hidden="true">📜</span>
      {headerText}
    </p>

    <span class="norma-text">
      <span class="title">{data.entry.title}</span>
      {#if data.entry.subtitle}
        {' '}<span class="subtitle">{data.entry.subtitle}</span>
      {/if}
    </span>

    {#if note}
      <p class="note">{note}</p>
    {/if}
  {/if}

  {#if data.kind === 'norma' && data.entry.urls?.length}
    {@const urls = data.entry.urls}
    {#if urls.length === 1}
      <a
        class="cta"
        href={urls[0]}
        target="_blank"
        rel="noopener noreferrer"
        onclick={() => onClose?.()}
      >
        {vizLang.texts.plazosChart.tooltip.viewSource}
        <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
          <path
            d="M5 2H2v10h10V9"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M8 2h4v4M12 2L7 7"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </a>
    {:else}
      <span class="sources">
        <span class="sources-label">{vizLang.texts.plazosChart.tooltip.viewSources}</span>
        {#each urls as url, i (url)}
          <a
            class="cta source-link"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onclick={() => onClose?.()}
            aria-label={vizLang.texts.plazosChart.tooltip.sourceLabel(i + 1)}
          >
            {i + 1}
            <svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true">
              <path
                d="M5 2H2v10h10V9"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M8 2h4v4M12 2L7 7"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </a>
        {/each}
      </span>
    {/if}
  {/if}
</div>

<style>
  .plazos-ccaa-tooltip {
    position: fixed;
    transform: translate(-50%, -100%);
    background: white;
    color: var(--bw800);
    border: 2px solid var(--bw500);
    border-radius: 10px;
    padding: 10px 12px;
    font-family: Lato, sans-serif;
    font-size: 0.78rem;
    line-height: 1.2;
    pointer-events: auto;
    z-index: 999999;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
    /*width: max-content;*/
    width: min(320px, calc(100vw - 16px));
    /*min-width: 220px;*/
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    row-gap: 0.7rem;
    animation: tooltip-in-up 120ms cubic-bezier(0.22, 1, 0.36, 1) both;

    & p {
      width: 100%;
      margin-bottom: 0;
    }

    .info-row {
      display: flex;
      align-items: center;

      &:not(.header) .icon {
        margin-right: 5px;
      }

      /*&.protection {
        display: block;
      }*/

      & b {
        margin-left: 0.25em;
      }

      &.header {
        justify-content: space-between;
        flex-direction: row;
        flex-wrap: wrap;
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--bw700);
        font-weight: 600;
        overflow-wrap: anywhere;
        gap: 0.35rem;

        &.laws {
          justify-content: center;
          align-items: center;
        }
      }

    }
  }

  .note {
    font-size: 0.7rem;
    color: var(--bw500);
    font-style: italic;
    margin: 0;
  }

  .plazos-ccaa-tooltip.flipped {
    transform: translate(-50%, 0);
    animation-name: tooltip-in-down;
  }

  @keyframes tooltip-in-up {
    from {
      opacity: 0;
      transform: translate(-50%, calc(-100% + 4px));
    }
    to {
      opacity: 1;
      transform: translate(-50%, -100%);
    }
  }

  @keyframes tooltip-in-down {
    from {
      opacity: 0;
      transform: translate(-50%, -4px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }

  .status {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 2px 8px;
    margin: 0;
    border-radius: 3px;
    line-height: 1;
    border: 1px solid transparent;
    box-sizing: border-box;
  }

  .status.current {
    background: var(--bw900);
    color: white;
    border-color: var(--bw900);
  }

  .status.expired {
    background: white;
    color: var(--bw400);
    border-color: var(--bw300);
  }

  .norma-text {
    line-height: 1.35;
    overflow-wrap: anywhere;
  }

  .title {
    font-weight: 700;
    color: var(--bw900);
  }

  .subtitle {
    color: var(--bw700);
  }

  .cta {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    cursor: pointer !important;
    gap: 4px;
    border-color: transparent !important;
    color: var(--primary);
    font-family: inherit;
    font-size: 0.7rem;
    font-weight: 400;
    text-decoration: none;
    align-self: stretch;
    box-sizing: border-box;
    transition:
      background 0.15s ease,
      transform 0.1s ease;
    -webkit-tap-highlight-color: transparent;

    &:hover {
      background: none !important;
    }
  }

  .cta:active {
    transform: scale(0.98);
  }

  .sources {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 4px 10px;
    align-self: stretch;
  }

  .sources-label {
    font-size: 0.7rem;
    color: var(--primary);
  }

  .cta.source-link {
    margin: 0;
    align-self: auto;
    gap: 2px;
  }
</style>
