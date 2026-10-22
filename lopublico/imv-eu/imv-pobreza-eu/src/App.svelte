<script>
  // Svelte core
  import { onMount, tick } from 'svelte';

  // States
  import { data } from './states/data.svelte';
  import { vizLang } from './states/language.svelte';
  import { fillHtml } from './utils/template';
  import { urlInfo, isTouchDevice } from './states/utils.svelte';
  import { readerCountry } from './states/readerCountry.svelte';

  // Utils
  import { customColorsCSS, mainColorsCSS, projectColorsCSS, bwScaleCSS } from './utils/colors';

  // Components
  import DotChart from './lib/DotChart.svelte';
  import HouseholdFilter from './lib/HouseholdFilter.svelte';
  import TouchIcon from './lib/TouchIcon.svelte';
  import RadialSelector from './lib/RadialSelector.svelte';
  import ScreenReaderDescription from './lib/ScreenReaderDescription.svelte';
  import Footer from './lib/footer/Footer.svelte';

  // a11y
  import { getMainChartA11y, getScenarioSummary } from './a11y';

  // Data: from the civio-data repo. data.civio.es tells browsers to cache it for a month, so a
  // fresh query string on every load keeps a data fix from waiting that long to show up.
  const dataUrl = `https://data.civio.es/lopublico/imv-eu/imv-pobreza-eu/data.csv?t=${Date.now()}`;

  // Props
  let { lang, chartID, a11y = false, alt = false } = $props();

  // Which poverty reference the chart measures against. severe poverty sits first so
  // the switch reads in the same direction as the axis, where it is the leftmost line.
  let reference = $state('poverty');

  // a11y: static description, read once, plus a table of the three households for the threshold
  let mainChartA11y = $derived(getMainChartA11y(vizLang, data.sortedCountries, reference));

  /*
    a11y: the count for the household on screen. Derived rather than set from the handler, so it
    is already there on a cold read — the previous version started empty and said nothing about
    "Persona sola" until you touched the filter.
  */
  let householdSummary = $derived(
    getScenarioSummary(vizLang, data.sortedCountries, data.selectedType, reference)
  );

  /*
    Both summaries are live regions, muted until mount is done: the language is set and the data
    arrives, each rewriting every text, and they would read all of that out on load. From then
    on, only a filter change speaks. A household switch rewrites one of them; a threshold switch
    rewrites both, and they are announced one after the other.
  */
  let canAnnounce = $state(false);

  function setReference(value) {
    reference = value;
  }

  // a11y debug mode: activated via ?a11y URL param or data-a11y attribute
  let isA11yDebugMode = $derived(urlInfo.a11y || a11y);

  // alt mode: activated via ?alt URL param or data-alt attribute
  let isAltMode = $derived(urlInfo.alt || alt);

  /**
   * The title without its markup. VoiceOver treats any element with several children as a group
   * you can step into, so the two spans are announced a second time, in pieces: naming the
   * heading with the whole sentence and hiding the pieces keeps it to one reading. Stripped from
   * the very string the markup renders, so the two cannot drift apart.
   */
  let plainTitle = $derived(vizLang.texts.title.replaceAll(/<[^>]+>/g, ''));

  let referenceOptions = $derived([
    { value: 'extreme', label: vizLang.texts.referenceExtreme },
    { value: 'poverty', label: vizLang.texts.referencePoverty },
  ]);

  /**
   * Which countries had to be left out. Only exists when there is something to exclude, and it
   * is said nowhere else — unlike the threshold definition next to it, which now opens the
   * description, so the two notes can no longer travel as one string. Rendered with `{@html}`
   * for the markup in the sentence, so the names are escaped: an unlisted code falls back to
   * the CSV name.
   */
  let excludedNote = $derived(
    data.excludedCountries.length > 0
      ? fillHtml(vizLang.texts.excludedNote, {
          countries: data.excludedCountries
            .map((entry) => entry.country)
            .sort((a, b) => a.localeCompare(b, vizLang.value))
            .join(', '),
        })
      : ''
  );

  // Load data onMount
  onMount(async () => {
    // Not awaited: the chart must not wait on a third-party lookup that may never answer
    readerCountry.detect();

    // Before the data: the loading and error messages are in the piece's language too, and the
    // country names are translated once, as the rows are parsed.
    vizLang.setLang(urlInfo.lang ?? lang);

    try {
      await data.loadFromUrl(dataUrl);
    } catch (error) {
      console.error('Failed to load data:', error);
    }

    // After the texts have settled: from here on, a change to the summary is a change the reader made
    await tick();
    canAnnounce = true;
  });
</script>

{#snippet referenceSwitch()}
  <RadialSelector
    name="reference"
    legend={vizLang.texts.referenceLegend}
    options={referenceOptions}
    selected={reference}
    onchange={setReference}
  />
{/snippet}

{#snippet pieceFooter()}
  <!--
    The definition is hidden from screen readers: by ear this note would only arrive after the
    table, so it opens the description instead. Saying it again here would be the second time.
    The excluded countries stay audible: they are in no other text.
  -->
  <p class="threshold-note">
    <span aria-hidden="true">{vizLang.texts.noteLabel} {@html vizLang.texts.thresholdNote}</span>
    {@html excludedNote}
  </p>
  <Footer {chartID} />
{/snippet}

{#snippet pieceHeader(extraControl = undefined)}
  <h4 aria-label={plainTitle}>
    <!-- `{@html}` over a static string from the language file: nothing here is user input -->
    <span aria-hidden="true">{@html vizLang.texts.title}</span>
  </h4>

  <!--
    a11y, layer 1: what the piece is and what a threshold is. Before the controls, so that
    "Umbral de pobreza severa, 1 de 2" already means something when it is read, and never
    repeated: it is the same whatever the filters show. In `?alt` it carries layer 2 too,
    because a screenshot has to stand on its own.
  -->
  <ScreenReaderDescription
    description={isAltMode ? mainChartA11y.description : mainChartA11y.intro}
    part="description"
    visible={isAltMode}
  />

  <!--
    a11y, layer 2: what the filters currently show, and a live region at the same time. The same
    nodes do both jobs — read in place when going through the piece, re-announced when a filter
    rewrites them — so there is no second copy to keep in sync. Before the controls, because this
    is the picture the controls then narrow down.

    Muted until mount is done: the data arrives and `setLang` rewrites every text right after it,
    and a live region would read all of that out on load.
  -->
  <p class="sr-only" role="status" aria-live={canAnnounce ? 'polite' : 'off'}>
    {mainChartA11y.summary}
  </p>

  <div class="controls">
    <HouseholdFilter />
    {#if extraControl}{@render extraControl()}{/if}
  </div>

  <!--
    a11y: the household on screen, below the filter that picks it — the result after its control,
    the same way the summary above sits before the controls that narrow it down. Live too, so
    changing the filter rewrites it and that rewriting is the announcement.
  -->
  <p class="sr-only" role="status" aria-live={canAnnounce ? 'polite' : 'off'}>
    {householdSummary}
  </p>

  <!-- a11y: hidden from screen readers: it is about pointer and tooltip, and the chart is aria-hidden -->
  <p class="interaction-hint" aria-hidden="true">
    <TouchIcon />
    {isTouchDevice.current ? vizLang.texts.interactionHintTouch : vizLang.texts.interactionHint}
  </p>
{/snippet}

<!--
  The piece picks its own language from `?lang=` or the mount point, which need not match the
  host page: without this the texts switch and the document keeps claiming the old language,
  so a screen reader reads them in the wrong voice.
-->
<div class="viz-root" lang={vizLang.value} class:a11y-debug={isA11yDebugMode}>
  {#if data.loading}
    <p role="status" aria-live="polite">{vizLang.texts.loading}</p>
  {:else if data.error}
    <p role="alert" class="error">{vizLang.texts.loadError}</p>
  {:else}
    <section class="exploration">
      {@render pieceHeader(referenceSwitch)}
      <DotChart {reference} onreferencechange={setReference} />
      <!--
        a11y: the data table right after the chart (which is aria-hidden), so a screen reader goes
        title → description → controls → table → notes and footer.
      -->
      <ScreenReaderDescription
        title={mainChartA11y.title}
        columns={mainChartA11y.columns}
        items={mainChartA11y.items}
        part="data"
        visible={isAltMode}
      />
      {@render pieceFooter()}
    </section>
  {/if}
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
    /* civio.es styles table captions at the bottom, but a caption is the table's accessible name
       and is announced on entering it. This mode has to paint the order that is heard. */
    .a11y-debug caption {
      caption-side: top;
      font-weight: bold;
      text-align: left;
    }
    .a11y-debug [aria-hidden='true'] {
      opacity: 0.1;
      border: 2px dashed blue;
      position: relative;
    }
    /* Hidden, but named by its parent: the text still reaches a screen reader through the
       parent's label, so it is readable here and dotted instead of dashed. */
    .a11y-debug [aria-label] > [aria-hidden='true'] {
      opacity: 1;
      border-style: dotted;
    }
    /* An aria-label lives in an attribute, so it is the one thing this mode could not show.
       Out of flow on purpose: several of the labelled elements are flex containers, and a
       pseudo-element in the normal flow would become a flex item and shift their layout. */
    .a11y-debug [aria-label] {
      position: relative;
      /* The tag sits outside its element, so a clipping ancestor would eat it: RadialSelector
         hides its overflow to crop the sliding pill against the rounded track. The pill carries
         its own border-radius, so letting it show costs nothing. */
      overflow: visible;
    }
    /* A live region reads like any other text, but it is the only thing here that interrupts
       the reader. Marked apart, and showing whether it is armed: these start muted so that
       loading the data does not read the whole description out. */
    .a11y-debug [aria-live] {
      border: 2px solid #6a1b9a;
      background-color: #f3e5f5;
    }
    .a11y-debug [aria-live]::after {
      content: '🔊 live: announced on change';
      display: block;
      margin-top: 0.35rem;
      color: #6a1b9a;
      font-size: 0.7rem;
      font-weight: bold;
    }
    .a11y-debug [aria-live='off']::after {
      content: '🔇 live: muted while the piece loads';
      opacity: 0.65;
      font-weight: normal;
    }
    .a11y-debug [aria-label]::before {
      content: 'aria-label: ' attr(aria-label);
      position: absolute;
      bottom: 100%;
      left: 0;
      z-index: 2;
      padding: 0 0.25rem;
      background-color: #fff3cd;
      border: 1px solid red;
      color: #b00;
      font-size: 0.7rem;
      font-weight: normal;
      white-space: nowrap;
      pointer-events: none;
    }
  </style>`}
{/if}

{#if isAltMode}
  <!-- Injected unscoped, like the debug styles above, so it is pinned to this chart's root -->
  {@html `<style>
    .viz-root .alt-description {
      font-style: italic;
      margin-top: 2rem;
      padding: 1.5rem;
      background-color: #f8f9fa;
      border-left: 4px solid var(--primary);
      font-size: 0.95rem;
      line-height: 1.6;
    }
    .viz-root .alt-description p {
      margin: 0;
    }
  </style>`}
{/if}

<style>
  /* Common styles are already injected via main.min.css */
  .viz-root :global {
    h4 {
      margin: 65px 0 1rem 0;
    }

    /* a11y: Focus visible styles for keyboard navigation */
    :focus-visible {
      outline: 2px solid var(--bw850);
      outline-offset: 2px;
    }
  }

  /* The two encodings of the chart, named in its own title. The spans arrive through `{@html}`,
     which the compiler never sees, so the scoping hash never lands on them — hence `:global`,
     kept under the scoped `h4` so it cannot reach anything else on the host page. */
  h4 :global(.mark-benefit) {
    color: var(--primary);
  }

  h4 :global(.mark-threshold) {
    padding-bottom: 1px;
    border-bottom: 2px solid var(--bw900);
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem 3.25rem;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  /* Block, not flex: the icon flows inline with the text so it stays attached when the line wraps */
  .interaction-hint {
    margin: 0 0 1.5rem;
    font-size: 0.75rem;
    font-style: italic;
    text-align: center;
    color: var(--bw500);

    :global(.mode-icon) {
      vertical-align: middle;
      margin-right: 0.4rem;
    }
  }

  @media (width <= 550px) {
    .exploration h4 {
      margin-bottom: 1.5rem;
    }
  }

  .error {
    color: #d3514a;
  }

  .exploration {
    margin-bottom: 4rem;
  }

  /* Same voice as the Civio footer right below it: they are one block, not two. */
  .threshold-note {
    margin: 0.3rem 5px 0;
    font-family: Lato, sans-serif;
    font-size: 0.75rem;
    font-weight: 400;
    line-height: 1.5;
    color: var(--bw500);
    text-align: center;
  }

  @media (width > 550px) {
    .threshold-note {
      font-size: 0.7rem;
      text-align: left;
    }
  }

  /*
    a11y: honour the user's reduced-motion preference. Scoped to this chart —
    the piece mounts inline inside the civio.es article, so a bare `:global(*)`
    would reach out and disable animations across the whole page.
  */
  @media (prefers-reduced-motion: reduce) {
    .viz-root :global(*),
    .viz-root :global(*::before),
    .viz-root :global(*::after) {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
</style>
