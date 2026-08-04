<script>
  import { data } from '../states/data.svelte';
  import { vizLang } from '../states/language.svelte';
  import Filters from './Filters.svelte';
  import Table from './Table.svelte';
  import Pagination from './Pagination.svelte';

  const pageSize = 10;

  // Requested page (1-based); clamped below so it never exceeds the available pages
  let requestedPage = $state(1);

  let totalPages = $derived(Math.max(1, Math.ceil(data.filteredData.length / pageSize)));
  let currentPage = $derived(Math.min(requestedPage, totalPages));
  let pageRows = $derived(
    data.filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  );
</script>

<div class="fires-table">
  <Filters onfilter={() => (requestedPage = 1)} />

  <!-- A11Y: announces result count and current page after filter/page changes -->
  <div class="sr-only" role="status">
    {#if data.filteredData.length === 0}
      {vizLang.texts.table.noResults}
    {:else}
      {vizLang.formatIntegers(data.filteredData.length)}
      {vizLang.texts.table.days}. {vizLang.texts.table.page}
      {currentPage}
      {vizLang.texts.table.of}
      {totalPages}.
    {/if}
  </div>

  {#if data.filteredData.length === 0}
    <p class="no-results">{vizLang.texts.table.noResults}</p>
  {:else}
    <Table rows={pageRows} />
    <Pagination {currentPage} {totalPages} onpagechange={(page) => (requestedPage = page)} />
  {/if}
</div>

<style>
  .no-results {
    padding: 1.5rem 0;
    font-size: 0.9rem;
    color: var(--bw700);
    text-align: center;
  }
</style>
