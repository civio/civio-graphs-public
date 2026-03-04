<script>
  // States
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
  import Footer from './lib/footer/Footer.svelte';
  import WaffleChart from './lib/WaffleChart.svelte';
  import Selector from './lib/Selector.svelte';

  // Props
  let { lang, chartID, a11y = false, alt = false } = $props();

  // a11y debug mode: activated via ?a11y URL param or data-a11y attribute
  let isA11yDebugMode = $derived(urlInfo.a11y || a11y);

  // alt mode: activated via ?alt URL param or data-alt attribute
  let isAltMode = $derived(urlInfo.alt || alt);

  let expanded = $state(false);

  const viewOptions = [
    { value: 'grouped', label: 'Agrupado' },
    { value: 'detail', label: 'En detalle' },
  ];

  let selectedView = $derived(expanded ? 'detail' : 'grouped');

  function handleViewChange(value) {
    expanded = value === 'detail';
  }
</script>

<div class:a11y-debug={isA11yDebugMode} class={!urlInfo.isCivio ? appArea : ''}>
  <div class:post-content={!urlInfo.isCivio} style="max-width: none;">
    <div class={!urlInfo.isCivio ? 'multimedia full-width' : ''}>
      <div style="max-width: 800px; margin: 0 auto; padding: 10px;">
        <!-- reactive data example -->
        <h4>{vizLang.texts.title}</h4>

        <div style="display:flex;justify-content:center;">
          <Selector
            options={viewOptions}
            selected={selectedView}
            onchange={handleViewChange}
            name="view-mode"
            legend="Modo de visualización"
          />
        </div>

        <WaffleChart {expanded} visible={isAltMode} />

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
    font-family: Lato, Arial, sans-serif;

    h4 {
      margin: 0 0 1rem 0;
    }

    /* a11y: Focus visible styles for keyboard navigation */
    :focus-visible {
      outline: 2px solid var(--bw850);
      outline-offset: 2px;
    }
  }
</style>
