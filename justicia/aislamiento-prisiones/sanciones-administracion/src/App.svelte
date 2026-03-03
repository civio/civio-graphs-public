<script>
  // Svelte core
  import { onMount } from 'svelte';

  // States
  import { Data, proteccion, sancion } from './states/data.svelte';
  import { vizLang } from './states/language.svelte';
  import { urlInfo } from './states/utils.svelte';

  const chartData = new Data();

  // Utils
  import { mainColorsCSS, customColorsCSS, bwScaleCSS, appArea } from './utils/colors';

  // Components
  import ChartContainer from './lib/ChartContainer.svelte';
  import Footer from './lib/footer/Footer.svelte';

  // Props
  let { lang, chartID, a11y, alt, type } = $props();

  // a11y debug mode: activated via ?a11y URL param or data-a11y attribute
  let isA11yDebugMode = $derived(urlInfo.a11y || a11y);

  // alt mode: activated via ?alt URL param or data-alt attribute
  let isAltMode = $derived(urlInfo.alt || alt);

  // Load data onMount
  onMount(async () => {
    chartData.value = type === 'sancion' ? sancion : proteccion;

    vizLang.setLang(urlInfo.lang ?? lang);
  });
</script>

<div class:a11y-debug={isA11yDebugMode} class={!urlInfo.isCivio ? appArea : ''}>
  <div class:post-content={!urlInfo.isCivio} style="max-width: none;">
    <div class={!urlInfo.isCivio ? 'multimedia full-width' : ''}>
      <div style="max-width: 800px; margin: 0 auto; padding: 10px;">
        <h4>{@html vizLang.texts.title[type]}</h4>

        <ChartContainer {chartData} {type} />

        <Footer {chartID} {type} />
      </div>
    </div>
  </div>
</div>

{@html `<style>.${chartID.replace(/[^a-zA-Z0-9_-]/g, '')} { ${customColorsCSS};${mainColorsCSS};${bwScaleCSS}; }</style>`}

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

{#if urlInfo.url.hostname === 'graphs.civio.es'}
  {@html `<style>.post-content, .post-content .multimedia {margin-top: 0 !important}</style>`}
{/if}

<style>
  /* Common styles are already injected via main.min.css */
  * :global {
    h4 {
      margin: 0 0 1rem 0;

      span {
        background: var(--highlight-color);
        display: inline-block;
        padding: 0 0.5rem;
        border-radius: 0.25rem;
        color: white;
      }
    }

    /* a11y: Focus visible styles for keyboard navigation */
    :focus-visible {
      outline: 2px solid var(--bw850);
      outline-offset: 2px;
    }
  }
</style>
