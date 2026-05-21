<script>
  import { vizLang } from '../states/language.svelte.js';

  /**
   * a11y: renders a chart description + data table for screen readers.
   *
   * @example
   * <ScreenReaderDescription
   *   description="Gráfico de barras que muestra ventas por región."
   *   columns={['Región', 'Ventas']}
   *   items={[['Madrid', '45.000'], ['Barcelona', '30.000']]}
   * />
   */

  const {
    /** Chart main insight (1-2 sentences) */
    description,
    /** Data rows array. Each item is a row: [col1, col2, ...] */
    items = [],
    /** Column names */
    columns = [],
    /** When true, render description visibly (alt-text mode) instead of sr-only */
    visible = false,
  } = $props();
</script>

{#if visible}
  <div class="alt-description">
    <p>👁️‍🗨️ ALT: {description}</p>
  </div>
{:else}
  <div class="sr-only">
    <p>{description}</p>
    {#if items.length > 0}
      <p>{vizLang.texts.a11y.followingTable}</p>
    {/if}
  </div>

  {#if items.length > 0}
    <div class="sr-only">
      <table>
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
                  <th scope="row">{cell}</th>
                {:else}
                  <td>{cell}</td>
                {/if}
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
{/if}
