<script>
  import { visibility } from '../../states/steps.svelte';

  const { hoveredYear, hoveredRow, scaleX, scaleY, step, stackOrder, getAreaKeys } = $props();

  const yearStart = $derived(hoveredYear === null ? 0 : scaleX(hoveredYear));
  const yearEnd = $derived(hoveredYear === null ? 0 : scaleX(hoveredYear + 1));
  const yearCenter = $derived((yearStart + yearEnd) / 2);

  const areaCircles = $derived.by(() => {
    if (!hoveredRow) return [];
    return stackOrder
      .map((key, i) => {
        const sumKeys = getAreaKeys(key, step);
        if (sumKeys.length === 0) return null;
        const lowerKeys = stackOrder.slice(0, i).flatMap((k) => getAreaKeys(k, step));
        const lower = lowerKeys.reduce((s, k) => s + (hoveredRow[k] ?? 0), 0);
        const upper = lower + sumKeys.reduce((s, k) => s + (hoveredRow[k] ?? 0), 0);
        const value = sumKeys.reduce((s, k) => s + (hoveredRow[k] ?? 0), 0);
        return { key, value, upper };
      })
      .filter((c) => c && c.value > 0);
  });
</script>

{#if hoveredRow && step >= visibility.builtLine}
  <g pointer-events="none">
    <rect
      class="year-rect"
      x={yearStart}
      y={scaleY.range()[1]}
      width={yearEnd - yearStart}
      height={scaleY.range()[0] - scaleY.range()[1]}
    />

    <!-- Built line -->
    <line
      x1={yearCenter}
      y1={scaleY(hoveredRow.built) - 4}
      x2={yearCenter}
      y2={scaleY(hoveredRow.built) + 4}
      stroke="black"
      stroke-width="2"
    />

    {#each areaCircles as { key, upper } (key)}
      <circle
        cx={yearCenter}
        cy={scaleY(upper)}
        r="4"
        class="area-dot"
        data-key={key}
        stroke="white"
        stroke-width="1.5"
      />
    {/each}
  </g>
{/if}

<style>
  .year-rect {
    fill: var(--bw600);
    fill-opacity: 0.12;
  }
  .area-dot[data-key='permanent'],
  .area-dot[data-key='estatal'],
  .area-dot[data-key='publico'],
  .area-dot[data-key='propiedad'] {
    fill: var(--civio-blue);
  }
  .area-dot[data-key='protected'],
  .area-dot[data-key='autonomico'],
  .area-dot[data-key='privado'],
  .area-dot[data-key='alquiler'] {
    fill: var(--primary);
  }
  .area-dot[data-key='maybe'],
  .area-dot[data-key='mixto'],
  .area-dot[data-key='sinAnimoLucro'] {
    fill: var(--secondary);
  }
  .area-dot[data-key='autopromotor'] {
    fill: var(--civio-yellow);
  }
  .area-dot[data-key='sinInfo'] {
    fill: var(--bw400);
  }
  .area-dot[data-key='lost'] {
    fill: var(--bw700);
  }
</style>
