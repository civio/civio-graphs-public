<script>
  import { firstProjectionYear } from '../../states/steps.svelte';

  const { scaleX, chartHeight } = $props();

  const x = $derived(scaleX(firstProjectionYear));
  const xEnd = $derived(scaleX.range()[1]);
  const width = $derived(Math.max(0, xEnd - x));
</script>

{#if width > 0}
  <rect {x} y={0} {width} height={chartHeight} fill="white" opacity="0.5" />

  <line
    x1={x}
    x2={x}
    y1={0}
    y2={chartHeight}
    stroke="var(--bw600)"
    stroke-width="2"
    stroke-dasharray="6"
  />

  <!-- <line
    x1={x + 18}
    x2={xEnd - 18}
    y1={chartHeight + 12}
    y2={chartHeight + 12}
    stroke="var(--bw600)"
    stroke-width="1.5"
    stroke-dasharray="2 3"
  /> -->
{/if}
