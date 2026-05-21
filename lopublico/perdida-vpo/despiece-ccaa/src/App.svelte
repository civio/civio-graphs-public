<script>
  import { flushSync, mount, onDestroy, onMount, unmount } from 'svelte';

  import { ccaa } from './states/ccaa.svelte';
  import { urlInfo, selector, prefersReducedMotion, chartLayout } from './states/utils.svelte';
  import { inView } from './utils/inView.svelte';
  import { swipe } from './utils/swipe.svelte';
  import { housesData } from './states/housesData.svelte';
  import { plazosData } from './states/plazosData.svelte';
  import { vizLang } from './states/language.svelte';

  import { customColorsCSS, mainColorsCSS, projectColorsCSS, bwScaleCSS } from './utils/colors';

  import CcaaSelector from './lib/CcaaSelector.svelte';
  import StackedChart from './lib/StackedChart.svelte';
  import PlazosChart from './lib/PlazosChart.svelte';
  import NavButtons from './lib/NavButtons.svelte';
  import ScrollUpButton from './lib/ScrollUpButton.svelte';

  let { lang, chartID, ccaaSections = [], embed = null } = $props();

  let contentContainer = $state(null);
  let mountedComponents = [];
  // Solo la CCAA activa tiene charts montados. Acumular 38 charts (19 CCAAs ×
  // 2 charts) reventaba la pestaña en móvil tras varias navegaciones. Cada
  // cambio de CCAA desmonta los charts anteriores y monta los nuevos; el coste
  // (~50–100ms) lo absorbe el view-transition crossfade.
  let mountedChartsFor = { id: null, apps: [] };
  let selectorInView = $state(true);

  function withTransition(fn, direction = null) {
    const run = () => flushSync(fn);
    if (!document.startViewTransition || prefersReducedMotion.current) return run();
    if (direction) document.documentElement.dataset.ccaaDirection = direction;
    const transition = document.startViewTransition(run);
    transition.finished.finally(() => {
      delete document.documentElement.dataset.ccaaDirection;
    });
  }

  function navigate(direction, { focus = false } = {}) {
    if (direction === 'prev') withTransition(() => ccaa.prev(), 'prev');
    else if (direction === 'next') withTransition(() => ccaa.next(), 'next');
    if (contentContainer) {
      contentContainer.style.scrollMarginTop =
        direction === 'top' ? `${selector.height + 85}px` : ''; // 85px for Civio's menu
      contentContainer.scrollIntoView({
        behavior: prefersReducedMotion.current ? 'auto' : 'smooth',
        block: 'start',
      });
      if (focus) {
        const heading = ccaa.selected?.headingElement;
        (heading ?? contentContainer).focus({ preventScroll: true });
      }
    }
  }

  const chartMounts = $derived(
    embed
      ? [
          embed.chart === 'laws'
            ? { selector: '[laws-chart]', component: PlazosChart }
            : { selector: '[area-chart]', component: StackedChart },
        ]
      : [
          { selector: '[area-chart]', component: StackedChart },
          { selector: '[laws-chart]', component: PlazosChart },
        ]
  );

  function mountChartsFor(section) {
    const apps = [];
    for (const { selector, component } of chartMounts) {
      section.element.querySelectorAll(selector).forEach((node) => {
        apps.push(
          mount(component, {
            target: node,
            props: { ccaa: section.id, chartID, active: true },
          })
        );
      });
    }
    return apps;
  }

  function unmountCurrentCharts() {
    for (const app of mountedChartsFor.apps) unmount(app);
    mountedChartsFor.apps = [];
    mountedChartsFor.id = null;
  }

  // Single ResizeObserver shared by every Chart, attached via Svelte 5's
  // {@attach} so its lifecycle is tied to the element it observes. Mirrors
  // the .chart-container CSS rule (which subtracts the .ccaa-block padding
  // and border) so the SVG width never exceeds its visual container.
  function observeWidth(node) {
    const update = () => {
      const block = node.querySelector('.ccaa-block');
      let inset = 0;
      if (block) {
        const s = getComputedStyle(block);
        inset =
          parseFloat(s.paddingLeft) +
          parseFloat(s.paddingRight) +
          parseFloat(s.borderLeftWidth) +
          parseFloat(s.borderRightWidth);
      }
      const w = Math.min(node.clientWidth - inset, 760);
      if (w > 0) chartLayout.containerWidth = w;
    };
    const ro = new ResizeObserver(update);
    ro.observe(node);
    update();
    return () => ro.disconnect();
  }

  onMount(async () => {
    vizLang.setLang(urlInfo.lang ?? lang);
    housesData.loadFromUrl(
      `https://data.civio.es/lopublico/desaparicion-vpo/graficos/journalist.csv?t=${new Date().getTime()}`
    );
    plazosData.load();

    if (ccaaSections.length > 0) {
      // Prepare sections (DOM only — charts are mounted on demand below).
      ccaaSections.forEach((s) => {
        // Wrap each section in a block so we can apply view-transition-name to
        // the active one and let the browser crossfade between CCAAs
        const block = document.createElement('div');
        block.className = embed ? 'ccaa-block embed' : 'ccaa-block';
        block.dataset.ccaaId = s.id;
        block.setAttribute('role', 'region');
        contentContainer.appendChild(block);
        block.appendChild(s.element);
        s.blockElement = block;

        // Make the section's <h2> focusable and tie the region to it via
        // aria-labelledby so the active block becomes a named landmark.
        const heading = s.element.querySelector('h2');
        if (heading) {
          if (!heading.id) heading.id = `ccaa-heading-${s.id}`;
          heading.setAttribute('tabindex', '-1');
          block.setAttribute('aria-labelledby', heading.id);
          s.headingElement = heading;
        }

        // Append a scroll-up button after the prose; only visible when the
        // selector is off-screen (so the user always has a way back to it).
        // Skipped in single-chart embed mode (no selector to scroll back to).
        if (!embed) {
          const button = mount(ScrollUpButton, {
            target: s.element,
            props: {
              onclick: () => navigate('top'),
              get visible() {
                return !selectorInView;
              },
            },
          });
          mountedComponents.push(button);
        }
      });

      // Register sections so the $effect below can hide all but the selected one
      ccaa.setSections(ccaaSections);
    }

    // Pick the user's CCAA by IP, or fall back to random.
    // In embed mode, select the requested CCAA directly (no IP detection).
    if (ccaaSections.length > 0) {
      if (embed) ccaa.select(embed.ccaa);
      else await ccaa.detectAndSelect();
    }
  });

  onDestroy(() => {
    unmountCurrentCharts();
    mountedComponents.forEach((app) => unmount(app));
    mountedComponents = [];
  });

  // Show/hide sections based on selection and swap mounted charts so only the
  // active CCAA carries chart instances. view-transition-name only on the
  // active block so the browser crossfades old→new by matching snapshots.
  $effect(() => {
    if (ccaaSections.length === 0) return;
    const selectedId = ccaa.selectedId;

    if (selectedId && selectedId !== mountedChartsFor.id) {
      unmountCurrentCharts();
      const section = ccaa.sections.find((s) => s.id === selectedId);
      if (section) {
        mountedChartsFor.id = section.id;
        mountedChartsFor.apps = mountChartsFor(section);
      }
    }

    ccaa.sections.forEach((s) => {
      const active = s.id === selectedId;
      s.blockElement.style.display = active ? '' : 'none';
      s.blockElement.style.viewTransitionName = active ? 'ccaa-block' : '';
    });
  });

</script>

<div class={['app-root', urlInfo.a11y && 'a11y-debug']}>
  {#if ccaaSections.length > 0}
    <div class="app-inner">
      {#if ccaa.sections.length > 1}
        <div
          {@attach inView({
            onEnter: () => (selectorInView = true),
            onExit: () => (selectorInView = false),
            top: 70, // for Civio's menu
          })}
        >
          <CcaaSelector
            sections={ccaa.sections}
            selectedId={ccaa.selectedId}
            onchange={(id) => {
              const currentIdx = ccaa.sections.findIndex((s) => s.id === ccaa.selectedId);
              const nextIdx = ccaa.sections.findIndex((s) => s.id === id);
              const direction = nextIdx > currentIdx ? 'next' : 'prev';
              withTransition(() => ccaa.select(id), direction);
              navigate('top', { focus: true });
            }}
          />
        </div>
      {/if}

      <article
        bind:this={contentContainer}
        class="ccaa-content"
        tabindex="-1"
        style:--chart-container-width="{chartLayout.containerWidth}px"
        {@attach observeWidth}
        {@attach swipe({
          onSwipeLeft: () => navigate('next', { focus: true }),
          onSwipeRight: () => navigate('prev', { focus: true }),
        })}
      >
        {#if ccaa.sections.length > 1}
          <NavButtons
            onprev={() => navigate('prev', { focus: true })}
            onnext={() => navigate('next', { focus: true })}
          />
        {/if}
      </article>
    </div>
  {/if}
</div>

{@html `<style>
  #${chartID.replace(/[^a-zA-Z0-9_-]/g, '')} {
    ${customColorsCSS};${mainColorsCSS};${projectColorsCSS};${bwScaleCSS};

    .subtitle {
      font-size: 0.82rem;
      line-height: 1.45;
      color: var(--bw600);
      margin: 0 auto 0.85rem;
      text-align: center;
    }
  }
</style>`}

{#if urlInfo.a11y}
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

{#if urlInfo.alt}
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
  .app-root {
    overflow-x: clip;
  }

  .app-inner {
    max-width: 800px;
    margin: 0 auto;
  }

  * :global {
    :focus-visible {
      outline: 2px solid var(--bw850);
      outline-offset: 2px;
    }

    .ccaa-content section {
      max-width: 660px;
      margin: 0 auto;
    }

    .ccaa-content h2 {
      margin-top: 0;
    }

    .chart-container {
      position: relative;
      width: var(--chart-container-width, 100%);
      left: 50%;
      transform: translateX(-50%);
      pointer-events: auto;
      margin-bottom: 2rem;

      svg {
        overflow: visible;
      }
    }

    article section > h3 {
      margin: 0;
    }
  }

  .ccaa-content {
    --ccaa-padding-inline: 0.75rem;
    --ccaa-padding-block: 0.75rem;
    --ccaa-border-width: 1px;
    --nav-button-size: 2rem;
    --nav-edge-offset: 0px;

    position: relative;
    scroll-margin-top: 60px;
  }

  .ccaa-content:focus {
    outline: none;
  }

  * :global(.ccaa-block) {
    padding: var(--ccaa-padding-block) var(--ccaa-padding-inline);
    border: var(--ccaa-border-width) solid color-mix(in srgb, var(--primary) 30%, transparent);
    border-radius: 10px;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;
  }

  /* Single-chart embed: no decoration, chart sits flush with iframe bounds */
  * :global(.ccaa-block.embed) {
    padding: 0;
    border: none;
    border-radius: 0;
  }

  * :global(.ccaa-block.embed .chart-container) {
    margin-bottom: 0;
  }

  .ccaa-content:focus-visible :global(.ccaa-block) {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 25%, transparent);
  }

  /* The section <h2> receives programmatic focus after CCAA navigation
     (it carries tabindex=-1). Programmatic focus on such elements may not
     match :focus-visible, so give the heading an explicit ring to show
     keyboard/SR users where focus landed. */
  .ccaa-content :global(h2:focus) {
    outline: 2px solid var(--bw850);
    outline-offset: 3px;
    border-radius: 3px;
  }

  @media (width >= 450px) {
    .ccaa-content {
      --ccaa-padding-block: 3rem;
    }
  }

  /* =========== ccaa change animation =========== */

  /* Prevent the root from entering the view transition: only .ccaa-block
     should animate. Otherwise Safari breaks backdrop-filter on fixed host
     elements (e.g. civio.es navbar) after the transition. */
  :global(:root) {
    view-transition-name: none;
  }

  /* next */
  @keyframes ccaa-slide-in-from-right {
    from {
      opacity: 0;
      transform: translateX(24px);
    }
  }

  @keyframes ccaa-slide-out-to-left {
    to {
      opacity: 0;
      transform: translateX(-24px);
    }
  }

  /* prev */
  @keyframes ccaa-slide-in-from-left {
    from {
      opacity: 0;
      transform: translateX(-24px);
    }
  }

  @keyframes ccaa-slide-out-to-right {
    to {
      opacity: 0;
      transform: translateX(24px);
    }
  }

  /* transitions */
  :global(html[data-ccaa-direction='next']::view-transition-old(ccaa-block)) {
    animation: ccaa-slide-out-to-left 150ms ease-out both;
  }

  :global(html[data-ccaa-direction='next']::view-transition-new(ccaa-block)) {
    animation: ccaa-slide-in-from-right 150ms ease-out both;
  }

  :global(html[data-ccaa-direction='prev']::view-transition-old(ccaa-block)) {
    animation: ccaa-slide-out-to-right 150ms ease-out both;
  }

  :global(html[data-ccaa-direction='prev']::view-transition-new(ccaa-block)) {
    animation: ccaa-slide-in-from-left 150ms ease-out both;
  }

  /* Keep the sticky nav buttons above the animating ccaa-block during the transition */
  :global(::view-transition-group(nav-sticky)) {
    z-index: 10;
  }

  /* =========== accesibility =========== */
  @media (prefers-reduced-motion: reduce) {
    :global(*),
    :global(*::before),
    :global(*::after) {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }

    :global(::view-transition-group(*)),
    :global(::view-transition-old(*)),
    :global(::view-transition-new(*)) {
      animation-duration: 0.01ms !important;
    }
  }
</style>
