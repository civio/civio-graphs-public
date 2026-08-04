<script>
  import { severeFiresThreshold } from '../../states/data.svelte';
  import { vizLang } from '../../states/language.svelte';
  import FireBadge from './FireBadge.svelte';

  // Summary of the worst days + severe-days count, shown as the intro above
  // the chart (the per-year tooltip has its own reading strip)
  let { worstDays = [], severeDaysCount = 0 } = $props();

  let fires = $derived(worstDays[0]?.incendios_activos);
  let firesLabel = $derived(fires === 1 ? 'incendio registrado' : 'incendios registrados');
</script>

{#if worstDays.length > 0}
  <p class="worst-days-summary">
    {#if worstDays.length === 1}
      El peor día fue el
      <b>{vizLang.formatFullDate.format(worstDays[0].fecha)}</b>, con
      <FireBadge value={fires} />
      {firesLabel}.
    {:else}
      Ha habido
      <b>{worstDays.length} días</b> con
      <FireBadge value={fires} />
      {firesLabel}.
    {/if}
    {#if severeDaysCount > 0}
      Además, ha habido <FireBadge value={severeDaysCount} outlined />
      {severeDaysCount === 1 ? 'día' : 'días'} con más de {severeFiresThreshold} incendios registrados.
    {/if}
  </p>
{/if}

<style>
  .worst-days-summary {
    text-align: center;
    line-height: 1.7;
    margin-bottom: 0.5rem;
  }
</style>
