<script>
  import { onMount, flushSync } from 'svelte';

  // States
  import { vizLang } from './states/language.svelte.js';
  import { urlInfo, prefersReducedMotion } from './states/utils.svelte.js';
  import { regionNav } from './states/regionNav.svelte.js';
  import { data, parliamentIds } from './states/data.svelte.js';
  import { preloadPhotos } from './states/photos.js';

  // Utils
  import { swipe } from './utils/swipe.svelte.js';
  import { customColorsCSS, mainColorsCSS, projectColorsCSS, bwScaleCSS } from './utils/colors.js';

  // Components
  import RegionSelector from './lib/RegionSelector.svelte';
  import NavButtons from './lib/NavButtons.svelte';
  import ParliamentCard from './lib/ParliamentCard.svelte';
  import DirtFilters from './lib/DirtFilters.svelte';
  import Footer from './lib/footer/Footer.svelte';

  // `view` fixes which of the three views this embed shows. It comes from the
  // div's `view` attribute; a ?view= URL param (used in iframes) overrides it.
  let { lang, view: viewAttr } = $props();

  // Clean dataset exported from the newsroom's Excel. The timestamp skips the CDN
  // cache so a corrected upload shows up right away.
  const dataUrl = `https://data.civio.es/contratacion/limpiadoras-democracia/fichas-parlamentos/data.csv?t=${Date.now()}`;

  // `view` is 'regions' (the carousel) or a parliament id, which shows that
  // single card: the national chambers, or one region for a local embed.
  const view = $derived.by(() => {
    const requested = urlInfo.view ?? viewAttr;
    return parliamentIds.includes(requested) ? requested : 'regions';
  });
  const single = $derived(data.parliaments.find((p) => p.id === view));

  // Embeds mount by class, so there is no unique element id. We build a stable
  // per-view id for the share modal and the shareable iframe file name.
  const chartID = $derived(`${__APP_ID__}-${view}`);

  // Colours are injected inline on the wrapper (below) instead of via a
  // `#id { … }` block, so several embeds can coexist on the same page.
  const colorVars = `${customColorsCSS};${mainColorsCSS};${projectColorsCSS};${bwScaleCSS}`;

  // Crossfade between cards via View Transitions (degrades gracefully).
  function withTransition(fn) {
    const run = () => flushSync(fn);
    if (!document.startViewTransition || prefersReducedMotion.current) return run();
    document.startViewTransition(run);
  }

  // Name of the region the reader just moved to with the arrows or a swipe,
  // read out by a polite live region. Set inside the transition callback (it
  // runs async), so it holds the new region. The <select> isn't announced here:
  // screen readers already read the chosen option. The initial pick is silent.
  let announcement = $state('');

  function navigate(fn) {
    withTransition(() => {
      fn();
      announcement = regionNav.selected?.name ?? '';
    });
  }

  function selectRegion(id) {
    withTransition(() => regionNav.select(id));
  }

  onMount(async () => {
    // Before loading, so the loading message is already in the right language
    vizLang.setLang(urlInfo.lang ?? lang);
    // Photos don't depend on the data, so they can warm up during the fetch.
    // Photo preloading and region detection only matter for the carousel view.
    if (view === 'regions') preloadPhotos();

    try {
      await data.loadFromUrl(dataUrl);
    } catch {
      // data.error is set by the store and rendered below
      return;
    }

    // Detection needs the list of regions, so it waits for the data
    if (view === 'regions') regionNav.detectAndSelect();
  });
</script>

<!-- `lang` so screen readers switch voice: the iframe page itself says lang="es" -->
<div class="cleaners" style={colorVars} lang={vizLang.value}>
  <DirtFilters />

  <section class="cards" aria-label={vizLang.texts.widgetLabel}>
    {#if data.error}
      <p role="alert" class="status">{vizLang.texts.loadError}</p>
    {:else if !data.value}
      <!-- `!data.value` (not `data.loading`) also covers the first render, before onMount fires -->
      <p role="status" aria-live="polite" class="status">{vizLang.texts.loading}</p>
    {:else if view === 'regions'}
      <RegionSelector
        sections={regionNav.sections}
        selectedId={regionNav.selectedId}
        onchange={selectRegion}
      />

      <div class="card-area">
        <div
          class="card-stage"
          {@attach swipe({
            onSwipeLeft: () => navigate(() => regionNav.next()),
            onSwipeRight: () => navigate(() => regionNav.prev()),
          })}
        >
          {#if regionNav.selected}
            {#key regionNav.selectedId}
              <ParliamentCard parliament={regionNav.selected} />
            {/key}
          {/if}
        </div>

        <NavButtons
          onprev={() => navigate(() => regionNav.prev())}
          onnext={() => navigate(() => regionNav.next())}
        />
      </div>

      <!-- sr-only comes from civio.es's stylesheet (also used by ShareContainer) -->
      <p class="sr-only" aria-live="polite">{announcement}</p>
    {:else if single}
      <div class="card-area">
        <ParliamentCard parliament={single} />
      </div>
    {/if}
  </section>

  <Footer {chartID} {view} />
</div>

<style>
  .cleaners {
    --nav-button-size: 42px;
    --nav-edge-offset: 6px;
  }

  /* ── Widget ── */
  .cards {
    max-width: 680px;
    margin: 0 auto;
    padding: 1rem 0;
  }

  .status {
    margin: 2rem 0;
    text-align: center;
  }

  .card-area {
    position: relative;
    margin-top: 0.5rem;
  }

  .card-stage {
    touch-action: pan-y;
  }

  /* Crossfade between cards; we name the active element (in ParliamentCard). */
  :global(::view-transition-old(parliament-card)),
  :global(::view-transition-new(parliament-card)) {
    animation-duration: 0.35s;
  }

  /* Keep the nav buttons above the crossfading card in the VT top layer, so a
     click never drops them behind the card mid-transition. */
  :global(::view-transition-group(nav-prev)),
  :global(::view-transition-group(nav-next)) {
    z-index: 10;
  }

  /* a11y: respect reduced-motion, scoped to this piece so the host article's
     own animations are left alone. */
  @media (prefers-reduced-motion: reduce) {
    .cleaners :global(*),
    .cleaners :global(*::before),
    .cleaners :global(*::after) {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
</style>
