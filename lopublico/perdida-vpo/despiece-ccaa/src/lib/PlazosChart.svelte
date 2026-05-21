<script>
  import { setContext } from 'svelte';
  import { fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { vizLang } from '../states/language.svelte.js';
  import { urlInfo } from '../states/utils.svelte.js';
  import { plazosData } from '../states/plazosData.svelte.js';
  import { getCcaaPlazosA11y } from '../a11y';

  import IntroLegend from './plazosChart/IntroLegend.svelte';
  import Tooltip from './plazosChart/Tooltip.svelte';
  import SubRow from './plazosChart/SubRow.svelte';
  import NormaTrack from './plazosChart/NormaTrack.svelte';
  import ScreenReaderDescription from './ScreenReaderDescription.svelte';
  import { entryGroupsForRowName, buildSubRows } from './plazosChart/plazosUtils.js';
  import { subColor } from './plazosChart/colorScale.js';
  import Footer from './footer/Footer.svelte';
  import { isMobile } from '../states/utils.svelte.js';
  import TouchIcon from './TouchIcon.svelte';

  const { ccaa, chartID, active = true } = $props();

  const data = $derived(plazosData.detail);
  const entriesData = $derived(plazosData.entries);
  const years = $derived(data?.years ?? []);
  const row = $derived(data?.rows?.find((r) => r.name === ccaa));
  const firstYear = $derived(years[0] ?? 1991);
  const lastYear = $derived(years[years.length - 1] ?? 2026);

  // Screen-reader description(s): one for protection periods, optionally a
  // second one for the legislation listing. Returned as an array so we can
  // render multiple `<ScreenReaderDescription>` blocks per chart.
  const ccaaEntries = $derived((entriesData?.entries ?? []).filter((e) => e.ccaa === ccaa));
  const a11yBlocks = $derived(
    getCcaaPlazosA11y(vizLang, {
      ccaa: vizLang.texts.ccaas[ccaa] ?? ccaa,
      ccaaTitle: vizLang.texts.ccaasWithArticle[ccaa] ?? ccaa,
      row,
      entries: ccaaEntries,
      firstYear,
      lastYear,
    })
  );

  let tooltip = $state(null);
  let chartContainerEl = $state(null);
  // Hover-bridge: el cierre por pointerleave en bar/dot se difiere unos ms.
  // Si el cursor entra en el tooltip antes, se cancela. Permite mover el
  // ratón del elemento al botón de "Ver fuente" sin que se cierre.
  let closeTimer = null;
  const closeDelayMs = 120;

  // Grid columns: column 1 = sticky labels, columns 2..N+1 = years.
  const labelCols = 1;
  function yearToCol(year) {
    return Math.max(year, firstYear) - firstYear + labelCols + 1;
  }
  function entryStartCol(e) {
    return yearToCol(Math.max(e.startYear, firstYear));
  }
  function entryEndCol(e) {
    return yearToCol(Math.min(e.endYear, lastYear)) + 1;
  }

  function cancelClose() {
    if (closeTimer != null) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
  }
  function scheduleClose() {
    cancelClose();
    closeTimer = setTimeout(() => {
      tooltip = null;
      closeTimer = null;
    }, closeDelayMs);
  }
  function closeNow() {
    cancelClose();
    tooltip = null;
  }
  function showTooltip(event, payload) {
    cancelClose();
    const rect = event.currentTarget.getBoundingClientRect();
    tooltip = {
      data: payload,
      x: rect.left + rect.width / 2,
      anchorTop: rect.top,
      anchorBottom: rect.bottom,
    };
  }

  // Bloqueo de scroll mientras hay tooltip abierto (sólo en dispositivos
  // sin hover real — móvil/tablet). En desktop, abrir tooltip al hacer hover
  // y bloquear scroll sería desastroso.
  $effect(() => {
    if (!tooltip) return;
    document.body.classList.add('plazos-tooltip-open');
    return () => document.body.classList.remove('plazos-tooltip-open');
  });

  // Cuando el chart deja de estar activo (cambio de CCAA), cerrar cualquier
  // tooltip abierto. El tooltip se portaliza a .ccaa-content, fuera del
  // .ccaa-block que recibe display:none, así que sin esto persiste visible.
  $effect(() => {
    if (!active) {
      cancelClose();
      tooltip = null;
    }
  });
  function handleSubPointerEnter(event, span, label, ccaaId) {
    showTooltip(event, { kind: 'sub', ...span, label, ccaa: ccaaId });
  }
  function handleNormaPointerEnter(event, entry) {
    showTooltip(event, { kind: 'norma', entry });
  }
  function handlePointerLeave(event) {
    // En táctil, pointerleave salta al levantar el dedo y haría desaparecer
    // el tooltip antes de poder leerlo. El cierre se hace tocando fuera.
    if (event?.pointerType === 'touch') return;
    scheduleClose();
  }

  setContext('plazosChart', {
    get years() {
      return years;
    },
    get lastYear() {
      return lastYear;
    },
    yearToCol,
    entryStartCol,
    entryEndCol,
    handleSubPointerEnter,
    handleNormaPointerEnter,
    handlePointerLeave,
  });

  // Flat row list for the single CCAA: sub-rows (one per housing type) +
  // (if any) a section label + one norma-track per legislation category.
  const flatRows = $derived.by(() => {
    if (!row) return [];
    const result = [];
    for (const sr of buildSubRows(row, lastYear)) {
      result.push({ type: 'sub', ccaaName: row.name, ...sr });
    }
    const groups = entryGroupsForRowName(entriesData, firstYear, row.name);
    if (groups.length > 0) {
      result.push({ type: 'norma-section-label', ccaaName: row.name });
      for (const group of groups) {
        result.push({
          type: 'norma-track',
          ccaaName: row.name,
          category: group.category,
          entries: group.entries,
        });
      }
    }
    return result;
  });

  // Color of the first vigente row, used to tint IntroLegend so the
  // "histórico/VIGENTE" example matches the top bar of this CCAA's chart.
  const firstCurrentColor = $derived.by(() => {
    if (!row) return null;
    const subs = buildSubRows(row, lastYear);
    const firstCurrent = subs.find((s) => s.isCurrent);
    if (!firstCurrent) return null;
    const span =
      firstCurrent.spans.find((sp) => sp.endYear === lastYear) ??
      firstCurrent.spans[firstCurrent.spans.length - 1];
    return span ? subColor(span) : null;
  });

  const labeledYears = $derived(
    years.filter((y) => {
      const step = isMobile.current ? 10 : 5;
      if (y === lastYear) return true;
      if (y === lastYear - 1) return false;
      if (y === years[0]) return lastYear - y > 2;
      if (y % step === 0) return true;
      return false;
    })
  );

  const vlineYears = $derived(
    years.filter((y) => {
      const step = isMobile.current ? 10 : 5;
      return y % step === 0 && y !== firstYear && y !== lastYear;
    })
  );

  function rowKey(r) {
    if (r.type === 'sub') return `sub-${r.ccaaName}-${r.label}`;
    if (r.type === 'norma-track') return `norma-track-${r.ccaaName}-${r.category}`;
    return `${r.type}-${r.ccaaName}`;
  }
</script>

{#if data && entriesData && row}
  <div class="plazos-ccaa-chart">
    <h4 class="title">
      {#if ccaa === 'estatal'}
        {vizLang.texts.plazosChart.titleEstatal}
      {:else}
        {vizLang.texts.plazosChart.titleCcaa(vizLang.texts.ccaasWithArticle[ccaa])}
      {/if}
    </h4>

    {#each a11yBlocks as block, i (i)}
      <ScreenReaderDescription {...block} visible={urlInfo.alt} />
    {/each}

    <div aria-hidden="true">
      <IntroLegend exampleColor={firstCurrentColor} />

      <div class="chart-container" bind:this={chartContainerEl}>
        <p class="subtitle">
          <TouchIcon variant="light" />
          {vizLang.texts.plazosChart.hoverHint(isMobile.current)}
        </p>
        <div
          class="grid"
          style:--cols={years.length}
          style:--total-rows={flatRows.length}
          in:fade={{ duration: 320, easing: cubicOut }}
        >
          <!-- blank space -->
          <div class="corner">
            <span>{vizLang.texts.plazosChart.housingTypesLabel}</span>
          </div>

          <!-- years -->
          {#each labeledYears as year (year)}
            <div
              class={['year', year === lastYear && 'current']}
              style:grid-column={yearToCol(year)}
            >
              {year}
            </div>
          {/each}

          <!-- vertical lines -->
          {#each vlineYears as year (year)}
            <div
              class="vline"
              style:grid-column={yearToCol(year)}
              style:grid-row="2 / {flatRows.length + 2}"
              aria-hidden="true"
            ></div>
          {/each}

          <!-- Elements -->
          {#each flatRows as r, ri (rowKey(r))}
            {@const gridRow = ri + 2}

            <!-- Barras -->
            {#if r.type === 'sub'}
              <SubRow row={r} {gridRow} />

              <!-- Label legislación -->
            {:else if r.type === 'norma-section-label'}
              <div
                class="label"
                style:grid-row={gridRow}
                style:grid-column="1 / -1"
                aria-hidden="true"
              >
                {vizLang.texts.plazosChart.lawsLabel}
              </div>

              <!-- Leglislaciones -->
            {:else if r.type === 'norma-track'}
              <NormaTrack row={r} {gridRow} />
            {/if}
          {/each}
        </div>
        <Footer embedID="{chartID}-{ccaa}-laws" source={vizLang.texts.sources.plazosChartCcaa} />
      </div>
    </div>
  </div>
{/if}

{#if tooltip}
  <Tooltip
    data={tooltip.data}
    x={tooltip.x}
    anchorTop={tooltip.anchorTop}
    anchorBottom={tooltip.anchorBottom}
    {lastYear}
    {chartID}
    chartContainer={chartContainerEl}
    onPointerEnter={cancelClose}
    onPointerLeave={handlePointerLeave}
    onClose={closeNow}
  />
{/if}

<style>
  * :global {
    font-family: Lato;
  }

  /* Bloquea scroll del documento sólo en dispositivos sin hover real. */
  @media (hover: none) {
    :global(body.plazos-tooltip-open) {
      overflow: hidden;
    }
  }

  .plazos-ccaa-chart {
    margin-top: 3rem;
    margin-bottom: 3rem;
    max-width: 800px;
    margin-inline: auto;
  }

  .title {
    font-size: clamp(1rem, 2.2vw, 1.25rem);
    font-weight: 700;
    margin: 0 auto 0.5rem;
    color: var(--bw900);
    letter-spacing: -0.01em;
    text-align: center;
    max-width: 700px;
    &:before {
      display: none;
    }
  }

  .grid {
    /* ⇩ Ancho de la primera columna (etiquetas: tipologías y categorías). */
    --label-col-width: 200px;
    display: grid;
    grid-template-columns: var(--label-col-width) repeat(var(--cols), minmax(0, 1fr));
    grid-auto-rows: auto;
  }

  .corner {
    grid-column: 1;
    grid-row: 1;
    background: transparent;
    position: sticky;
    left: 0;
    z-index: 3;

    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--bw500);
    pointer-events: none;
  }

  .year {
    grid-row: 1;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.6rem;
    color: var(--bw500);
    white-space: nowrap;
    /* Allow the label text to overflow into adjacent columns; matters most for
       the last labeled year so it doesn't get clipped by its own narrow column. */
    overflow: visible;
    transform: translateX(-50%);
  }

  .year.current {
    font-size: 0.72rem;
    font-weight: 800;
    color: var(--bw900);
  }

  .vline {
    pointer-events: none;
    z-index: 2;
    border-left: 1px solid rgba(0, 0, 0, 0.07);
  }

  .label {
    padding: 0 0 0 8px;
    margin-top: 12px;
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--bw500);
    pointer-events: none;
    background: var(--bw50);
  }

  @media (max-width: 640px) {
    .grid {
      --label-col-width: 130px;
    }
  }
</style>
