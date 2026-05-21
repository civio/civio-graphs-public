<script>
  // Svelte core
  import { onMount } from 'svelte';

  // States
  import { data } from './states/data.svelte';
  import { vizLang } from './states/language.svelte';
  import { urlInfo } from './states/utils.svelte';

  // Utils
  import { mainColorsCSS, projectColorsCSS, bwScaleCSS, appArea } from './utils/colors';

  // Components
  import ScrollContainer from './lib/ScrollContainer.svelte';
  import Footer from './lib/footer/Footer.svelte';

  // Props
  const { lang, chartID, a11y = false, alt = false } = $props();

  // a11y debug mode: activated via ?a11y URL param or data-a11y attribute
  const isA11yDebugMode = $derived(urlInfo.a11y || a11y);

  // alt mode: activated via ?alt URL param or data-alt attribute
  const isAltMode = $derived(urlInfo.alt || alt);

  // Load data onMount. Failures surface via reactive `data.error`.
  onMount(() => {
    vizLang.setLang(urlInfo.lang ?? lang);
    data.loadFromUrl('https://data.civio.es/lopublico/desaparicion-vpo/graficos/journalist.csv');
  });
</script>

<div class:a11y-debug={isA11yDebugMode} class={!urlInfo.isCivio ? appArea : ''}>
  <div class:post-content={!urlInfo.isCivio} style="max-width: none;">
    <div class={!urlInfo.isCivio ? 'multimedia full-width' : ''}>
      <div style="max-width: 800px; margin: 0 auto; padding: 10px;">
        <!-- reactive data example -->
        <h4>{vizLang.texts.title}</h4>
        <p class="subtitle" aria-hidden="true">
          {vizLang.texts.scrollHint}
          <svg
            class="scroll-arrow"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </p>
        {#if !data.loading}
          <ScrollContainer {isAltMode} />
        {/if}
        <Footer {chartID} />
      </div>
    </div>
  </div>
</div>

{@html `<style>#${chartID.replace(/[^a-zA-Z0-9_-]/g, '')} { ${mainColorsCSS};${projectColorsCSS};${bwScaleCSS}; }</style>`}

{#if isA11yDebugMode}
  {@html `<style>
    .a11y-debug .sr-only {
      position: relative;
      width: auto;
      max-width: 100%;
      height: auto;
      padding: 1rem;
      margin: 1rem 0;
      overflow-x: auto;
      clip: auto;
      white-space: normal;
      border: 2px solid red;
      background-color: #fff3cd;
      font-size: 0.9rem;
      /* .step has pointer-events: none so vertical scroll falls through to the
         sticky chart; re-enable it here so the horizontal scrollbar is usable. */
      pointer-events: auto;
    }
    /* Render the table at its natural width and let the .sr-only wrapper
       scroll horizontally so all columns are inspectable in debug. */
    .a11y-debug .sr-only table {
      width: max-content;
      border-collapse: collapse;
    }
    .a11y-debug .sr-only th,
    .a11y-debug .sr-only td {
      padding: 0.25rem 0.5rem;
      text-align: left;
      white-space: nowrap;
    }
    .a11y-debug [aria-hidden='true'] {
      /* Override component-defined opacity transitions (e.g. the interactive
         step's header/subtitle reaching opacity 1) so aria-hidden elements
         always look semi-transparent and the debug cue stays truthful. */
      opacity: 0.1 !important;
      border: 2px dashed blue;
      position: relative;
    }
    /* Expose the otherwise-invisible aria-label of labeled landmarks so the
       reviewer can see what a screen reader would announce on entering. */
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
    /* Sections have a fixed scrolly height; in debug mode let them grow with
       the visible sr-only content so descriptions don't overlap. */
    .a11y-debug .step,
    .a11y-debug .step:last-of-type {
      height: auto !important;
      min-height: 95dvh;
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

  .subtitle {
    font-size: 0.82rem;
    line-height: 1.45;
    color: var(--bw600);
    margin: 0 auto 0.85rem;
    text-align: center;
  }

  .scroll-arrow {
    vertical-align: middle;
    animation: scroll-hint-bounce 1.6s ease-in-out infinite;
  }

  @keyframes scroll-hint-bounce {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(4px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .scroll-arrow {
      animation: none;
    }
  }
</style>
