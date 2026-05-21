<script>
  const {
    options = [],
    selected = '',
    onchange = () => {},
    name = 'selector',
    legend = '',
    color = 'var(--bw700)',
  } = $props();

  // Per-instance prefix for input/label IDs so multiple embeds on the same
  // page don't collide and break for/id wiring for screen readers.
  const uid = $props.id();

  // Track label dimensions so the sliding pill can match the active label.
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
    const dims = labelDims[selected];
    return dims?.width ? `left:${dims.left}px;width:${dims.width}px;background-color:${color}` : '';
  });
</script>

<div class="options-container" role="radiogroup" aria-label={legend || undefined}>
  <span class="slider" style={sliderStyle} aria-hidden="true"></span>
  {#each options as opt (opt.value)}
    <input
      type="radio"
      {name}
      id="{uid}-{name}-{opt.value}"
      checked={selected === opt.value}
      onchange={() => onchange(opt.value)}
    />
    <label
      for="{uid}-{name}-{opt.value}"
      class:active={selected === opt.value}
      {@attach trackLabel(opt.value)}
    >
      {opt.label}{#if opt.sublabel}<span class="sublabel" aria-hidden="true">{opt.sublabel}</span
        >{/if}
    </label>
  {/each}
</div>

<style>
  .options-container {
    position: relative;
    display: flex;
    align-items: stretch;
    justify-content: center;
    gap: 0.25rem;
    width: fit-content;
    height: 1.75rem;
    background: var(--bw70);
    border-radius: 50px;
    overflow: hidden;

    .slider {
      position: absolute;
      inset-block: 0;
      border-radius: 50px;
      transition:
        left 0.3s ease,
        width 0.3s ease;
      z-index: 0;
      pointer-events: none;
    }

    label {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 clamp(0.6rem, 2vw, 1rem);
      font-size: clamp(0.8rem, 3vw, 0.9rem);
      line-height: 1.2;
      text-align: center;
      color: var(--bw900);
      border-radius: 50px;
      cursor: pointer;
      position: relative;
      user-select: none;
      margin: 0;
      z-index: 1;
      transition:
        color 0.3s ease,
        transform 0.3s;

      .sublabel {
        display: block;
        font-size: 0.8rem;
        color: var(--bw600);
      }

      &:not(.active):hover {
        background: var(--bw200);
      }

      &:active {
        transform: scale(0.93);
      }

      &.active {
        color: white;

        .sublabel {
          color: var(--bw300);
        }
      }
    }

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

    input[type='radio']:focus-visible + label {
      box-shadow: inset 0 0 0 2px var(--primary);
    }
  }</style>
