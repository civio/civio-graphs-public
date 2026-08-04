<script>
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';
  import { data } from '../states/data.svelte';
  import { vizLang } from '../states/language.svelte';
  import { fireColor, fireTextColor } from '../utils/colors.svelte';

  // Rows for the current page, already ranked and filtered
  let { rows } = $props();

  // Bar widths scale against the full dataset's maximum (not the filtered
  // one) so bars stay comparable across filters and match the color scale
  function barPercent(fires) {
    return (fires / data.maxActiveFires) * 100;
  }
</script>

<table>
  <thead>
    <tr>
      <th scope="col" class="numeric order">{vizLang.texts.table.rank}</th>
      <th scope="col" class="province">
        {data.level === 'comunidad' ? vizLang.texts.table.community : vizLang.texts.table.province}
      </th>
      <th scope="col" class="fires">{vizLang.texts.table.fires}</th>
      <th scope="col" class="date">{vizLang.texts.table.date}</th>
    </tr>
  </thead>
  <tbody>
    {#each rows as row (`${data.regionName(row)}-${row.fecha.getTime()}`)}
      {@const percent = barPercent(row.incendios_activos)}
      {@const labelOutside = percent < 15}
      <tr animate:flip={{ duration: 300 }} in:fade={{ duration: 300 }}>
        <td class="numeric order">{row.order}</td>
        <td class="province">
          {data.regionName(row)}
          <!-- At provincia level, the comunidad it belongs to as a sublabel -->
          {#if data.level === 'provincia'}
            <span class="community">{row.comunidad}</span>
          {/if}
        </td>
        <td class="fires">
          <div class="bar-track">
            <div
              class="bar"
              style:width="{percent}%"
              style:background-color={fireColor(row.incendios_activos)}
            >
              {#if !labelOutside}
                <span class="value" style:color={fireTextColor(row.incendios_activos)}>
                  {vizLang.formatIntegers(row.incendios_activos)}
                </span>
              {/if}
            </div>
            {#if labelOutside}
              <span class="value outside">{vizLang.formatIntegers(row.incendios_activos)}</span>
            {/if}
          </div>
        </td>
        <td class="date">{vizLang.formatFullDate.format(row.fecha)}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  table {
    /* civio.es forces `display: block` on all article tables (its generic
       horizontal-scroll trick: `.medioambiente .post-content table`), which
       makes the inner table shrink to its content and the columns stop
       filling the available width. Restore real table rendering. */
    display: table !important;
    width: 100%;
    /* Fixed layout: column widths come from the header, not from the visible
       rows, so they stay stable across pages and filters */
    table-layout: fixed;
    /* Separate borders so each cell paints its own border-bottom: with
       `collapse`, borders belong to the table's border grid and stay in place
       while the row's flip/fly transform moves the content */
    border-collapse: separate;
    border-spacing: 0;
    font-size: 0.85rem;
    overflow: hidden !important;
    margin-bottom: 1rem;
  }

  th.order {
    width: 10%;
  }

  th.province {
    width: 22%;
  }

  th.fires {
    width: 40%;
  }

  th.date {
    width: 28%;
    text-align: right;
  }

  th,
  td {
    padding: 0.5rem 0.75rem;
    text-align: left;
    border-bottom: 1px solid var(--bw200);
    align-content: center;
  }

  th.order,
  tr td.order {
    padding: 0;
  }

  th {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--bw700);
    border-bottom: 2px solid var(--primary);
  }

  tr:hover {
    background: transparent !important;
  }

  .numeric {
    text-align: center;
    font-variant-numeric: tabular-nums;
  }

  tbody td.order {
    font-size: 0.7rem;
    text-align: center;
  }

  td.province {
    font-size: 0.9rem;
    font-weight: bold;
    line-height: 1.2;
  }

  .community {
    display: block;
    font-size: 0.7rem;
    font-weight: normal;
    color: var(--bw600);
  }

  .bar-track {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    width: 100%;
  }

  .bar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    height: 1.1rem;
    min-width: 3px;
    padding-right: 0.35rem;
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .value {
    font-weight: bold;
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .value.outside {
    color: var(--bw900);
  }

  tbody td.date {
    font-size: 0.75rem;
    line-height: 1.3;
    text-align: right;
  }

  @media (width > 500px) {
    tbody td.date {
      font-size: 0.85rem;
    }
  }

  tbody tr:hover {
    background-color: var(--bw100);
  }

  /* Mobile: no column headers; each row becomes a grid with the rank on the
     left, province + date sharing the first line and the bar spanning below */
  @media (width <= 500px) {
    /* Visually hidden instead of `display: none` so the column headers stay
       in the accessibility tree and keep labelling the cells */
    thead {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    table,
    tbody {
      display: block !important;
    }

    tbody {
      border-top: 2px solid var(--primary);
    }

    tbody tr {
      display: grid;
      grid-template-columns: 2rem 1fr auto;
      grid-template-rows: auto auto;
      align-items: center;
      column-gap: 0.5rem;
      row-gap: 0.25rem;
      padding: 0.5rem 5px;
      border-bottom: 1px solid var(--civio-yellow);
    }

    tbody td {
      border: none;
      padding: 0;
    }

    th,
    td,
    tbody td.order {
      display: block;
      padding: 0;
      border-bottom: none;
    }

    tbody td.order {
      grid-row: 1 / 3;
    }

    td.province {
      grid-column: 2;
      grid-row: 1;
    }

    .community {
      display: none;
    }

    tbody td.date {
      grid-column: 3;
      grid-row: 1;
    }

    td.fires {
      grid-column: 2 / 4;
      grid-row: 2;
    }
  }
</style>
