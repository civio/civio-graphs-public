<script>
  import { sortRows } from './plazos/sortRows.js';
  import IntroLegend from './plazos/IntroLegend.svelte';
  import PlazosGrid from './plazos/PlazosGrid.svelte';
  import PlazosTooltip from './plazos/PlazosTooltip.svelte';
  import PlazosA11y from './plazos/PlazosA11y.svelte';
  import { getPlazosA11y } from '../a11y';
  import { vizLang } from '../states/language.svelte.js';
  import { urlInfo } from '../states/utils.svelte.js';

  const { data } = $props();
  const sortedRows = $derived(sortRows(data?.rows ?? []));
  const a11yData = $derived(getPlazosA11y(sortedRows, vizLang));

  // In dossier mode every row is expanded upfront and no interaction is wired,
  // so the static PDF shows the full breakdown without needing JS to drive it.
  let expandedName = $state(urlInfo.print ? '__all__' : null);
  let tooltip = $state(null);
  const activeSub = $derived(tooltip ? { label: tooltip.label, ccaa: tooltip.ccaa } : null);

  function toggleExpand(name) {
    expandedName = expandedName === name ? null : name;
  }

  function positionFromEvent(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      anchorTop: rect.top,
      anchorBottom: rect.bottom,
    };
  }

  function showSubTooltip(event, sub, label, ccaa) {
    tooltip = { ...sub, label, ccaa, ...positionFromEvent(event) };
  }

  function hideTooltip() {
    tooltip = null;
  }

  $effect(() => {
    if (urlInfo.print) return;
    if (!tooltip) return;
    function handleOutside(event) {
      if (event.target.closest('.sub-row')) return;
      hideTooltip();
    }
    document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  });

  const noop = () => {};
</script>

<PlazosA11y data={a11yData} />

<div class="plazos-section" aria-hidden="true">
  {#if urlInfo.print}
    <p class="print-intro">
      Versión imprimible del gráfico interactivo: todas las filas aparecen
      desplegadas con el detalle por tipo de protección de cada comunidad.
    </p>
  {/if}
  <IntroLegend />
  <PlazosGrid
    rows={sortedRows}
    {expandedName}
    {activeSub}
    onToggle={urlInfo.print ? noop : toggleExpand}
    onSubHover={urlInfo.print ? noop : showSubTooltip}
    onLeave={urlInfo.print ? noop : hideTooltip}
  />
</div>

<style>
  .print-intro {
    margin: 0 0 1.5rem;
    padding: 0.6rem 0.9rem;
    border-left: 3px solid var(--primary, #f74383);
    background: var(--light, #ffecf6);
    font-size: 0.85rem;
    line-height: 1.4;
    color: var(--bw700, #444);
    border-radius: 3px;
  }
</style>

<PlazosTooltip
  data={tooltip}
  x={tooltip?.x ?? 0}
  anchorTop={tooltip?.anchorTop ?? 0}
  anchorBottom={tooltip?.anchorBottom ?? 0}
/>
