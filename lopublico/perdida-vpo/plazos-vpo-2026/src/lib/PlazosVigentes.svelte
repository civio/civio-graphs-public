<script>
  import { sortRows } from './plazos/sortRows.js';
  import IntroLegend from './plazos/IntroLegend.svelte';
  import PlazosGrid from './plazos/PlazosGrid.svelte';
  import PlazosTooltip from './plazos/PlazosTooltip.svelte';
  import PlazosA11y from './plazos/PlazosA11y.svelte';
  import { getPlazosA11y } from '../a11y';
  import { vizLang } from '../states/language.svelte.js';

  const { data } = $props();
  const sortedRows = $derived(sortRows(data?.rows ?? []));
  const a11yData = $derived(getPlazosA11y(sortedRows, vizLang));

  let expandedName = $state(null);
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
    if (!tooltip) return;
    function handleOutside(event) {
      if (event.target.closest('.sub-row')) return;
      hideTooltip();
    }
    document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  });
</script>

<PlazosA11y data={a11yData} />

<div class="plazos-section" aria-hidden="true">
  <IntroLegend />
  <PlazosGrid
    rows={sortedRows}
    {expandedName}
    {activeSub}
    onToggle={toggleExpand}
    onSubHover={showSubTooltip}
    onLeave={hideTooltip}
  />
</div>

<PlazosTooltip
  data={tooltip}
  x={tooltip?.x ?? 0}
  anchorTop={tooltip?.anchorTop ?? 0}
  anchorBottom={tooltip?.anchorBottom ?? 0}
/>
