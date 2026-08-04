<script>
  /**
   * a11y: keyboard/screen-reader alternative to the pointer-only year
   * tooltip. A visually hidden (`sr-only`) disclosure with one nested
   * <details> per year listing every day with active fires. Skip-link
   * pattern: it becomes visible while it has keyboard focus or is open,
   * so sighted keyboard users can see what they are interacting with.
   *
   * Content comes pre-formatted from getDayByDayA11y (src/a11y/dayByDay.js).
   */
  let { summary, years = [] } = $props();
</script>

<details class="day-by-day sr-only">
  <summary>{summary}</summary>
  {#each years as { year, label, days } (year)}
    <details>
      <summary>{label}</summary>
      <ul>
        <!-- Keyed by index: `day` is a pre-formatted sentence, so two rows
           can produce the same string and collide as keys -->
        {#each days as day, i (i)}
          <li>{day}</li>
        {/each}
      </ul>
    </details>
  {/each}
</details>

<style>
  /* Undo the global .sr-only clipping while the disclosure has keyboard
     focus or is open — otherwise a sighted keyboard user would be focusing
     an invisible control */
  details.sr-only:focus-within,
  details.sr-only[open] {
    position: static;
    width: auto;
    height: auto;
    overflow: visible;
    clip: auto;
    white-space: normal;
    margin: 0.5rem 0;
    padding: 0.75rem 1rem;
    background-color: var(--bw50);
    border-radius: 8px;
    font-size: 0.875rem;
  }

  summary {
    cursor: pointer;
  }

  details details {
    margin: 0.5rem 0 0.5rem 1rem;
  }

  ul {
    margin: 0.25rem 0;
  }
</style>
