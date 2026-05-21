<script>
  import { selector, isTouchDevice } from '../states/utils.svelte';
  import TouchIcon from './TouchIcon.svelte';

  /**
   * @type {{
   * sections: Array<{id: string, name: string}>,
   * selectedId: string, source: 'ip' | 'random' | 'manual' | null,
   * onchange: (id: string) => void }}
   */
  let { sections, selectedId, onchange } = $props();

  import { vizLang } from '../states/language.svelte';

  function handleChange(event) {
    onchange(event.target.value);
  }
</script>

<div class="ccaa-selector" bind:clientHeight={selector.height}>
  <select
    id="ccaa-select"
    value={selectedId}
    onchange={handleChange}
    aria-label={vizLang.texts.selector.label}
    aria-describedby="ccaa-hint"
  >
    {#each sections as section (section.id)}
      <option value={section.id}>{section.name}</option>
    {/each}
  </select>
  <p class="hint" id="ccaa-hint">
    <span style="display: inline-block;">
      <TouchIcon />
      {vizLang.texts.selector.pickOne}
    </span>
    <span style="display: inline-block;">
      {vizLang.texts.selector.navigate}
      {#if isTouchDevice.current}{vizLang.texts.selector.swipingOr}{/if}
      {vizLang.texts.selector.usingArrows}
      <svg
        viewBox="8 5 8 14"
        width="7"
        height="10"
        focusable="false"
        aria-hidden="true"
        class="arrow"
      >
        <path
          d="M15 6l-6 6 6 6"
          fill="none"
          stroke="var(--primary)"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <svg
        viewBox="8 5 8 14"
        width="7"
        height="10"
        focusable="false"
        aria-hidden="true"
        class="arrow"
      >
        <path
          d="M9 6l6 6-6 6"
          fill="none"
          stroke="var(--primary)"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>
  </p>
</div>

<style>
  .ccaa-selector {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    column-gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 0.35rem;
  }

  .hint {
    font-size: 0.85rem;
    color: var(--bw700, #333);
    font-style: italic;
    text-wrap: balance;
    line-height: 1.5;
    text-align: center;
    margin: 0;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    align-items: flex-end;
    column-gap: 0.5cap;
  }

  select {
    appearance: none;
    -webkit-appearance: none;
    font-family: inherit;
    font-size: 1.1rem;
    font-weight: 800;
    line-height: 1.2;
    padding: 0.35rem 2rem 0.35rem 0.9rem;
    border: 1px solid color-mix(in srgb, var(--primary) 70%, transparent);
    border-radius: 50px;
    color: var(--bw900, #222);
    background-color: var(--bw0, #f5f5f5);
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 6' fill='none' stroke='%23f74383' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'><path d='M1 1l4 4 4-4'/></svg>");
    background-repeat: no-repeat;
    background-position: right 0.7rem center;
    background-size: 0.7rem;
    cursor: pointer;
    transition:
      background-color 0.2s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease;
    margin-bottom: 0.5rem;
  }

  select:hover {
    background-color: color-mix(in srgb, var(--primary) 5%, transparent);
  }

  select:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent);
  }

  .arrow {
    margin: 2px;
    position: relative;
    transform-origin: center;
    animation: arrow-click 3s infinite;

    &:first-of-type {
      animation-delay: 1.5s;
    }
  }

  @media (width > 570px) {
    .arrow {
      bottom: 2px;
    }
  }

  @keyframes arrow-click {
    0%,
    50%,
    78%,
    100% {
      transform: scale(1.05);
      animation-timing-function: cubic-bezier(0.4, 0, 1, 1);
    }
    56% {
      transform: scale(0.9);
      animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    66% {
      transform: scale(1.2);
      animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
    }
  }
</style>
