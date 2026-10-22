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
    title = vizLang.texts.dataListTitle,
    /** Data rows array. Each item is a row: [col1, col2, ...] */
    items = [],
    /** Format: "list" | "table" | "auto" (auto: >10 items or >2 columns → table, otherwise → list) */
    format = 'auto',
    /** Column names for table, or [label, value] for list */
    columns = [],
    /** Visible mode: shows description visible for alt text usage (not sr-only) */
    visible = false,
    /**
     * Which part to render: "all" | "description" | "data". Splitting lets the description sit
     * before the controls and the data after them in reading order.
     */
    part = 'all',
  } = $props();

  let effectiveFormat = $derived(
    format === 'auto' ? (items.length > 10 || columns.length > 2 ? 'table' : 'list') : format
  );

  // Cells may be strings or link descriptors ({ text, href }) or arrays of them.
  // Plain text fallback used by the list format and the list-format aria string.
  function cellToText(cell) {
    if (cell == null) return '';
    if (Array.isArray(cell)) return cell.map(cellToText).filter(Boolean).join(', ');
    if (typeof cell === 'object' && 'href' in cell) return cell.text ?? cell.href ?? '';
    return String(cell);
  }

  function formatListItem(item) {
    const parts = item.map(cellToText);
    if (columns.length >= 2) {
      return `${parts[0]}: ${parts.slice(1).join(', ')}`;
    }
    return parts.join(', ');
  }
</script>

{#snippet cellContent(cell)}
  {#if Array.isArray(cell)}
    {#each cell as part, i (i)}
      {#if i > 0},
      {/if}
      {@render cellContent(part)}
    {/each}
  {:else if cell && typeof cell === 'object' && 'href' in cell}
    <a href={cell.href} target="_blank" rel="noopener noreferrer">{cell.text ?? cell.href}</a>
  {:else}
    {cell ?? ''}
  {/if}
{/snippet}

<!-- Aux, for the rest of the tema via URL parameter '?alt' -->
{#if visible}
  {#if part !== 'data'}
    <div class="alt-description">
      <p>👁️‍🗨️ ALT: {description}</p>
    </div>
  {/if}
{:else}
  <!-- For screen readers -->
  {#if part !== 'data'}
    <div class="sr-only">
      <p>{description}</p>
      <!-- "Right below" only holds when the data follows the description directly -->
      {#if items.length > 0 && part === 'all'}
        <p>
          {effectiveFormat === 'list'
            ? vizLang.texts.a11y.followingList
            : vizLang.texts.a11y.followingTable}
        </p>
      {/if}
    </div>
  {/if}

  {#if items.length > 0 && part !== 'description'}
    <div class="sr-only">
      {#if effectiveFormat === 'list'}
        <h5>{title}</h5>
        <ul>
          {#each items as item, i (i)}
            <li>{formatListItem(item)}</li>
          {/each}
        </ul>
      {:else}
        <table>
          <caption>{title}</caption>
          {#if columns.length > 0}
            <thead>
              <tr>
                {#each columns as column, i (i)}
                  <th scope="col">{column}</th>
                {/each}
              </tr>
            </thead>
          {/if}
          <tbody>
            {#each items as item, i (i)}
              <tr>
                {#each item as cell, j (j)}
                  {#if j === 0}
                    <th scope="row">
                      {@render cellContent(cell)}
                    </th>
                  {:else}
                    <td>
                      {@render cellContent(cell)}
                    </td>
                  {/if}
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  {/if}
{/if}
