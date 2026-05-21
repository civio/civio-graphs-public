<script>
  import { fade } from 'svelte/transition';
  import { isMobile } from '../../states/utils.svelte';

  const { scaleX, scaleY, chartHeight, hoveredYear } = $props();

  const PROJECTION_YEAR = 2025;

  // Custom tick series: always shows the first year of the domain plus round-number
  // intermediates (every 10y mobile, 5y desktop). On desktop, 2025 (projection start)
  // is also pinned and nearby round ticks are dropped to avoid crowding.
  const visibleTicks = $derived.by(() => {
    const [start, end] = scaleX.domain();
    const mobile = isMobile.current;
    const step = mobile ? 10 : 5;
    const ticks = new Set();

    if (start + 1 <= end) ticks.add(start);
    if (!mobile && PROJECTION_YEAR >= start && PROJECTION_YEAR + 1 <= end) ticks.add(PROJECTION_YEAR);

    for (let y = Math.ceil(start / step) * step; y + 1 <= end; y += step) ticks.add(y);

    if (!mobile) {
      const keyYears = new Set([start, PROJECTION_YEAR].filter((y) => ticks.has(y)));
      return [...ticks]
        .sort((a, b) => a - b)
        .filter((t) => keyYears.has(t) || ![...keyYears].some((k) => k !== t && Math.abs(t - k) < step * 0.6));
    }

    return [...ticks].sort((a, b) => a - b);
  });

  function textOpacity(year) {
    const d = scaleX(year + 0.5) - Math.min(scaleX(hoveredYear + 0.5), scaleX.range()[1] - 20);
    if (d < 30 && -d < 30) return 0;
    return 0.4;
  }
</script>

<g>
  <line
    x1={scaleX.range()[0]}
    x2={scaleX.range()[1]}
    y1={scaleY.range()[0]}
    y2={scaleY.range()[0]}
    stroke="black"
    stroke-width="1.5"
  />
  {#each visibleTicks as tick (tick)}
    <text
      in:fade
      x={scaleX(tick + 0.5)}
      y={chartHeight}
      font-size="12"
      fill="var(--bw600)"
      text-anchor="middle"
      style:opacity={hoveredYear != null ? textOpacity(tick) : '1'}
    >
      {tick}
    </text>
  {/each}
  {#if hoveredYear != null}
    <text
      in:fade
      x={Math.min(scaleX(hoveredYear + 0.5), scaleX.range()[1] - 20)}
      y={chartHeight}
      font-size="16"
      fill="var(--bw600)"
      text-anchor="middle"
      font-weight="bold"
    >
      {hoveredYear}
    </text>
  {/if}
</g>

<style>
  text {
    transition: opacity 0.3s;
  }
</style>
