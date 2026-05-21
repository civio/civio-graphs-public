<script>
  /**
   * a11y: nested sr-only structure of the plazos chart.
   *
   * Headings let screen readers jump between regions (h4) and within each
   * region a list enumerates every housing type with its protection period.
   *
   * The visual chart (IntroLegend + PlazosGrid) is hidden from SR via
   * aria-hidden, so this component is the single source of truth for SR.
   */

  /** @type {{ data: import('../../a11y').PlazosA11yData }} */
  const { data } = $props();
</script>

<div class="sr-only">
  <h3>{data.title}</h3>
  <p>{data.description}</p>
  <p>{data.navHint}</p>

  {#each data.sections as section (section.name)}
    <h4>{section.label}</h4>
    {#if section.items.length === 0}
      <p>{data.noDataLabel}</p>
    {:else}
      {#if section.summary}<p>{section.summary}</p>{/if}
      <ul>
        {#each section.items as item, i (i)}
          <li>
            <strong>{item.label}:</strong>
            {item.duration}.
            {#if item.note}
              {data.noteLabel}: {item.note}.
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  {/each}
</div>

<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
