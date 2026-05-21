<script>
  import { area } from 'd3';
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { SvelteMap } from 'svelte/reactivity';
  import { prefersReducedMotion } from '../../states/utils.svelte';

  const { sumData, scaleX, scaleY, curve, stackOrder, uid = '', hoveredKey = null } = $props();
  const patternId = $derived(`maybe-stripes${uid ? `-${uid}` : ''}`);
  const lostPatternId = $derived(`lost-stripes${uid ? `-${uid}` : ''}`);

  const tweenOpts = { duration: 600, easing: cubicOut };
  const areaTweens = new SvelteMap();
  function ensureTween(key, length) {
    let t = areaTweens.get(key);
    if (!t) {
      t = new Tween(Array.from({ length }).fill(0), tweenOpts);
      areaTweens.set(key, t);
    }
    return t;
  }

  const areaTargets = $derived(
    stackOrder.map((key, i) => {
      const lowerKeys = stackOrder.slice(0, i);
      const values = sumData.map((d) => {
        const lower = lowerKeys.reduce((s, k) => s + (d[k] ?? 0), 0);
        const upper = lower + (d[key] ?? 0);
        return { year: d.year, lower, upper };
      });
      const flat = values.flatMap((v) => [v.lower, v.upper]);
      return { key, values, flat };
    })
  );

  $effect(() => {
    for (const { key, flat } of areaTargets) {
      const t = ensureTween(key, flat.length);
      if (t.current.length !== flat.length || prefersReducedMotion.current) {
        t.set(flat, { duration: 0 });
      } else {
        t.set(flat);
      }
    }
    // Drop tweens for keys no longer in the current stackOrder
    // (protection ↔ plan swap) so they don't accumulate on view toggles.
    const keep = new Set(stackOrder);
    for (const key of areaTweens.keys()) {
      if (!keep.has(key)) areaTweens.delete(key);
    }
  });

  const tweenedAreas = $derived(
    areaTargets.map(({ key, values }) => {
      const flat = areaTweens.get(key)?.current ?? [];
      return {
        key,
        values: values.map((v, i) => ({
          year: v.year,
          lower: flat[i * 2] ?? 0,
          upper: flat[i * 2 + 1] ?? 0,
        })),
      };
    })
  );

  const areaGenerator = $derived(
    area()
      .x((d) => scaleX(d.year))
      .y0((d) => scaleY(d.lower))
      .y1((d) => scaleY(d.upper))
      .curve(curve)
  );
</script>

<defs>
  <pattern
    id={patternId}
    width="6"
    height="6"
    patternUnits="userSpaceOnUse"
    patternTransform="rotate(45)"
  >
    <rect width="6" height="6" fill="white" />
    <rect width="3" height="6" fill="var(--secondary)" />
  </pattern>
</defs>

{#each tweenedAreas as { key, values } (key)}
  <path
    d={areaGenerator(values)}
    stroke="white"
    stroke-width="1.5"
    data-key={key}
    fill={key === 'maybe' ? `url(#${patternId})` : undefined}
    opacity={hoveredKey !== null && hoveredKey !== key ? 0.2 : 0.85}
    style="transition: opacity 0.2s ease;"
  />
{/each}

<style>
  path[data-key='permanent'],
  path[data-key='estatal'],
  path[data-key='publico'],
  path[data-key='propiedad'] {
    fill: var(--civio-blue);
  }

  path[data-key='protected'],
  path[data-key='autonomico'],
  path[data-key='privado'],
  path[data-key='alquiler'] {
    fill: var(--primary);
  }

  path[data-key='sinAnimoLucro'],
  path[data-key='mixto'] {
    /* morado: A644A0 */
    fill: var(--secondary);
  }

  path[data-key='autopromotor'] {
    fill: var(--civio-yellow);
  }

  path[data-key='sinInfo'] {
    fill: var(--bw200);
  }

  path[data-key='lost'] {
    fill: var(--bw700);
  }
</style>
