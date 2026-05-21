<script>
  import { line } from 'd3';
  import { draw } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { firstProjectionYear } from '../../states/steps.svelte';
  import { prefersReducedMotion } from '../../states/utils.svelte';

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

  const inDrawOpts = $derived(
    prefersReducedMotion.current ? { duration: 0 } : { duration: 900, easing: cubicOut }
  );
  const outDrawOpts = $derived(
    prefersReducedMotion.current ? { duration: 0 } : { duration: 300, easing: cubicOut }
  );
</script>

<path
  in:draw={inDrawOpts}
  out:draw={outDrawOpts}
  d={builtLine(realData)}
  fill="none"
  stroke="black"
  stroke-width="2"
  opacity={dimmed ? 0.2 : 1}
  style="transition: opacity 0.2s ease;"
/>
{#if projectionData.length > 1}
  <path
    in:draw={{ ...inDrawOpts, delay: inDrawOpts.duration }}
    d={builtLine(projectionData)}
    fill="none"
    stroke="black"
    stroke-width="2"
    stroke-dasharray="6 4"
    opacity={dimmed ? 0.2 : 1}
    style="transition: opacity 0.2s ease;"
  />
{/if}
