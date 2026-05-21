<script>
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { vizLang } from '../../states/language.svelte';
  import { prefersReducedMotion } from '../../states/utils.svelte';

  const { value } = $props();

  const tween = new Tween(0, { duration: 300, easing: cubicOut });

  $effect(() => {
    tween.set(value, { duration: prefersReducedMotion.current ? 0 : 300 });
  });
</script>

{vizLang.formatIntegers(Math.round(tween.current))}
