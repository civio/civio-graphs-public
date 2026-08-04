<script>
  import { flip } from 'svelte/animate';
  import { scale } from 'svelte/transition';
  import { vizLang } from '../states/language.svelte';

  let { currentPage, totalPages, onpagechange } = $props();

  // Page number list: always 1 and the last page, a window around the current
  // page, and gaps rendered as ellipsis (e.g. 1 … 4 5 6 … 10). Gaps use stable
  // string keys so the keyed each can transition items in and out by value.
  let pageNumbers = $derived.by(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const windowStart = Math.max(2, currentPage - 1);
    const windowEnd = Math.min(totalPages - 1, currentPage + 1);
    return [
      1,
      windowStart > 2 ? 'start-gap' : [],
      Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i),
      windowEnd < totalPages - 1 ? 'end-gap' : [],
      totalPages,
    ].flat();
  });
</script>

<nav class="pagination" aria-label={vizLang.texts.table.paginationLabel}>
  <button
    type="button"
    class="arrow"
    onclick={() => onpagechange(currentPage - 1)}
    disabled={currentPage === 1}
    aria-label={vizLang.texts.table.previousPage}
  >
    <span aria-hidden="true">←</span>
  </button>
  <div class="pages">
    {#each pageNumbers as page (page)}
      <div class="page-item" animate:flip={{ duration: 150 }} transition:scale={{ duration: 150 }}>
        {#if typeof page === 'string'}
          <span class="ellipsis" aria-hidden="true">…</span>
        {:else}
          <button
            type="button"
            class={['page-number', page === currentPage && 'current']}
            aria-current={page === currentPage ? 'page' : undefined}
            aria-label="{vizLang.texts.table.page} {page}"
            onclick={() => onpagechange(page)}
          >
            {page}
          </button>
        {/if}
      </div>
    {/each}
  </div>
  <button
    type="button"
    class="arrow"
    onclick={() => onpagechange(currentPage + 1)}
    disabled={currentPage === totalPages}
    aria-label={vizLang.texts.table.nextPage}
  >
    <span aria-hidden="true">→</span>
  </button>
</nav>

<style>
  .pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: fit-content;
    gap: 1rem;
    margin: 0 auto;
  }

  .pagination button {
    padding: 0.35rem 0.75rem;
    font-size: 0.9rem;
    color: var(--bw900);
    background-color: var(--bw0);
    border: 1px solid var(--bw300);
    border-radius: 4px;
    cursor: pointer;
    transition: transform 0.1s;

    &:disabled {
      color: var(--bw400);
      cursor: not-allowed;
    }

    &:hover:not(:disabled):not(.current) {
      background-color: var(--light);
    }

    &:active:not(:disabled):not(.current) {
      transform: scale(0.95);
    }
  }

  .pages {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.25rem;
  }

  .pagination .page-number {
    min-width: 2.1rem;
    padding: 0.35rem 0.4rem;
    font-variant-numeric: tabular-nums;
    text-align: center;
    border-color: var(--primary);
  }

  .pagination .page-number.current {
    color: var(--bw0);
    background-color: var(--primary);
  }

  .page-item {
    display: flex;
    align-items: center;
  }

  .ellipsis {
    padding: 0 0.25rem;
    color: var(--bw400);
  }
</style>
