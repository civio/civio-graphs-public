<script>
  let {
    options = [],
    selected = '',
    onchange = () => {},
    name = 'selector',
    legend = '',
    color = 'var(--bw700)',
  } = $props();

  // Track label dimensions for the sliding indicator
  let labelDims = $state({});

  function trackLabel(node, key) {
    function update() {
      labelDims[key] = { left: node.offsetLeft, width: node.offsetWidth };
    }
    const ro = new ResizeObserver(update);
    ro.observe(node);
    update();
    return { destroy: () => ro.disconnect() };
  }

  let sliderStyle = $derived.by(() => {
    const dims = labelDims[selected];
    return dims?.width ? `left:${dims.left}px;width:${dims.width}px;background-color:${color}` : '';
  });
</script>

<fieldset class="options-container">
  <legend class="sr-only">{legend}</legend>
  <span class="slider" style={sliderStyle}></span>
  {#each options as opt (opt.value)}
    <input
      type="radio"
      {name}
      id="{name}-{opt.value}"
      checked={selected === opt.value}
      onchange={() => onchange(opt.value)}
    />
    <label for="{name}-{opt.value}" class:active={selected === opt.value} use:trackLabel={opt.value}
      >{opt.label}{#if opt.sublabel}<span class="sublabel">{opt.sublabel}</span>{/if}</label
    >
  {/each}
</fieldset>

<style>
  .options-container {
    display: flex;
    justify-content: center;
    border: none;
    padding: 0;
    background: var(--bw70);
    width: fit-content;
    border-radius: 50px;
    position: relative;
    overflow: hidden;
    align-items: center;
    gap: 0.25rem;

    .slider {
      position: absolute;
      top: 0;
      height: 100%;
      border-radius: 50px;
      transition:
        left 0.3s ease,
        width 0.3s ease;
      z-index: 0;
      pointer-events: none;
    }

    label {
      display: flex;
      flex-direction: column;
      justify-content: center;
      cursor: pointer;
      padding: 5px;
      color: var(--bw900);
      min-height: 30px;
      border-radius: 50px;
      transition:
        color 0.3s ease,
        transform 0.3s;
      margin-bottom: 0;
      position: relative;
      z-index: 1;
      font-size: 0.9rem;
      text-align: center;
      line-height: 1.2;

      .sublabel {
        display: block;
        font-size: 0.8rem;
        /* opacity: 0.7; */
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
  }

  @media (width > 550px) {
    .options-container label {
      padding: 2px 10px;
    }
  }
</style>
