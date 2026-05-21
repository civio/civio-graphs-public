<script>
  import { onMount } from 'svelte';

  // States
  import { vizLang } from './states/language.svelte.js';
  import { urlInfo } from './states/utils.svelte.js';
  import { plazosData } from './states/plazosData.svelte.js';
  // Utils
  import { mainColorsCSS, projectColorsCSS, bwScaleCSS, appArea } from './utils/colors';

  // Components
  import PlazosVigentes from './lib/PlazosVigentes.svelte';
  import Footer from './lib/footer/Footer.svelte';

  // Props
  const { lang, chartID, a11y = false, alt = false } = $props();

  const embedded = $derived(!urlInfo.isCivio);

  // a11y debug mode: activated via ?a11y URL param or data-a11y attribute
  const isA11yDebugMode = $derived(urlInfo.a11y || a11y);

  // alt mode: activated via ?alt URL param or data-alt attribute. Renders a
  // single visible block with the chart description for journalists to copy.
  const isAltMode = $derived(urlInfo.alt || alt);

  onMount(() => {
    plazosData.load();
    vizLang.setLang(urlInfo.lang ?? lang);
  });
</script>

<div class={[isA11yDebugMode && 'a11y-debug']}>
  <div class="chart-plazos-vigentes-container">
    {#if plazosData.loading}
      <div role="status" aria-live="polite" class="chart_status">
        {vizLang.texts.chart.loading}
      </div>
    {:else if plazosData.error}
      <div role="alert" class="chart_status chart_status--error">
        {vizLang.texts.chart.error(plazosData.error)}
      </div>
    {/if}

    {#if plazosData.detail}
      <PlazosVigentes data={plazosData.detail} />
    {/if}

    {#if isAltMode}
      <div class="alt-description">
        <p>👁️‍🗨️ ALT: {vizLang.texts.a11y.description}</p>
      </div>
    {/if}

    <Footer {chartID} />
  </div>
</div>

{@html `<style>#${chartID.replace(/[^a-zA-Z0-9_-]/g, '')} { ${mainColorsCSS};${projectColorsCSS};${bwScaleCSS}; }</style>`}

<!-- {#if embedded}
  {@html `<style>.post-content {margin: 0 !important} .post-content .full-width {margin-top: 0 !important}</style>`}
{/if} -->

{#if isA11yDebugMode}
  {@html `<style>
    /* .sr-only here is component-scoped (PlazosA11y) so its specificity ties
       with this global rule. Force the debug-visible state so it always wins
       and ?a11y faithfully mirrors what the screen reader perceives. */
    .a11y-debug .sr-only {
      position: relative !important;
      width: auto !important;
      height: auto !important;
      padding: 1rem !important;
      margin: 1rem 0 !important;
      overflow: visible !important;
      clip: auto !important;
      white-space: normal !important;
      border: 2px solid red;
      background-color: #fff3cd;
      font-size: 0.9rem;
    }
    .a11y-debug [aria-hidden='true'] {
      opacity: 0.1 !important;
      border: 2px dashed blue;
      position: relative;
    }
    .a11y-debug section[aria-label]::before {
      content: attr(aria-label);
      display: block;
      padding: 0.5rem 1rem;
      margin: 1rem 0;
      border: 2px solid green;
      background-color: #d4edda;
      font-size: 0.9rem;
      font-weight: bold;
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
  * :global {
    :focus-visible {
      outline: 2px solid var(--bw850);
      outline-offset: 2px;
    }
  }

  .chart-plazos-vigentes-container {
    max-width: 650px;
    margin-inline: auto;
  }

  .chart_status {
    padding: 1rem;
    background: var(--bw50);
    color: var(--bw700);
    border-radius: 6px;
    font-size: 0.9rem;
  }

  .chart_status--error {
    background: #ffe8e8;
    color: #8a1f1f;
  }

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
