<script>
  // Svelte core
  import { onMount } from 'svelte';

  // States
  import { data } from './states/data.svelte';
  import { vizLang } from './states/language.svelte';
  import { urlInfo } from './states/utils.svelte';

  // Utils
  import {
    customColorsCSS,
    mainColorsCSS,
    projectColorsCSS,
    bwScaleCSS,
    appArea,
  } from './utils/colors';
  // Components
  import SquarePacking from './lib/SquarePacking.svelte';
  import ScreenReaderDescription from './lib/ScreenReaderDescription.svelte';
  import Footer from './lib/footer/Footer.svelte';
  import Selector from './lib/Selector.svelte';

  // a11y
  import { buildMainChartA11y } from './a11y/mainChart.js';

  // Props
  let { lang, chartID, a11y = false, alt = false } = $props();

  // a11y debug mode: activated via ?a11y URL param or data-a11y attribute
  let isA11yDebugMode = $derived(urlInfo.a11y || a11y);

  // alt mode: activated via ?alt URL param or data-alt attribute
  let isAltMode = $derived(urlInfo.alt || alt);

  // a11y: reactive description + table for screen readers
  let a11yData = $derived(
    buildMainChartA11y({
      hierarchy: data.concentricHierarchy,
      causes: vizLang.texts.causes,
      years: data.availableYears,
      admLabel: vizLang.texts[data.selectedAdm.toLowerCase()],
      sexLabel: vizLang.texts.sexLabels[data.selectedSex],
      formatInt: vizLang.formatIntegers,
      a11yTexts: vizLang.texts.a11y,
    })
  );

  // Load data onMount
  onMount(async () => {
    try {
      await data.loadFromUrl(
        'https://data.civio.es/justicia/aislamiento-prisiones/motivos_aislamiento.csv?1'
      );

      vizLang.setLang(urlInfo.lang ?? lang);
    } catch {
      // Error loading data — silent in production
    }
  });
</script>

<div class:a11y-debug={isA11yDebugMode} class={!urlInfo.isCivio ? appArea : ''}>
  <div class:post-content={!urlInfo.isCivio} style="max-width: none;">
    <div class={!urlInfo.isCivio ? 'multimedia full-width' : ''}>
      <div style="max-width: 800px; margin: 0 auto; padding: 10px;">
        <h4>{vizLang.texts.title}</h4>

        {#if data.value && !data.loading}
          <div class="filters">
            <Selector
              name="adm"
              legend={vizLang.texts.selectorLegendAdm}
              options={data.availableAdms.map((adm) => ({
                value: adm,
                label: vizLang.texts[adm.toLowerCase()],
              }))}
              selected={data.selectedAdm}
              onchange={(adm) => data.selectAdm(adm)}
              color={`var(--${data.selectedAdm.toLowerCase()})`}
            />

            <Selector
              name="sex"
              legend={vizLang.texts.selectorLegendSex}
              options={[
                {
                  value: 'V',
                  label: vizLang.texts.sexMen,
                  sublabel: vizLang.formatCompact(data.totalsBySex['V']) + vizLang.texts.cases,
                },
                { value: '', label: vizLang.texts.sexAll },
                {
                  value: 'M',
                  label: vizLang.texts.sexWomen,
                  sublabel: vizLang.formatCompact(data.totalsBySex['M']) + vizLang.texts.cases,
                },
              ]}
              selected={data.selectedSex}
              onchange={(sex) => data.selectSex(sex)}
            />

            <div aria-hidden="true">
              <Selector
                name="year"
                legend={vizLang.texts.selectorLegendYear}
                options={data.availableYears.map((y) => ({
                  value: y,
                  label: y + (y === '2025' ? '*' : ''),
                }))}
                selected={data.selectedYear}
                onchange={(year) => data.selectYear(year)}
              />
            </div>
          </div>

          <div aria-live="polite" aria-atomic="true">
            <ScreenReaderDescription
              description={a11yData.description}
              title={a11yData.title}
              columns={a11yData.columns}
              items={a11yData.items}
              format="table"
              visible={isAltMode}
            />
          </div>

          <div aria-hidden="true">
            <SquarePacking
              layoutData={data.baseConcentricHierarchy}
              hierarchyData={data.concentricHierarchy}
              causes={vizLang.texts.causes}
              years={data.availableYears}
              highlightYear={data.selectedYear}
            />
          </div>
        {/if}

        <Footer {chartID} />
      </div>
    </div>
  </div>
</div>

{@html `<style>#${chartID.replace(/[^a-zA-Z0-9_-]/g, '')} { ${customColorsCSS};${mainColorsCSS};${projectColorsCSS};${bwScaleCSS}; }</style>`}

{#if isA11yDebugMode}
  {@html `<style>
    .a11y-debug .sr-only {
      position: relative;
      width: auto;
      height: auto;
      padding: 1rem;
      margin: 1rem 0;
      overflow: visible;
      clip: auto;
      white-space: normal;
      border: 2px solid red;
      background-color: #fff3cd;
      font-size: 0.9rem;
    }
    .a11y-debug [aria-hidden='true'] {
      opacity: 0.1;
      border: 2px dashed blue;
      position: relative;
    }
  </style>`}
{/if}

{#if isAltMode}
  {@html `<style>
    .alt-description {
      font-style: italic;
      margin-top: 2rem;
      padding: 1.5rem;
      background-color: #f8f9fa;
      border-left: 4px solid var(--primary);
      font-size: 0.95rem;
      line-height: 1.6;
    }
    .alt-description p {
      margin: 0;
    }
  </style>`}
{/if}

<style>
  /* Common styles are already injected via main.min.css */
  * :global {
    h4 {
      margin: 0 0 1rem 0;
    }

    /* a11y: Focus visible styles for keyboard navigation */
    :focus-visible {
      outline: 2px solid var(--bw850);
      outline-offset: 2px;
    }
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1.2rem 1.7rem;
    margin-bottom: 0;
  }
</style>
