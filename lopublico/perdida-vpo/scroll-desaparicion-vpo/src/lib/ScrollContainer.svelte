<script>
  import Scrolly from './Scrolly.svelte';
  import ChartAcumulado from './ChartAcumulado.svelte';
  import ScreenReaderDescription from './ScreenReaderDescription.svelte';

  import { texts, visibility, firstProjectionYear } from '../states/steps.svelte';
  import { data, getKeyFigures } from '../states/data.svelte';
  import { vizLang } from '../states/language.svelte';
  import { getMainChartA11y, getAltText } from '../a11y';
  import { innerHeight } from 'svelte/reactivity/window';
  import { isMobile } from '../states/utils.svelte';
  import TouchIcon from './TouchIcon.svelte';

  const { isAltMode = false } = $props();

  // Headline numbers piped into each step's `text(f)` so the prose stays in
  // sync with the data instead of hardcoding figures.
  const figures = $derived(getKeyFigures(data.value, vizLang.formatIntegers));

  let index = $state(undefined);
  let graphicHeight = $state(0);
  let selectorHeight = $state(0);
  let planView = $state('protection');
  const scrollThreshold = 0.6;

  // Pre-compute the a11y payload for every step so each <section> can render
  // its own description+table statically. Avoids mounting/unmounting on scroll,
  // which would otherwise interrupt screen-reader reading mid-step.
  // Journalist alt text, varies with the current planView (only meaningful
  // at the last/interactive step; the text describes that view).
  const altText = $derived(
    isAltMode && data.value ? getAltText(vizLang, { rows: data.value, planView }) : ''
  );

  const a11yDataPerStep = $derived(
    data.value && data.value.length > 0
      ? texts.map((_, i) =>
          getMainChartA11y(vizLang, {
            rows: data.value,
            years: data.years,
            firstProjectionYear,
            planView: i === visibility.interactive ? planView : 'protection',
            step: i,
          })
        )
      : []
  );

  let lastIndex = $state(undefined);
  $effect(() => {
    if (index !== undefined) lastIndex = index;
  });

  // Until the last step the Selector is invisible but reserves space inside
  // `.graphic`; offset `top` by half its height so the chart stays centered.
  const isLastStep = $derived(lastIndex === texts.length - 1);
  const topOffset = $derived(isLastStep ? 0 : selectorHeight / 2);
</script>

<div class="scrolly-wrapper">
  <div
    class={['graphic', isLastStep ? 'full-page' : '']}
    bind:clientHeight={graphicHeight}
    style:top="calc(50% - {graphicHeight / 2}px - {topOffset}px + 15px)"
  >
    <ChartAcumulado
      step={index}
      {scrollThreshold}
      bind:selectorHeight
      bind:planView
    />
  </div>

  <section class="sections" aria-label={vizLang.texts.narrativeRegionLabel}>
    <Scrolly bind:value={index} top={innerHeight.current * scrollThreshold}>
      {#each texts as text, i (i)}
        <section class={['step', index === i && 'active']} id="step-{i}">
          <h5 class="sr-only">{vizLang.texts.stepLabel(i + 1, texts.length, text.info)}</h5>
          <div class="text">
            <p>{text.text(figures)}</p>
            {#if i === 0}
              <p class="hover-text" aria-hidden="true">
                <TouchIcon variant="light" />
                {vizLang.texts.mainChart.interactionNote[isMobile.current ? 'mobile' : 'desktop']}
              </p>
            {/if}
          </div>
          {#if i === visibility.interactive}
            <fieldset class="interactive-selector" inert={index !== visibility.interactive}>
              <legend>{vizLang.texts.mainChart.filterLegend}</legend>
              {#each vizLang.texts.mainChart.dimensions as opt (opt.value)}
                <label>
                  <input
                    type="radio"
                    name="dimension-a11y"
                    value={opt.value}
                    checked={planView === opt.value}
                    onchange={() => (planView = opt.value)}
                  />
                  {opt.label}
                </label>
              {/each}
            </fieldset>
          {/if}
          {#if a11yDataPerStep[i]}
            <ScreenReaderDescription {...a11yDataPerStep[i]} />
          {/if}
        </section>
      {/each}
    </Scrolly>
  </section>
</div>

{#if altText}
  <div class="alt-description">
    <p>👁️‍🗨️ ALT: {altText}</p>
  </div>
{/if}

<style>
  .scrolly-wrapper {
    position: relative;
    overflow-anchor: none;
  }

  .graphic {
    position: sticky;
    display: flex;
    width: 100%;
    align-items: center;
    transition: top 0.3s;
  }

  .sections {
    position: relative;
    margin-top: 10dvh;
    pointer-events: none;
  }

  .step {
    height: 95dvh;
    pointer-events: none;
    padding: 1rem;
    text-align: center;

    &:last-of-type {
      height: 100dvh !important;
    }
  }

  @media (min-width: 600px) {
    .graphic {
      padding-right: 30%;
      transition: all 0.3s;

      &.full-page {
        padding-right: 10px;
      }
    }

    .step {
      padding-right: 0;
      height: 80dvh;
    }

    .sections {
      padding-left: 70%;
    }
  }

  @media (max-width: 600px) {
    .step:last-of-type {
      height: 130dvh !important;
    }
  }

  .step .text {
    background: rgba(255, 255, 255, 0.7);
    border: solid 2px var(--bw400);
    backdrop-filter: blur(5px) brightness(150%);
    padding: 1rem;
    border-radius: 0.5rem;
    display: inline-block;
    pointer-events: auto;
    opacity: 0.2;
    transition: all 0.3s;

    & .hover-text {
      color: var(--bw500);
      font-size: 0.8rem;
      line-height: 1;
    }

    & p:last-of-type {
      margin: 0;
    }
  }

  .step.active .text {
    opacity: 1;
  }

  .interactive-selector {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
    pointer-events: auto;
  }
</style>
