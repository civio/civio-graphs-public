<script>
  import { data } from '../../states/data.svelte';
  import { vizLang } from '../../states/language.svelte';
  import RadialSelector from './RadialSelector.svelte';

  // Level pills, in the order the texts declare them (comunidad first)
  let levelOptions = $derived(
    Object.entries(vizLang.texts.levels).map(([value, label]) => ({ value, label }))
  );
</script>

<div class="region-selector">
  <RadialSelector
    options={levelOptions}
    selected={data.level}
    onchange={(level) => data.setLevel(level)}
    name="region-level"
    legend={vizLang.texts.levelLegend}
    color="var(--primary)"
  />

  <div class="region-field">
    <label for="region-select">{vizLang.texts.regionLabel[data.level]}</label>
    <select id="region-select" bind:value={data.selectedRegion}>
      {#each data.regions as region (region.name)}
        <option value={region.name}>
          {region.name} ({region.worstDays[0].incendios_activos})
        </option>
      {/each}
    </select>
  </div>
</div>

<style>
  .region-selector {
    margin-bottom: 1rem;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    column-gap: 1rem;
    row-gap: 0.5rem;

    .region-field {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    select {
      /* Safari ignores padding and border-radius on native selects, so drop the
         native appearance and draw our own arrow (consistent everywhere) */
      appearance: none;
      padding: 0.35rem 1.8rem 0.35rem 0.7rem;
      background-color: var(--bw0);
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%23333' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.7rem center;
      background-size: 0.6rem auto;
      border-radius: 50px;
      border: solid 2px var(--primary);
      color: var(--bw700) !important;
      &:focus {
        background-color: var(--light);
      }
    }
  }
</style>
