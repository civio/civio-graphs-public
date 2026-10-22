<script>
  import { data, householdTypes } from '../states/data.svelte';
  import { vizLang } from '../states/language.svelte';

  import personIcon from '../assets/people/person.png';
  import coupleIcon from '../assets/people/couple.png';
  import familyIcon from '../assets/people/family.png';

  const householdIcons = { single: personIcon, couple: coupleIcon, family: familyIcon };

  // Per-instance prefix for input/label IDs and the group name, so embeds don't collide.
  const uid = $props.id();

  // Track label dimensions so the sliding pill can match the selected option (same as RadialSelector).
  const labelDims = $state({});

  function trackLabel(key) {
    return (node) => {
      const update = () => {
        labelDims[key] = { left: node.offsetLeft, width: node.offsetWidth };
      };
      const ro = new ResizeObserver(update);
      ro.observe(node);
      update();
      return () => ro.disconnect();
    };
  }

  const sliderStyle = $derived.by(() => {
    const dims = labelDims[data.selectedType];
    return dims?.width ? `left:${dims.left}px;width:${dims.width}px` : '';
  });
</script>

<!--
  Native radios, like RadialSelector: arrow keys, a single tab stop and "1 of 3" come with the
  element, where buttons with role="radio" only announced a behaviour they did not have.
-->
<div class="household-filter" role="radiogroup" aria-label={vizLang.texts.householdLegend}>
  <span class="slider" style={sliderStyle} aria-hidden="true"></span>
  {#each householdTypes as type (type.key)}
    {@const selected = data.selectedType === type.key}
    <input
      type="radio"
      name="{uid}-household"
      id="{uid}-household-{type.key}"
      checked={selected}
      onchange={() => data.selectType(type.key)}
    />
    <label
      for="{uid}-household-{type.key}"
      class="option"
      class:active={selected}
      {@attach trackLabel(type.key)}
    >
      <img class="household-icon" src={householdIcons[type.key]} alt="" />
      <span class="option-label">{vizLang.texts.household[type.key]}</span>
    </label>
  {/each}
</div>

<style>
  /* Same visual language as RadialSelector: light grey track, dark grey sliding chip with white content */
  .household-filter {
    position: relative;
    display: flex;
    align-items: stretch;
    justify-content: center;
    gap: 0.25rem;
    width: fit-content;
    background: var(--bw70);
    border-radius: 1.5rem;
  }

  .slider {
    position: absolute;
    inset-block: 0;
    background: var(--bw700);
    border-radius: 1.5rem;
    z-index: 0;
    pointer-events: none;
  }

  .option {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    margin: 0;
    padding: 0.35rem 0.9rem 0.4rem;
    border-radius: 1.5rem;
    font-size: 0.75rem;
    line-height: 1.1;
    text-align: center;
    color: var(--bw900);
    cursor: pointer;
    user-select: none;

    &:not(.active):hover {
      background: var(--bw200);
    }

    &:active {
      transform: scale(0.93);
    }

    &.active {
      color: white;
      font-weight: 700;

      /* Icons are transparent PNGs: this turns the silhouette white and keeps the chalk texture */
      .household-icon {
        filter: brightness(0) invert(1);
      }
    }
  }

  .household-icon {
    height: 1.6rem;
    width: auto;
    margin-bottom: 3px;
  }

  /* Visually hidden but focusable: the label is what people see and click */
  input[type='radio'] {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* --civio-blue fallback: projects created without an area have no --primary */
  input[type='radio']:focus-visible + .option {
    box-shadow: inset 0 0 0 2px var(--primary, var(--civio-blue));
  }

  @media (prefers-reduced-motion: no-preference) {
    .slider {
      transition:
        left 0.3s ease,
        width 0.3s ease;
    }

    .option,
    .household-icon {
      transition:
        color 0.3s ease,
        background-color 0.3s ease,
        filter 0.3s ease,
        transform 0.3s;
    }
  }
</style>
