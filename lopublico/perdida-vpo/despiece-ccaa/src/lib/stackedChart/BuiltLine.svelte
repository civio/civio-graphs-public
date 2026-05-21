<script>
  import { line } from 'd3';
  import { firstProjectionYear } from '../../states/chartConfig';

  const { sumData, scaleX, scaleY, curve, hoveredKey = null } = $props();

  const dimmed = $derived(hoveredKey !== null && hoveredKey !== 'built');

  const builtLine = $derived(
    line()
      .x((d) => scaleX(d.year))
      .y((d) => scaleY(d.built))
      .curve(curve)
  );

  const realData = $derived(sumData.filter((d) => d.year <= firstProjectionYear));
  const projectionData = $derived(sumData.filter((d) => d.year >= firstProjectionYear));
</script>

<path
  d={builtLine(realData)}
  fill="none"
  stroke="black"
  stroke-width="2"
  opacity={dimmed ? 0.2 : 1}
  style="transition: opacity 0.2s ease;"
/>
{#if projectionData.length > 1}
  <path
    d={builtLine(projectionData)}
    fill="none"
    stroke="black"
    stroke-width="2"
    stroke-dasharray="6 4"
    opacity={dimmed ? 0.2 : 1}
    style="transition: opacity 0.2s ease;"
  />
{/if}
