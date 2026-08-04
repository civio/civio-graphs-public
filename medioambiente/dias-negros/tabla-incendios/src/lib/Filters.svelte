<script>
  import { data } from '../states/data.svelte';
  import { vizLang } from '../states/language.svelte';
  import { isMobile } from '../states/utils.svelte';
  import { cubicOut } from 'svelte/easing';
  import RadialSelector from './RadialSelector.svelte';

  // Called after any filter change so the parent can reset the pagination
  let { onfilter } = $props();

  // Level pills, in the order the texts declare them (comunidad first)
  let levelOptions = $derived(
    Object.entries(vizLang.texts.levels).map(([value, label]) => ({ value, label }))
  );

  // Like `scale`, but also collapses the space the element occupies (size,
  // padding, border and the parent's flex gap) so siblings slide smoothly
  // instead of jumping when the element enters or leaves. On mobile the button
  // sits on its own wrapped row (flex-basis: 100%), so it collapses vertically;
  // on desktop it shares the row with the selects and collapses horizontally
  function scaleCollapse(node, { duration = 300, easing = cubicOut } = {}) {
    const style = getComputedStyle(node);
    const parentStyle = getComputedStyle(node.parentElement);
    const vertical = isMobile.current;
    const size = parseFloat(vertical ? style.height : style.width);
    const paddingStart = parseFloat(vertical ? style.paddingTop : style.paddingLeft);
    const paddingEnd = parseFloat(vertical ? style.paddingBottom : style.paddingRight);
    const borderWidth = parseFloat(style.borderLeftWidth);
    const gap = parseFloat(vertical ? parentStyle.rowGap : parentStyle.columnGap) || 0;

    return {
      duration,
      easing,
      css: (t) => `
        overflow: hidden;
        white-space: nowrap;
        opacity: ${t};
        scale: ${0.8 + 0.2 * t};
        ${vertical ? 'height' : 'width'}: ${t * size}px;
        padding-${vertical ? 'top' : 'left'}: ${t * paddingStart}px;
        padding-${vertical ? 'bottom' : 'right'}: ${t * paddingEnd}px;
        border-width: ${t * borderWidth}px;
        margin-${vertical ? 'block-start' : 'inline-start'}: ${(t - 1) * gap}px;
      `,
    };
  }

  // Filter handlers: update the shared state and notify the parent
  function updateLevel(level) {
    data.setLevel(level);
    onfilter();
  }

  function updateCommunity(event) {
    data.setCommunityFilter(event.target.value === '' ? null : event.target.value);
    onfilter();
  }

  function updateProvince(event) {
    data.setProvinceFilter(event.target.value === '' ? null : event.target.value);
    onfilter();
  }

  function updateYear(event) {
    data.setYearFilter(event.target.value === '' ? null : Number(event.target.value));
    onfilter();
  }

  function updateMonth(event) {
    data.setMonthFilter(event.target.value === '' ? null : Number(event.target.value));
    onfilter();
  }

  function clearFilters() {
    data.clearFilters();
    onfilter();
  }

  // A selected province already pins the community, and a single-province
  // community already pins the province: disable the redundant select
  const communityDisabled = $derived(data.selectedProvince !== null);
  const provinceDisabled = $derived(data.selectedCommunity !== null && data.provinces.length === 1);
</script>

<div class="filters" role="group" aria-label={vizLang.texts.table.filtersLabel}>
  <div class="level">
    <RadialSelector
      options={levelOptions}
      selected={data.level}
      onchange={updateLevel}
      name="region-level"
      legend={vizLang.texts.levelLegend}
      color="var(--primary)"
    />
  </div>

  <!-- One group for all the selects, so they wrap together as a unit
     instead of splitting around the level pills -->
  <div class="filter-group">
    <div class="filter">
      <label for="community-filter">{vizLang.texts.table.community}</label>
      <select
        id="community-filter"
        value={data.selectedCommunity ?? ''}
        onchange={updateCommunity}
        disabled={communityDisabled}
        class={[data.selectedCommunity !== null && 'active']}
      >
        <option value="">{vizLang.texts.table.allCommunities}</option>
        {#each data.communities as community (community)}
          <option value={community}>{community}</option>
        {/each}
      </select>
    </div>

    <!-- Only at the provincia level: at comunidad level rows have no provincia -->
    {#if data.level === 'provincia'}
      <div class="filter" transition:scaleCollapse>
        <label for="province-filter">{vizLang.texts.table.province}</label>
        <select
          id="province-filter"
          value={data.selectedProvince ?? ''}
          onchange={updateProvince}
          disabled={provinceDisabled}
          class={[data.selectedProvince !== null && 'active']}
        >
          <option value="">{vizLang.texts.table.allProvinces}</option>
          {#each data.provinces as province (province)}
            <option value={province}>{province}</option>
          {/each}
        </select>
      </div>
    {/if}

    <div class="filter">
      <label for="year-filter">{vizLang.texts.table.year}</label>
      <select
        id="year-filter"
        value={data.selectedYear ?? ''}
        onchange={updateYear}
        class={[data.selectedYear !== null && 'active']}
      >
        <option value="">{vizLang.texts.table.allYears}</option>
        {#each data.years as year (year)}
          <option value={year}>{year}</option>
        {/each}
      </select>
    </div>

    <div class="filter">
      <label for="month-filter">{vizLang.texts.table.month}</label>
      <select
        id="month-filter"
        value={data.selectedMonth ?? ''}
        onchange={updateMonth}
        class={[data.selectedMonth !== null && 'active']}
      >
        <option value="">{vizLang.texts.table.allMonths}</option>
        <!-- Intl month names are lowercase in Spanish; capitalize them for the select -->
        {#each vizLang.monthNames as monthName, month (month)}
          <option value={month}>{monthName[0].toUpperCase() + monthName.slice(1)}</option>
        {/each}
      </select>
    </div>

    {#if data.hasActiveFilters}
      <button type="button" class="clear-filters" onclick={clearFilters} transition:scaleCollapse>
        <span aria-hidden="true" style="line-height: 1; line-height: 1cap;">x</span>
        {vizLang.texts.table.clearFilters}
      </button>
    {/if}
  </div>
</div>

<style>
  /* Two units on the same line — the level pills and the selects group —
     that wrap as a whole when the space runs out */
  .filters {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    column-gap: 1rem;
    row-gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .filter-group {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;

    /* Mobile: 2x2 grid with full-width selects, clear button on its own row */
    @media (width <= 500px) {
      display: grid;
      grid-template-columns: 1fr 1fr;
      width: 100%;
    }
  }

  .filter {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .filter label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--bw700);
    margin: 0;
    padding-left: 0.5rem;
  }

  /* The level pills legend (inside RadialSelector) matches the select labels */
  .level :global(.legend) {
    margin: 0 0 0.25rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--bw700);
  }

  .filter select {
    /* Safari ignores padding and border-radius on native selects, so drop the
       native appearance and draw our own arrow (consistent everywhere) */
    appearance: none;
    padding: 0.35rem 1.6rem 0.35rem 0.5rem;
    font-size: 0.9rem;
    color: var(--bw900);
    background-color: var(--bw0);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%23333' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.6rem center;
    background-size: 0.6rem auto;
    border: 1px solid var(--primary);
    border-radius: 50px;

    /* Full-width inside the mobile 2x2 grid */
    @media (width <= 500px) {
      width: 100%;
    }

    &.active {
      background-color: var(--light);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .clear-filters {
    display: inline-flex;
    column-gap: 5px;
    align-self: flex-end;
    align-items: center;
    padding: 0.35rem 0.75rem;
    font-size: 0.9rem;
    color: var(--bw900);
    background-color: var(--bw0);
    border: 1px solid var(--primary);
    border-radius: 50px;
    cursor: pointer;
    line-height: 1.3;

    &:hover {
      background-color: var(--light);
    }

    /* Own full-width row on mobile: the selects never reflow when the button
       enters or leaves, and the transition collapses the row vertically */
    @media (width <= 500px) {
      grid-column: 1 / -1;
      justify-content: center;
    }
  }
</style>
