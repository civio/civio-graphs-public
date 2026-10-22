<script>
  import { vizLang } from '../states/language.svelte';
  import { fillHtml } from '../utils/template';

  import personIcon from '../assets/people/person.png';
  import coupleIcon from '../assets/people/couple.png';
  import familyIcon from '../assets/people/family.png';

  const householdIcons = { single: personIcon, couple: coupleIcon, family: familyIcon };

  /**
   * `ratio` is the fraction of the threshold in the data that the active reference stands
   * for: 1 for the poverty threshold, 2/3 for severe poverty. Switching reference is a
   * rescale — the euros it takes, and how far the benefit sits from it — so the sentences
   * do not change, only the figures and the noun they point at.
   */
  let { row, ratio = 1, term = null } = $props();

  const scaled = (segment) => ({
    ...segment,
    threshold: segment.threshold == null ? null : segment.threshold * ratio,
    adequacy: segment.adequacy == null ? null : segment.adequacy / ratio,
  });

  // Non-breaking spaces: a narrow tooltip would otherwise split "1.827" from its "€",
  // and "32,69" from its "%".
  const euros = (value) => (value == null ? vizLang.texts.noData : vizLang.formatEuros(value));

  const percent = (value) => `${vizLang.formatDecimals(value)}\u00a0%`;

  let t = $derived(vizLang.texts.tooltip);
  let names = $derived(vizLang.texts.householdNarrative);
</script>

<!--
  One sentence says what the benefit pays and under which programme, a second one how far that
  sits from the threshold. The distance is painted in the colour of the bar.
-->
<div class="tooltip-segments">
  {#each row.segments as raw (raw.key)}
    {@const segment = scaled(raw)}
    {@const values = {
      country: row.country,
      household: names[segment.key],
      scheme: segment.scheme,
      term: term ?? vizLang.texts.povertyTerm,
      amount: euros(segment.amount),
      threshold: euros(segment.threshold),
    }}
    <div class="segment-block">
      <div class="segment-icon-slot">
        <img class="segment-icon" src={householdIcons[segment.key]} alt="" />
      </div>
      <div class="segment-text">
        <p>
          {#if segment.amount == null}
            {@html fillHtml(t.noAmount, values)}
          {:else}
            {@html fillHtml(segment.scheme ? t.benefit : t.benefitNoScheme, values)}
            {#if segment.adequacy == null}
              {@html fillHtml(t.noThreshold, values)}
            {:else}
              {@const isAbove = segment.adequacy >= 100}
              <span class={isAbove ? 'above' : 'below'}>
                {@html fillHtml(isAbove ? t.above : t.below, {
                  ...values,
                  pct: percent(Math.abs(100 - segment.adequacy)),
                })}
              </span>
            {/if}
          {/if}
        </p>
      </div>
    </div>
  {/each}
</div>

<style>
  .tooltip-segments {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .segment-block {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .segment-icon-slot {
    flex: none;
    display: flex;
    justify-content: center;
    width: 2.8rem;
  }

  .segment-icon {
    height: 1.6rem;
    width: auto;
    margin-top: 0.15rem;
  }

  .segment-text {
    flex: 1;
    min-width: 0;
  }

  .segment-text p {
    margin: 0;
    font-size: 0.78rem;
    line-height: 1.45;
    color: var(--bw700);
  }

  .segment-text :global(b) {
    color: var(--bw900);
    font-weight: 700;
  }

  /* `<strong>` in the sentence: the same split the chart paints, short of the threshold or past it. */
  .below :global(strong) {
    color: var(--shortfall-text);
    font-weight: 800;
  }

  .above :global(strong) {
    color: var(--surplus-text);
    font-weight: 800;
  }
</style>
