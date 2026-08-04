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
  } from './utils/colors.svelte';

  // Components
  import FiresTable from './lib/FiresTable.svelte';
  import ScreenReaderDescription from './lib/ScreenReaderDescription.svelte';
  import Footer from './lib/footer/Footer.svelte';

  // a11y
  import { getMainChartA11y } from './a11y';

  // Props
  let { lang, chartID, a11y = false, alt = false } = $props();

  // a11y: reactive chart description based on language
  let mainChartA11y = $derived(getMainChartA11y(vizLang));

  // a11y debug mode: activated via ?a11y URL param or data-a11y attribute
  let isA11yDebugMode = $derived(urlInfo.a11y || a11y);

  // alt mode: activated via ?alt URL param or data-alt attribute
  let isAltMode = $derived(urlInfo.alt || alt);

  // Load data onMount
  onMount(async () => {
    try {
      // Usually from civio-data repository (pointing to https://data.civio.es/...)
      await data.loadFromUrl(
        'https://data.civio.es/espanaenllamas/fires-map/dias_negros/incendios_por_dia_provincia.csv'
      );

      vizLang.setLang(urlInfo.lang ?? lang);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  });
</script>

<!--
  Civio article wrappers (.post-content, .multimedia.full-width, area class)
  now live in index.html so the standalone preview matches the embed. App only
  owns the a11y-debug wrapper and the chart content.
-->
<div class:a11y-debug={isA11yDebugMode}>
  <h4>{vizLang.texts.title}</h4>

  <section>
    <FiresTable />
    <ScreenReaderDescription {...mainChartA11y} visible={isAltMode} />
  </section>

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
