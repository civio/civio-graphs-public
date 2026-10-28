<script>
  import { vizLang } from '../states/language.svelte.js';
  import { photoOf } from '../states/photos.js';
  import { scales, referenceSalary } from '../states/scales.svelte.js';
  import DirtPatina from './DirtPatina.svelte';

  /**
   * Compact card with a parliament's key figures.
   * Identity (region name + company below, highlighted) overlays the bottom-left
   * of the photo; the three figures (last contract, monthly salary, weekly hours)
   * sit below as three horizontal columns.
   * `vtName` names the card for the View Transitions crossfade between regions;
   * `null` leaves it unnamed.
   * @type {{
   *   parliament: import('../states/data.svelte.js').Parliament,
   *   vtName?: string | null,
   * }}
   */
  let { parliament: p, vtName = 'parliament-card' } = $props();

  const dec = $derived(vizLang.formatDecimals);
  const hours = $derived(vizLang.formatHours);

  const photo = $derived(photoOf(p));

  // Figures as they come from the source, no recalculation:
  // monthly salary with the extra payments prorated over 12,
  const monthlySalary = $derived(p.monthlySalary);
  // Below the SMI the meter would only say "under the line": a note explaining
  // the wage supplement replaces it.
  const belowMinimumWage = $derived(monthlySalary != null && monthlySalary < referenceSalary);
  // and weekly working hours. Where the agreement sets them per year they are
  // estimated, and a note under the figure gives the annual hours they come from.
  const weeklyHours = $derived(p.weeklyHours);
  const hoursEstimated = $derived(p.hoursBasis === 'anual');

  const t = $derived(vizLang.texts.card);
  const noData = $derived(t.noData);
</script>

{#snippet identityContent()}
  <p class="region">{p.name}</p>
  <p class="company">{p.company || noData}</p>
{/snippet}

<!-- Minimal salary meter: a black vertical axis with the reference income (SMI)
     as a horizontal tick at the centre; the card's salary is a single orange dot
     above or below it. Scale is shared across all cards and never overflows. -->
{#snippet salaryMeter(monthly)}
  {@const cy = 28 - scales.salaryOffset(monthly)}
  <svg class="salary-meter" viewBox="0 0 40 56" width="40" height="56" aria-hidden="true">
    <line class="axis" x1="10" y1="4" x2="10" y2="52" />
    <line class="reference" x1="5" y1="28" x2="15" y2="28" />
    <text class="ref-label" x="20" y="28" dominant-baseline="middle">{t.referenceLabel}</text>
    <circle class="value" cx="10" {cy} r="3.5" />
  </svg>
{/snippet}

<!-- Salary label + figure (with the agreement link on the same line, to save
     a row), plus the below-SMI note when `withNote`. -->
{#snippet salaryText(withNote)}
  <div class="stat-text">
    <dt>{t.salary}</dt>
    <dd>
      {#if monthlySalary != null}
        {dec(monthlySalary)} <span class="unit">{t.salaryUnit}</span>
      {:else}{noData}{/if}
      {#if p.agreementUrl}
        <a
          class="agreement-link"
          href={p.agreementUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="{t.agreementLinkLabel} {p.name} {vizLang.texts.opensInNewWindow}"
        >
          {t.agreementLink}
          <svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </a>
      {/if}
    </dd>
    {#if withNote}
      <dd class="stat-note">{t.belowMinimumWage(dec(referenceSalary))}</dd>
    {/if}
  </div>
{/snippet}

<article class="card" style={vtName ? `view-transition-name: ${vtName};` : undefined}>
  <DirtPatina seed={p.id} />

  {#if photo}
    <!-- The photo is decorative: the parliament's name is the visible text below. -->
    <div class="card-photo">
      <img src={photo} alt="" fetchpriority="high" />
      <div class="identity identity--overlay">{@render identityContent()}</div>
    </div>
  {/if}

  <div class="body">
    {#if !photo}
      <div class="identity">{@render identityContent()}</div>
    {/if}

    <dl class="stats">
      <div class="stat stat--date">
        <dt>{t.lastContract}</dt>
        <dd>{t.lastContractById?.[p.id] ?? (p.lastContract || noData)}</dd>
      </div>
      <div class="stat stat--salary">
        {#if !belowMinimumWage}
          <!-- Invisible copy of the below-SMI layout stacked in the same cell: it
               reserves that height (and width on mobile) at any viewport, so the
               card doesn't resize between regions above and below the SMI. -->
          <div class="salary-ghost" aria-hidden="true">{@render salaryText(true)}</div>
        {/if}
        <div class="salary-content">
          {#if !belowMinimumWage}
            <span class="stat-figure">
              {#if monthlySalary != null}{@render salaryMeter(monthlySalary)}{/if}
            </span>
          {/if}
          {@render salaryText(belowMinimumWage)}
        </div>
      </div>
      <div class="stat stat--hours">
        <dt>{t.weeklyHours}</dt>
        <dd>
          {#if weeklyHours != null}
            {hours(weeklyHours)} <span class="unit">{t.weeklyHoursUnit}</span>
          {:else}{noData}{/if}
        </dd>
        {#if hoursEstimated}
          <dd class="stat-note">
            {t.estimatedHours(p.annualHours != null ? hours(p.annualHours) : null)}
          </dd>
        {/if}
      </div>
    </dl>
  </div>
</article>

<style>
  .card {
    border: 2px solid var(--bw700);
    box-shadow: 7px 7px var(--bw700);
    background-color: var(--light);
    overflow: hidden;
    position: relative;
  }

  .card-photo {
    position: relative;
  }

  .card-photo img {
    display: block;
    width: 90%;
    margin: 0 auto;
    object-fit: cover;
  }

  /* Identity block: region name + company (highlighted) below. */
  .region {
    margin: 0;
    font-size: 1rem;
    text-align: left;
    line-height: 1.15;
    font-weight: 800;
    color: var(--bw900, #1a1a1a);
  }

  .company {
    margin: 0.2rem 0 0;
    font-size: 1.25rem;
    font-weight: 800;
    line-height: 1.15;
    color: var(--primary);
    text-align: left;
  }

  /* Overlaid on the bottom-left corner of the photo; torn white backing, lifted
     above the base grime (z 2) so the label reads clean in the foreground. */
  .identity--overlay {
    position: absolute;
    left: 26px;
    bottom: 26px;
    max-width: 85%;
    padding: 0.5rem 1rem 0.55rem;
    z-index: 2;
  }

  .identity--overlay::before {
    content: '';
    position: absolute;
    inset: -2px;
    z-index: -1;
    background: #fff;
    filter: url(#dirt-tear);
  }

  /* Fallback (no photo): identity sits above the figures. */
  .body .identity {
    margin-bottom: 0.85rem;
  }

  .body {
    padding: 0.9rem 1.1rem 1rem;
  }

  /* Three figures as horizontal columns, vertically centered so the taller
     salary column (with its meter) stays aligned with the others. */
  .stats {
    display: grid;
    /* Ratios follow each column's widest content (date label, salary meter +
       figure + agreement link, hours label), so all three plates keep the same
       spare room and each fits on one line. Fixed fr ratios (not auto) so
       columns don't shift between regions. minmax(0, …) lets the tracks shrink
       below their content's min width instead of overflowing. */
    grid-template-columns: minmax(0, 0.93fr) minmax(0, 1.57fr) minmax(0, 1fr);
    /* Stretch so all three plates share the tallest column's height (the
       icon-less date column would otherwise be shorter). */
    align-items: stretch;
    gap: 0.5rem 1rem;
    margin: 0;
  }

  .stat {
    min-width: 0;
    /* z-index 2 lifts the box ABOVE the base grime (z 1) into the foreground, so
       the data reads clean; the torn ::before plate sits behind its text. */
    position: relative;
    z-index: 2;
    /* Vertical padding keeps the text off the torn edges of the plate. */
    padding: 0.5rem 0.35rem;
  }

  /* The date and hours columns have no icon, so centre their text within the
     stretched box to match the height of the salary column. */
  .stat--date,
  .stat--hours {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  /* Torn white backing for each figure: white lives on a filtered pseudo so the
     #dirt-tear turbulence (DirtFilters) frays its rectangular edge. */
  .stat::before {
    content: '';
    position: absolute;
    inset: -2px;
    z-index: -1;
    background: #fff;
    filter: url(#dirt-tear);
  }

  /* min-width/height reserve the figure's box (salary meter is 40×56) so a card
     with a missing figure keeps the same height — no size jump between cards. */
  .stat-figure {
    position: relative;
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    min-height: 56px;
  }

  .stat-text {
    min-width: 0;
  }

  /* ── Salary meter: SMI reference vs this card's salary ── */
  .salary-meter {
    overflow: visible;
  }

  .salary-meter .axis {
    stroke: var(--bw500);
    stroke-width: 1;
  }
  .salary-meter .reference {
    stroke: var(--bw900);
    stroke-width: 2.5;
  }

  .salary-meter .ref-label {
    font-size: 8px;
    font-weight: 700;
    fill: var(--bw900, #1a1a1a);
  }

  .salary-meter .value {
    fill: var(--primary);
  }

  /* All three figures in orange so the key data stand out. */
  .stat--date dd,
  .stat--salary dd,
  .stat--hours dd {
    color: var(--primary);
  }
  .stat--date dd {
    font-size: 0.9rem;
  }

  dt {
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--bw800, #666);
    margin-bottom: 0.1rem;
  }

  dd {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 800;
    line-height: 1.15;
    color: var(--bw900, #1a1a1a);
  }

  /* Secondary text tucked right under a figure (below-SMI salary, estimated
     hours), so it reads as a qualifier of that number rather than a separate
     block. Prefixed with .stat to outrank the orange `.stat--* dd` rule. */
  .stat .stat-note {
    margin-top: 0.15rem;
    font-size: 0.7rem;
    font-weight: 500;
    line-height: 1.25;
    color: var(--bw700);
  }

  /* Source link: secondary, inline after the figure. inline-block + nowrap
     keep text and icon together; on narrow screens it wraps as a whole.
     Plain --primary and no underline (editorial choice): the link icon marks
     it as a link, and the underline comes back on hover as feedback.
     Prefixed with .stat to outrank civio.es article link styles
     (.contratacion .post-content a: bottom border + yellow hover background). */
  .stat .agreement-link {
    display: inline-block;
    margin-left: 0.5rem;
    font-size: 0.7rem;
    font-weight: 600;
    line-height: 1.25;
    white-space: nowrap;
    color: var(--primary);
    text-decoration: none;
    text-underline-offset: 2px;
    border-bottom: none;
  }

  .stat .agreement-link:hover {
    text-decoration: underline;
    background: none;
  }

  .agreement-link:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }

  .agreement-link svg {
    vertical-align: -1px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  /* Ghost and real content share one grid cell: the cell takes the taller of
     the two (always the below-SMI layout) and the real content is centred in it. */
  .stat--salary {
    display: grid;
  }

  .salary-ghost,
  .salary-content {
    grid-area: 1 / 1;
    min-width: 0;
  }

  .salary-ghost {
    visibility: hidden;
  }

  .salary-content {
    display: flex;
    align-items: center;
    align-self: center;
    gap: 0.55rem;
  }

  .unit {
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--bw600, #777);
  }

  @media (width <= 480px) {
    /* The photo is short on mobile; overlaying the identity label buries the
       hemicycle, so drop it below the image (normal flow) and centre it. */
    .identity--overlay {
      position: relative;
      left: auto;
      bottom: auto;
      width: fit-content;
      max-width: 90%;
      margin: 0.7rem auto 0.15rem;
      text-align: center;
    }

    .identity--overlay .region,
    .identity--overlay .company {
      text-align: center;
    }
  }

  /* Below ~680px (the card's max width) the three columns get too narrow:
     labels run to three lines and figures wrap or not depending on the region,
     which resizes the card as you browse. Stack them into one centred column,
     each plate hugging its own content (justify-self), not full width. */
  @media (width <= 680px) {
    .stats {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .stat {
      justify-self: center;
      padding: 0.35rem 0.85rem;
      justify-content: center;
      text-align: center;
    }

    .salary-content {
      justify-content: center;
    }
  }
</style>
