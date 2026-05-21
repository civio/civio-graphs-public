<script>
  import ColorLegend from '../ColorLegend.svelte';
  import { thresholds, permanentColor, diagonalGradient } from './colorScale.js';
  import { vizLang } from '../../states/language.svelte.js';
  import TouchIcon from '../TouchIcon.svelte';
  import { isMobile } from '../../states/utils.svelte.js';

  const introSubs = $derived(
    vizLang.texts.intro.exampleTypes.map((label, i) => {
      if (i === 0) return { years: 10, label };
      if (i === 1) return { years: 25, label };
      return { isPermanent: true, years: null, label };
    })
  );
</script>

<div class="intro">
  <h4 class="title">{vizLang.texts.title}</h4>

  <div class="legend">
    <div class="colors">
      <span class="legend-label">{vizLang.texts.intro.yearsLegendLabel}</span>
      <ColorLegend {thresholds} {permanentColor} colorMode="steps" />
    </div>

    <div class="box">
      <div class="box-content">
        <div
          class="box-bar"
          style:background={diagonalGradient(introSubs)}
          role="img"
          aria-label={vizLang.texts.intro.exampleAriaLabel}
        ></div>
        <span class="note">
          {#each vizLang.texts.intro.housingTypesNote as line, i (i)}
            {#if i > 0}<br />{/if}{line}
          {/each}
        </span>
      </div>
    </div>
  </div>

  <p class="subtitle">
    <TouchIcon variant="light" />
    {vizLang.texts.intro.subtitle(isMobile.current)}
  </p>
</div>

<style>
  .intro {
    .title {
      font-size: clamp(1rem, 2.2vw, 1.25rem);
      font-weight: 700;
      margin: 0 0 0.4rem;
      color: var(--bw900);
      letter-spacing: -0.01em;
      text-align: center;

      max-width: 560px;
      margin: auto;

      &:before {
        display: none !important;
      }
    }

    .subtitle {
      font-size: 0.82rem;
      line-height: 1.45;
      color: var(--bw600);
      margin: 0 auto 0.85rem;
      text-align: center;
    }

    .legend {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin: 1rem 0;
      justify-content: space-evenly;

      :global(.color-legend) {
        margin: 0;
      }

      @media (max-width: 640px) {
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }
    }

    .colors {
      display: flex;
      flex-direction: column;
      row-gap: 0.35rem;
    }

    .legend-label {
      font-size: 0.72rem;
      color: var(--bw700);
      font-weight: 600;
      letter-spacing: 0.02em;
      line-height: 1;
    }

    .box {
      position: relative;
      border-radius: 6px;
      padding: 10px 6px;
      align-self: center;
    }

    .box-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .box-bar {
      width: 80px;
      height: 20px;
      border-radius: 3px;
      flex-shrink: 0;
    }

    .note {
      font-size: 0.7rem;
      font-style: italic;
      color: var(--bw500);
      line-height: 1.2;
    }
  }

  @media (width > 640px) {
    .intro {
      .colors {
        padding-bottom: 5px;
      }
      .legend {
        margin-bottom: 1.5rem;

        .box {
          padding-bottom: 0;
        }
      }
    }
  }
</style>
