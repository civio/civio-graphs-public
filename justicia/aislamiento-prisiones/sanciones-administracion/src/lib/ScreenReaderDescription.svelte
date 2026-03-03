<script>
  import { vizLang } from '../states/language.svelte.js';

  /**
   * a11y: component for describing graphics to screen readers.
   *
   * @example
   * <ScreenReaderDescription
   *   description="Gráfico de barras que muestra ventas por región. Madrid lidera con el 45% del total."
   *   title="Ventas por región"
   *   columns={["Región", "Ventas", "Porcentaje"]}
   *   items={[
   *     ["Madrid", "45.000", "45%"],
   *     ["Barcelona", "30.000", "30%"],
   *     ["Valencia", "25.000", "25%"],
   *   ]}
   * />
   */

  let {
    /** Chart main insight (1-2 sentences) */
    description,
    /** Data section title */
    title = 'Listado completo de datos',
    /** Data rows array. Each item is a row: [col1, col2, ...] */
    items = [],
    /** Format: "list" | "table" | "auto" (auto: >10 items or >2 columns → table, otherwise → list) */
    format = 'auto',
    /** Column names for table, or [label, value] for list */
    columns = [],
    /** Visible mode: shows description visible for alt text usage (not sr-only) */
    visible = false,
  } = $props();

  let effectiveFormat = $derived(
    format === 'auto' ? (items.length > 10 || columns.length > 2 ? 'table' : 'list') : format
  );

  // For list: joins all columns into a readable string
  function formatListItem(item) {
    if (columns.length >= 2) {
      // Format: "Label: value1, value2, ..."
      return `${item[0]}: ${item.slice(1).join(', ')}`;
    }
    return item.join(', ');
  }
</script>

<!-- Aux, for the rest of the tema via URL parameter '?alt' -->
{#if visible}
  <div class="alt-description">
    <p>👁️‍🗨️ ALT: {description}</p>
  </div>
{:else}
  <!-- For screen readers -->
  <div class="sr-only">
    <p>{description}</p>
    {#if items.length > 0}
      <p>
        {effectiveFormat === 'list'
          ? vizLang.texts.a11y.followingList
          : vizLang.texts.a11y.followingTable}
      </p>
    {/if}
  </div>

  {#if items.length > 0}
    <div class="sr-only">
      <h5>{title}</h5>
      {#if effectiveFormat === 'list'}
        <ul>
          {#each items as item, i (i)}
            <li>{formatListItem(item)}</li>
          {/each}
        </ul>
      {:else}
        <table>
          {#if columns.length > 0}
            <thead>
              <tr>
                {#each columns as column, i (i)}
                  <th>{column}</th>
                {/each}
              </tr>
            </thead>
          {/if}
          <tbody>
            {#each items as item, i (i)}
              <tr>
                {#each item as cell, j (j)}
                  <td>{cell}</td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  {/if}
{/if}
