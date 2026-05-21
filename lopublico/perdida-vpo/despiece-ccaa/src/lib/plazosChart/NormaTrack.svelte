<script>
  import { getContext } from 'svelte';

  const { row, gridRow } = $props();
  const ctx = getContext('plazosChart');
</script>

<div class="label" style:grid-row={gridRow}>
  <span class="text">{row.category}</span>
</div>

<div
  class="track"
  style:grid-row={gridRow}
  style:grid-column="2 / {ctx.years.length + 2}"
  aria-hidden="true"
></div>

{#each row.entries as entry, ei (entry.id)}
  {#if entry.endYear > entry.startYear}
    <div
      class="range"
      style:grid-row={gridRow}
      style:grid-column="{ctx.entryStartCol(entry)} / {ctx.entryEndCol(entry)}"
      style:--stack-idx={entry.stackIdx}
      onpointerenter={(e) => ctx.handleNormaPointerEnter(e, entry)}
      onpointerleave={ctx.handlePointerLeave}
      aria-hidden="true"
    ></div>
  {/if}
  <!-- Pointer-only marker: the visual chart is aria-hidden and SR users get
       the data table from ScreenReaderDescription. The tooltip opened on
       hover carries the "Ver fuente" link to the source. -->
  <div
    class="dot"
    style:grid-row={gridRow}
    style:grid-column={ctx.entryStartCol(entry)}
    style:--stack-idx={entry.stackIdx}
    onpointerenter={(e) => ctx.handleNormaPointerEnter(e, entry)}
    onpointerleave={ctx.handlePointerLeave}
    aria-hidden="true"
  >
    <span class="circle"></span>
  </div>
{/each}

<style>
  .label {
    grid-column: 1;
    background: var(--bw50);
    padding: 0 6px 0 18px;
    min-height: 24px;
    display: flex;
    align-items: center;
    position: sticky;
    left: 0;
    z-index: 2;
    min-width: 0;
  }

  .text {
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--bw500);
    letter-spacing: 0.06em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .track {
    background: var(--bw50);
    z-index: 0;
  }

  .range {
    z-index: 1;
    height: 2px;
    align-self: start;
    background: var(--bw800);
    opacity: 0.35;
    margin: 11px 4px 0;
    position: relative;
    cursor: pointer;
    transform: translateX(calc(var(--stack-idx, 0) * 10px));
  }

  .range::before {
    content: '';
    position: absolute;
    inset: -8px 0;
  }

  .dot {
    z-index: 2;
    cursor: pointer;
    align-self: start;
    justify-self: center;
    margin-top: 2px;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: translateX(calc(var(--stack-idx, 0) * 10px));
  }

  .circle {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--bw900);
    transition: transform 0.15s;
  }

  .dot:hover .circle,
  .range:hover + .dot .circle {
    transform: scale(1.5);
  }

  @media (max-width: 640px) {
    .label {
      padding: 0 4px 0 12px;
    }
  }
</style>
