<script>
  import { fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { vizLang } from '../../states/language.svelte';
  import { prefersReducedMotion } from '../../states/utils.svelte';

  const { scaleX, scaleY, margin } = $props();

  const ticks = $derived(scaleY.ticks(4));

  const tickTransition = $derived(
    prefersReducedMotion.current ? { duration: 0 } : { duration: 400, easing: cubicOut }
  );

  function formatScaled(v) {
    return Number.isInteger(v) ? vizLang.formatIntegers(v) : vizLang.formatDecimals(v);
  }

  function formatTick(t) {
    if (t >= 1_000_000) return `${formatScaled(t / 1_000_000)}M`;
    if (t >= 1000) return `${formatScaled(t / 1000)}k`;
    return vizLang.formatIntegers(t);
  }
</script>

<g>
  {#each ticks as tick, i (tick)}
    <g in:fade={tickTransition}>
      <text
        x={margin.left - 5}
        y={scaleY(tick)}
        font-size="12"
        text-anchor="end"
        alignment-baseline="middle"
        fill="var(--bw400)"
      >
        {formatTick(tick)}
      </text>

      <line
        x1={scaleX.range()[0]}
        x2={scaleX.range()[1]}
        y1={Math.round(scaleY(tick)) - 1}
        y2={Math.round(scaleY(tick)) - 1}
        stroke="var(--bw200)"
        stroke-width="1"
      />
    </g>
  {/each}
</g>
