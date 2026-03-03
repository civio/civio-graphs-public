<script>
  import { fade } from 'svelte/transition';
  import { packSquaresBestFit } from '../utils/squarePacking.js';

  import { data } from '../states/data.svelte.js';
  import { isMobile } from '../states/utils.svelte.js';
  import Tooltip from './Tooltip.svelte';
  import { vizLang } from '../states/language.svelte.js';

  let {
    layoutData,
    hierarchyData,
    causes = {},
    showLabels = true,
    years = [],
    highlightYear = null,
  } = $props();

  let admColor = $derived(`var(--${data.selectedAdm.toLowerCase()})`);

  let containerWidth = $state(500);

  let tooltipSquare = $state(undefined);
  let tooltipPosition = $state({ x: 0, y: 0 });

  function showTooltip(sq, event) {
    const filtered = filteredLookup.get(sq.name);
    const fullBreakdown = new Map(years.map((y) => [y, filtered?.yearBreakdown?.get(y) ?? 0]));
    tooltipSquare = {
      name: sq.name,
      yearBreakdown: fullBreakdown,
      fill: sq.fill,
      yearTotals,
    };
    if (event?.currentTarget) {
      const container = event.currentTarget.closest('.square-packing');
      if (container) {
        const rect = container.getBoundingClientRect();
        tooltipPosition = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };
      }
    }
  }

  function hideTooltip() {
    tooltipSquare = undefined;
  }

  // Lookup: motivo name -> filtered child data (yearBreakdown, pct value)
  let filteredLookup = $derived(new Map(hierarchyData?.children?.map((d) => [d.name, d]) ?? []));

  // Total per year across all motivos (from filtered data)
  let yearTotals = $derived(
    Object.fromEntries(
      years.map((year) => {
        let total = 0;
        for (const d of filteredLookup.values()) {
          total += d.yearBreakdown?.get(year) ?? 0;
        }
        return [year, total];
      })
    )
  );

  // Grand total across all years (for global % when no year is highlighted)
  let grandTotal = $derived(Object.values(yearTotals).reduce((s, v) => s + v, 0));

  // Global max percentage across all motivos and years (shared Y scale for tooltips)
  let globalMaxPct = $derived.by(() => {
    let max = 1;
    for (const d of filteredLookup.values()) {
      if (!d.yearBreakdown) continue;
      for (const [year, value] of d.yearBreakdown) {
        const yt = yearTotals[year] ?? 0;
        if (yt) {
          const pct = (value / yt) * 100;
          if (pct > max) max = pct;
        }
      }
    }
    return max;
  });

  // Opacity per year
  let yearOpacities = $derived(
    Object.fromEntries(
      years.map((year, i) => {
        if (highlightYear) {
          return [year, year === highlightYear ? 1 : 0.08];
        }
        return [year, 0.15 + (0.85 * i) / Math.max(years.length - 1, 1)];
      })
    )
  );

  // All children sorted by value desc
  let children = $derived(layoutData?.children?.slice().sort((a, b) => b.value - a.value) ?? []);

  // Shared maxValue for scale
  let maxValue = $derived(Math.max(...(layoutData?.children?.map((d) => d.value) ?? [1])));

  // Target height for scaling algorithm coords
  const targetHeight = 400;

  // Best-fit packing
  let packed = $derived(
    children.length
      ? packSquaresBestFit(
          children.map((d) => d.value),
          maxValue,
          0
        )
      : null
  );

  let scale = $derived(packed ? targetHeight / packed.extent.height : 1);

  let group = $derived.by(() => {
    if (!children.length || !packed)
      return { squares: [], viewBox: '0 0 0 0', width: 0, height: 0 };

    const { squares, extent } = packed;
    const pad = 4;

    const mapped = squares.map((sq, i) => {
      const name = children[i].name;
      const baseSide = sq.width * scale;
      const x = (sq.x - extent.x) * scale + pad;
      const y = (sq.y - extent.y) * scale + pad;
      const fillColor = admColor;

      const baseValue = children[i].value;
      const filtered = filteredLookup.get(name);
      const filteredValue = filtered?.value ?? 0;
      const side = baseValue && filteredValue ? baseSide * Math.sqrt(filteredValue / baseValue) : 0;

      const breakdown = filtered?.yearBreakdown;
      const rings = years
        .map((year) => {
          const val = breakdown?.get(year) ?? 0;
          const total = yearTotals[year] ?? 0;
          const pct = total ? val / total : 0;
          return {
            year,
            pct,
            value: val,
            size: baseValue > 0 ? baseSide * Math.sqrt(pct / baseValue) : 0,
          };
        })
        .sort((a, b) => b.size - a.size);

      return { name, x, y, baseSide, side, fill: fillColor, rings };
    });

    const margin = {
      top: 20,
      right: isMobile.current ? 40 : 60,
      bottom: 25,
      left: isMobile.current ? 10 : 50,
    };

    const vbW = extent.width * scale + pad * 2 + margin.right + margin.left;
    const vbH = extent.height * scale + pad * 2 + margin.bottom + margin.top;

    return {
      squares: mapped,
      viewBox: `${-margin.left} ${-margin.top} ${vbW} ${vbH}`,
      width: vbW,
      height: vbH,
    };
  });

  // Fixed legend order: captured once on first data load (default filters = % desc)
  let legendOrder = $state(null);
  let squareLookup = $derived(new Map(group.squares.map((sq) => [sq.name, sq])));
  $effect(() => {
    if (!legendOrder && group.squares.length) {
      legendOrder = group.squares
        .map((sq) => {
          const filtered = filteredLookup.get(sq.name);
          if (!filtered?.yearBreakdown) return { name: sq.name, pct: 0 };
          if (highlightYear) {
            const val = filtered.yearBreakdown.get(highlightYear) ?? 0;
            const total = yearTotals[highlightYear] ?? 0;
            return { name: sq.name, pct: total ? val / total : 0 };
          }
          const nodeTotal = [...filtered.yearBreakdown.values()].reduce((s, v) => s + v, 0);
          return { name: sq.name, pct: grandTotal ? nodeTotal / grandTotal : 0 };
        })
        .sort((a, b) => b.pct - a.pct)
        .map((d) => d.name);
    }
  });

  // --- Label system ---
  //
  // Label modes (by sq.side — the filtered square size):
  //   'inline'    — full label + stats centered inside the square
  //   'displaced' — label positioned beside the square (desktop only, via labelOffsets)
  //   'code'      — motivo code (e.g. "109D") inside square + full label in HTML legend (mobile)
  //
  // Mobile (two tiers by square size):
  //   side >= mobileInlineSide → 'inline'
  //   side <  mobileInlineSide → 'code' (code inside + legend below)
  //
  // Desktop:
  //   Has labelOffsets entry → 'displaced'
  //   Otherwise             → 'inline'

  // When the container shrinks below the viewBox width, SVG units render
  // smaller than 1px. fontScale compensates so text keeps a stable visual size.
  let fontScale = $derived(
    containerWidth > 0 && group.width > 0 ? Math.max(1, group.width / containerWidth) : 1
  );

  const mobileInlineSide = 120;

  // Manual label displacement directions for specific motivos (desktop)
  const labelOffsets = {
    '108e': 'top-left',
    '109a': 'bottom',
    '108i': 'top-right',
    '108h': 'right',
    '109b': 'top-right',
    '109h': 'left',
    '108f': 'left',
    '109e': 'left',
    '109c': 'bottom-right',
    '108a': 'top-left',
    '109i': 'bottom',
  };

  // Manual label displacement directions for mobile (code displaced outside)
  const mobileLabelOffsets = {
    '108e': 'top-left',
    '108i': 'top-right',
    '108h': 'right',
    '109h': 'left',
    '108f': 'left',
    '109e': 'left',
    '109c': 'bottom-right',
    '109i': 'bottom',
    '109b': 'top',
    '109f': 'bottom',
    '108b': 'top',
  };

  function getLabelMode(name, side) {
    const key = name?.toLowerCase();
    if (isMobile.current) {
      if (side >= mobileInlineSide) return 'inline';
      if (mobileLabelOffsets[key]) return 'displaced';
      return 'code';
    }
    if (labelOffsets[key]) return 'displaced';
    return 'inline';
  }

  function getLabel(name) {
    return causes[name?.toLowerCase()]?.labelShort;
  }

  function formatPctStr(pct) {
    if (pct === 0) return '0%';
    return pct < 1 ? '<1%' : `${Math.round(pct)}%`;
  }

  function formatStats(name) {
    const filtered = filteredLookup.get(name);
    if (!filtered?.yearBreakdown) return null;
    if (highlightYear) {
      const val = filtered.yearBreakdown.get(highlightYear) ?? 0;
      const total = yearTotals[highlightYear] ?? 0;
      const pct = total ? (val / total) * 100 : 0;
      return { pct: formatPctStr(pct), count: vizLang.formatIntegers(val) };
    }
    const nodeTotal = [...filtered.yearBreakdown.values()].reduce((s, v) => s + v, 0);
    if (!nodeTotal) return null;
    const pct = (nodeTotal / grandTotal) * 100;
    return { pct: formatPctStr(pct), count: vizLang.formatIntegers(nodeTotal) };
  }

  // Tunables
  const inactiveOpacity = 0.05;
  const baseLabelOpacity = 1;
  const baseLabelOpacityMobile = 0.8;
  const displacedLabelOpacity = 0.8;
  const rectFillOpacity = 0.85;
  const rectInactiveOpacity = 0.08;
  const displacedStatsInsideMin = 20;

  /** Whether a motivo has zero value for the highlighted year */
  function isInactive(name) {
    if (!highlightYear) return false;
    const filtered = filteredLookup.get(name);
    const val = filtered?.yearBreakdown?.get(highlightYear) ?? 0;
    return val === 0;
  }

  const displacedFontSize = 11;
  const displacedMaxChars = 20;
  const displacedGap = 5;

  /** Simplify compound direction to horizontal-only (top-left → left) */
  function simplifyDir(dir) {
    if (dir.includes('left')) return 'left';
    if (dir.includes('right')) return 'right';
    return dir;
  }

  /** Compute anchor coordinates for a displaced label */
  function displacedAnchor(dir, refInset, refSide, blockH, scaledFont) {
    const lh = scaledFont * 1.15;
    const cx = refInset + refSide / 2;
    const cy = cx;

    const anchorX =
      dir === 'left'
        ? refInset - displacedGap
        : dir === 'right'
          ? refInset + refSide + displacedGap
          : dir.includes('left')
            ? cx + refSide / 2
            : dir.includes('right')
              ? cx - refSide / 2
              : cx;

    const startY = dir.includes('top')
      ? refInset - displacedGap - blockH + lh
      : dir.includes('bottom')
        ? refInset + refSide + displacedGap + scaledFont
        : cy - blockH / 2 + lh * 0.4;

    const textAnchor = dir.includes('left') ? 'end' : dir.includes('right') ? 'start' : 'middle';

    return { cx, cy, anchorX, startY, textAnchor };
  }

  function wrapLines(text, side, fontSize, maxCharsOverride) {
    const charWidth = fontSize * 0.5;
    const maxChars = maxCharsOverride ?? Math.floor((side * 0.85) / charWidth);
    const words = text.split(/\s+/);
    const lines = [];
    let current = '';
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (test.length > maxChars && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    if (maxCharsOverride) return lines;
    const maxLines = Math.floor((side * 0.8) / (fontSize * 1.3));
    return lines.slice(0, maxLines);
  }
</script>

{#if layoutData?.children?.length}
  <div class="square-packing" bind:clientWidth={containerWidth}>
    <div class={['packing-container', isMobile.current && tooltipSquare && 'blur-background']}>
      <svg viewBox={group.viewBox} width="100%" aria-hidden="true">
        {#each group.squares as sq (sq.name)}
          {@const fontSize = 12}
          {@const inset = (sq.baseSide - sq.side) / 2}
          {@const visibleSide = highlightYear ? (sq.rings[0]?.size ?? 0) : sq.side}
          {@const visibleInset = (sq.baseSide - visibleSide) / 2}
          {@const labelSide = highlightYear ? sq.baseSide : sq.side}
          {@const labelInset = highlightYear ? 0 : inset}
          {@const labelMode = showLabels ? getLabelMode(sq.name, sq.side) : 'none'}
          {@const inactive = isInactive(sq.name)}
          {@const activeOpacity = isMobile.current ? baseLabelOpacityMobile : baseLabelOpacity}
          {@const labelOpacity = inactive ? inactiveOpacity : activeOpacity}
          <!--
            a11y: Interactive SVG nodes intentionally lack role/tabindex/keydown handlers.
            This chart lives inside aria-hidden="true" (set in App.svelte) so the full
            data is exposed via ScreenReaderDescription instead. Adding focusable elements
            inside aria-hidden would itself be a WCAG violation (focusable hidden content).
          -->
          <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
          <g
            class="node"
            style:transform="translate({sq.x}px, {sq.y}px)"
            style="cursor:pointer"
            transition:fade={{ duration: 200 }}
            onmouseenter={(e) => !isMobile.current && showTooltip(sq, e)}
            onmouseleave={() => !isMobile.current && hideTooltip()}
            onclick={(e) => isMobile.current && showTooltip(sq, e)}
          >
            <!-- Squares: concentric year rings or solid fill -->
            {#if highlightYear}
              {#each sq.rings as ring (ring.year)}
                {@const offset = (sq.baseSide - ring.size) / 2}
                <rect
                  x={offset}
                  y={offset}
                  width={ring.size}
                  height={ring.size}
                  fill={sq.fill}
                  fill-opacity={inactive ? rectInactiveOpacity : yearOpacities[ring.year]}
                  stroke="#fff"
                  stroke-width={0.2 * fontScale}
                />
              {/each}
            {:else}
              <rect
                x={inset}
                y={inset}
                width={sq.side}
                height={sq.side}
                fill={sq.fill}
                fill-opacity={inactive ? rectInactiveOpacity : rectFillOpacity}
                stroke="#fff"
                stroke-width={0.5 * fontScale}
              />
            {/if}

            <!-- Labels: displaced beside the square -->
            {#if labelMode === 'displaced'}
              {@const key = sq.name?.toLowerCase()}
              {@const rawDir =
                (isMobile.current ? mobileLabelOffsets[key] : labelOffsets[key]) ?? 'right'}
              {@const dir = isMobile.current ? simplifyDir(rawDir) : rawDir}
              {@const stats = formatStats(sq.name)}
              {@const scaledDisplaced = displacedFontSize * fontScale}
              {@const lh = scaledDisplaced * 1.15}
              {@const displayText = isMobile.current
                ? [sq.name.toUpperCase()]
                : wrapLines(getLabel(sq.name) ?? sq.name, 0, scaledDisplaced, displacedMaxChars)}
              {@const pos = displacedAnchor(
                dir,
                visibleInset,
                visibleSide,
                displayText.length * lh,
                scaledDisplaced
              )}
              {@const displacedOpacity = inactive ? inactiveOpacity : displacedLabelOpacity}
              {@const labelY = isMobile.current
                ? sq.baseSide / 2 + scaledDisplaced * 0.35
                : pos.startY}
              <text
                class="displaced-label"
                text-anchor={pos.textAnchor}
                font-size={scaledDisplaced}
                font-weight={isMobile.current ? '800' : 'normal'}
                fill={isMobile.current ? 'var(--bw850)' : 'var(--bw700)'}
                opacity={displacedOpacity}
                style="cursor:pointer"
                onmouseenter={(e) => showTooltip(sq, e)}
                onmouseleave={() => hideTooltip()}
              >
                {#each displayText as line, i (i)}
                  <tspan x={pos.anchorX} y={labelY + i * lh}>{line}</tspan>
                {/each}
                {#if !isMobile.current && stats && sq.side < displacedStatsInsideMin}
                  <tspan font-weight="800"> {stats.pct}</tspan>
                {/if}
              </text>
              {#if !isMobile.current && stats && sq.side >= displacedStatsInsideMin}
                <text
                  text-anchor="middle"
                  font-size={scaledDisplaced}
                  font-weight="800"
                  fill="var(--bw850)"
                  opacity={displacedOpacity}
                  pointer-events="none"
                  x={pos.cx}
                  y={pos.cy + scaledDisplaced * 0.35}>{stats.pct}</text
                >
              {/if}

              <!-- Labels: motivo code inside the square (mobile small squares) -->
            {:else if labelMode === 'code'}
              {@const stats = formatStats(sq.name)}
              {@const scaledCode = 10 * fontScale}
              {@const cx = labelInset + labelSide / 2}
              {@const cy = labelInset + labelSide / 2}
              <text
                text-anchor="middle"
                font-size={scaledCode}
                font-weight="800"
                fill="var(--bw850)"
                opacity={labelOpacity}
                pointer-events="none"
                x={cx}
                y={cy + 3.5 * fontScale}>{sq.name.toUpperCase()}</text
              >

              <!-- Labels: full label centered inside the square -->
            {:else if labelMode === 'inline'}
              {@const stats = formatStats(sq.name)}
              {@const scaledInline = fontSize * fontScale}
              {@const lines = wrapLines(getLabel(sq.name), labelSide, scaledInline)}
              {@const totalLines = lines.length + (stats ? 1 : 0)}
              {@const lineHeight = scaledInline * 1.15}
              {@const cx = labelInset + labelSide / 2}
              {@const startY = labelInset + labelSide / 2 - ((totalLines - 1) * lineHeight) / 2}
              <text
                text-anchor="middle"
                font-size={scaledInline}
                fill="var(--bw850)"
                opacity={labelOpacity}
                pointer-events="none"
              >
                {#each lines as line, i (i)}
                  <tspan x={cx} y={startY + i * lineHeight}>{line}</tspan>
                {/each}
                {#if stats && sq.side >= displacedStatsInsideMin}
                  <tspan x={cx} y={startY + lines.length * lineHeight + 3} font-weight="800"
                    >{stats.pct}</tspan
                  >
                {/if}
              </text>
            {/if}
          </g>
        {/each}
      </svg>
      <ul class="legend" role="list">
        {#each legendOrder ?? [] as name (name)}
          {@const sq = squareLookup.get(name)}
          {@const info = causes[name.toLowerCase()]}
          {@const stats = sq ? formatStats(name) : null}
          {#if sq && info && isMobile.current && sq.side < mobileInlineSide}
            {@const inactive = isInactive(name)}
            <li class="legend-item" class:legend-inactive={inactive}>
              <span class="legend-code">{name.toUpperCase()}</span>
              {info.labelShort}
              {#if stats}
                <span class="legend-pct" style:color={sq.fill}>{stats.pct}</span>
              {/if}
            </li>
          {/if}
        {/each}
      </ul>
    </div>

    {#if tooltipSquare}
      <Tooltip
        name={tooltipSquare.name}
        yearBreakdown={tooltipSquare.yearBreakdown}
        yearTotals={tooltipSquare.yearTotals}
        {globalMaxPct}
        fillColor={tooltipSquare.fill}
        position={tooltipPosition}
        onclose={hideTooltip}
        {highlightYear}
      />
    {/if}
  </div>
{/if}

<style>
  .square-packing {
    max-width: 550px;
    margin: 0 auto;
    position: relative;
  }

  .packing-container {
    filter: none;
    transition: filter 0.3s;

    &.blur-background {
      filter: blur(4px) opacity(0.4);
    }
  }

  svg {
    display: block;
  }

  .node {
    transition: transform 0.4s ease-out;
  }

  rect {
    transition:
      x 0.4s ease-out,
      y 0.4s ease-out,
      width 0.4s ease-out,
      height 0.4s ease-out,
      fill-opacity 0.3s ease-out;
  }

  text {
    user-select: none;
  }

  .legend-item {
    font-size: 0.7rem;
    color: var(--bw600);
    line-height: 1.5;
  }

  .legend-code {
    font-weight: 600;
    color: var(--bw700);
  }

  .legend-pct {
    font-weight: 800;
  }

  .legend-inactive {
    opacity: 0.2;
  }

  .legend {
    color: var(--bw800);
    display: flex;
    flex-wrap: wrap;
    gap: 0.1rem 0.6rem;
    justify-content: center;
    margin-top: 1rem;
    list-style: none;
    padding: 0;
    margin-bottom: 0;
  }
</style>
