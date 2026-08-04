<script>
  // Svelte core
  import { onMount } from 'svelte';

  // States
  import { data } from './states/data.svelte';
  import { urlInfo } from './states/utils.svelte';
  import { vizLang } from './states/language.svelte';

  // Utils
  import {
    customColorsCSS,
    mainColorsCSS,
    projectColorsCSS,
    bwScaleCSS,
  } from './utils/colors.svelte';

  // Components
  import Heatmap from './lib/chart/Heatmap.svelte';
  import RegionSelector from './lib/ui/RegionSelector.svelte';
  import WorstDaysSummary from './lib/ui/WorstDaysSummary.svelte';
  import ScreenReaderDescription from './lib/ui/ScreenReaderDescription.svelte';
  import DayByDayList from './lib/ui/DayByDayList.svelte';
  import Footer from './lib/footer/Footer.svelte';

  // a11y
  import { getMainChartA11y, getDayByDayA11y, fill } from './a11y';

  // Props
  let { lang, chartID, a11y = false, alt = false } = $props();

  // a11y: reactive chart description based on language and data
  let mainChartA11y = $derived(getMainChartA11y(vizLang, data.selectedRegion, data.selectedData));

  // a11y: day-by-day disclosure, the keyboard/SR alternative to the tooltip
  let dayByDayA11y = $derived(getDayByDayA11y(vizLang, data.selectedRegion, data.selectedData));

  // a11y: announced politely whenever the selected region changes
  let regionStatus = $derived(
    data.selectedRegion
      ? fill(vizLang.texts.a11y.regionStatus, { region: data.selectedRegion })
      : ''
  );

  // a11y debug mode: activated via ?a11y URL param or data-a11y attribute
  let isA11yDebugMode = $derived(urlInfo.a11y || a11y);

  // alt mode: activated via ?alt URL param or data-alt attribute
  let isAltMode = $derived(urlInfo.alt || alt);

  // Load data onMount
  onMount(async () => {
    try {
      await data.load();

      vizLang.setLang(urlInfo.lang ?? lang);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  });
</script>

<!-- <RenderScan initialEnabled={false} /> -->

<!--
  Civio article wrappers (.post-content, .multimedia.full-width, area class)
  now live in index.html so the standalone preview matches the embed. App only
  owns the a11y-debug wrapper and the chart content.
-->
<!-- position: relative so the chart's Tooltip overlay covers the whole
   project (title, selector, chart and footer), not just the chart -->
<div class={['app-container', isA11yDebugMode && 'a11y-debug']}>
  <h4>{vizLang.texts.title}</h4>

  <!-- a11y: live region announcing region changes. Always in the DOM so
     assistive tech registers it before its content first changes -->
  <div class="sr-only" role="status">{regionStatus}</div>

  {#if data.error}
    <div role="alert" style="color: red;">Error: {data.error}</div>
  {:else if data.value !== undefined}
    <RegionSelector />

    <WorstDaysSummary worstDays={data.worstDays} severeDaysCount={data.severeDaysCount} />

    <!-- A11Y: SR reads the description + day-by-day disclosure first; the
       visual chart below is aria-hidden -->
    <ScreenReaderDescription {...mainChartA11y} visible={isAltMode} />
    <DayByDayList {...dayByDayA11y} />
    <Heatmap data={data.selectedData} maxValue={data.maxActiveFires} />
  {:else if data.loading}
    <div role="status" aria-live="polite">Cargando datos...</div>
  {/if}

  <Footer {chartID} />
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
      text-wrap: balance;
    }

    /* a11y: Focus visible styles for keyboard navigation */
    :focus-visible {
      outline: 2px solid var(--bw850);
      outline-offset: 2px;
    }
  }

  .app-container {
    position: relative;
  }

  /* a11y: honour the user's reduced-motion preference globally */
  @media (prefers-reduced-motion: reduce) {
    :global(*),
    :global(*::before),
    :global(*::after) {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
</style>
