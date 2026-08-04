<script>
  import ChartAcumuladoStatic from './ChartAcumuladoStatic.svelte';
  import ScreenReaderDescription from './ScreenReaderDescription.svelte';

  import { texts, visibility, firstProjectionYear } from '../states/steps.svelte';
  import { data, getKeyFigures } from '../states/data.svelte';
  import { vizLang } from '../states/language.svelte';
  import { getMainChartA11y } from '../a11y';

  const figures = $derived(getKeyFigures(data.value, vizLang.formatIntegers));

  let boxesHeights = $state(texts.map(() => 0));

  // Pre-compute a11y payloads once per step (planView fixed to 'protection'
  // for the interactive step too — the dossier shows the default view).
  const a11yDataPerStep = $derived(
    data.value && data.value.length > 0
      ? texts.map((_, i) =>
          getMainChartA11y(vizLang, {
            rows: data.value,
            years: data.years,
            firstProjectionYear,
            planView: 'protection',
            step: i,
          })
        )
      : []
  );
</script>

<section class="print-narrative" aria-label={vizLang.texts.narrativeRegionLabel}>
  <p class="print-intro" aria-hidden="true">
    Versión imprimible del gráfico interactivo: el mismo gráfico se transforma en {texts.length} pasos
    para narrar la evolución del parque protegido.
  </p>

  <ol class="print-steps">
    {#each texts as text, i (i)}
      <li class="print-step" id="print-step-{i}">
        <header class="step-header" aria-hidden="true">
          <span class="step-badge">Paso {i + 1} / {texts.length}</span>
          <h6 class="step-title">{text.info}</h6>
        </header>
        <h5 class="sr-only">{vizLang.texts.stepLabel(i + 1, texts.length, text.info)}</h5>
        <div class="step-body">
          {#if i >= visibility.interactive}
            <div class="explore-note" aria-hidden="true">
              <p class="explore-hint">
                Explora el gráfico en la versión interactiva online para ver por diferentes
                categorías:
              </p>
              <span class="explore-label">{vizLang.texts.mainChart.filterLabel}</span>
              <ul class="explore-dims">
                {#each vizLang.texts.mainChart.dimensions as dim (dim.value)}
                  <li class="explore-dim">{dim.label}</li>
                {/each}
              </ul>
            </div>
          {/if}
          <div class="chart">
            <ChartAcumuladoStatic step={i} compact bind:boxesHeight={boxesHeights[i]} />
          </div>
          <aside class="text">
            <p>{text.text(figures)}</p>
          </aside>
        </div>
        {#if a11yDataPerStep[i]}
          <ScreenReaderDescription {...a11yDataPerStep[i]} />
        {/if}
      </li>
    {/each}
  </ol>
</section>

<style>
  .print-narrative {
    margin-top: 1rem;
  }

  .print-intro {
    margin: 0 0 1.5rem;
    padding: 0.6rem 0.9rem;
    border-left: 3px solid var(--primary, #f74383);
    background: var(--light, #ffecf6);
    font-size: 0.85rem;
    line-height: 1.4;
    color: var(--bw700, #444);
    border-radius: 3px;
  }

  .print-steps {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.85rem 0.9rem;
  }

  .print-step {
    border: 1px solid var(--bw300, #ddd);
    border-radius: 6px;
    padding: 0.6rem 0.75rem;
  }

  .step-header {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    margin-bottom: 0.35rem;
  }

  .step-badge {
    display: inline-block;
    padding: 0.1rem 0.4rem;
    border-radius: 999px;
    background: var(--primary, #f74383);
    color: white;
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  .step-title {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--bw800, #222);
  }

  .step-body {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .step-body .chart {
    min-width: 0;
  }

  .step-body .text {
    background: var(--bw100, #f5f5f5);
    border-radius: 4px;
    padding: 0.5rem 0.6rem;
    font-size: 0.72rem;
    line-height: 1.4;
  }

  .step-body .text p {
    margin: 0;
  }

  /* Static hint for the interactive exploration step: shows the dimensions
     the reader can switch between in the online version. */
  .explore-note {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem 0.4rem;
  }

  .explore-label {
    font-size: 0.68rem;
    font-weight: 600;
    color: var(--bw700, #444);
  }

  .explore-dims {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .explore-dim {
    padding: 0.1rem 0.45rem;
    border: 1px solid var(--primary, #f74383);
    border-radius: 999px;
    font-size: 0.62rem;
    font-weight: 600;
    color: var(--primary, #f74383);
    white-space: nowrap;
  }

  .explore-hint {
    flex-basis: 100%;
    margin: 0.15rem 0 0;
    font-size: 0.65rem;
    font-style: italic;
    line-height: 1.35;
    color: var(--bw600, #666);
  }

  @media print {
    .step-badge,
    .explore-dim {
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }
  }
</style>
