<script>
  import { inView } from '../utils/inView.svelte.js';
  import { prefersReducedMotion } from '../states/utils.svelte.js';
  // Optimized JPG (~800px, ~230KB) since the card never renders wider than ~680px.
  import dirtTexture from '../assets/dirtiness/dirt-texture.jpg?url';

  /**
   * Dirt patina over a card: base grime veiling it, a faint grime wash over
   * everything (incl. the data) and a `wipe` sheet swept off on scroll-in and
   * swept back over when the card leaves the viewport, so the reveal replays.
   * Drop it as the first child of a `position: relative; overflow: hidden` box.
   * Its layers join the card's stacking context (the root sets no z-index):
   * base grime z 1 < the card's data (z 2) < top wash z 4 < wipe cover z 5.
   * Needs the #dirt-scrub filter from DirtFilters.
   * @type {{ seed: string }} Varies the texture per card, deterministically.
   */
  let { seed } = $props();

  let visible = $state(false);

  // Per-card grime variation (flip + crop offset) so the texture doesn't read as
  // identical card to card — the eye catches the repeat. Deterministic from the
  // seed, so a given card always looks the same.
  const grimeStyle = $derived.by(() => {
    const key = String(seed);
    let h = 0;
    for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) | 0;
    const v = Math.abs(h);
    const baseFlip = `scale(${v & 1 ? -1 : 1}, ${v & 2 ? -1 : 1})`;
    const topFlip = `scale(${v & 2 ? -1 : 1}, ${v & 4 ? -1 : 1})`;
    const pos = `${(v % 5) * 25}% ${(Math.floor(v / 5) % 5) * 25}%`;
    return `--grime-flip:${baseFlip};--grime-top-flip:${topFlip};--grime-pos:${pos};`;
  });
</script>

<div
  class={['patina', visible && 'visible', prefersReducedMotion.current && 'reduced-motion']}
  style="--dirt: url({dirtTexture});{grimeStyle}"
  aria-hidden="true"
  {@attach inView({
    bottom: 80,
    onEnter: () => (visible = true),
    onExit: () => (visible = false),
  })}
>
  <div class="grime"></div>
  <div class="wash"></div>
  <div class="wipe"></div>
</div>

<style>
  /* Tunables: base grime opacity, faint top wash opacity. */
  .patina {
    position: absolute;
    inset: 0;
    pointer-events: none;
    --dirt-base-opacity: 0.3;
    --dirt-top-opacity: 0.1;
  }

  /* Registered so the wipe cover position can transition. */
  @property --wipe {
    syntax: '<percentage>';
    inherits: true;
    initial-value: -20%;
  }

  /* Shared by the three layers. Each layer sets its own background-position:
     this selector outranks a single class, so it can't hold a default here. */
  .patina > div {
    position: absolute;
    background-image: var(--dirt);
    background-size: cover;
    mix-blend-mode: multiply;
  }

  /* Base grime veiling the whole card. Bleeds past the edges (inset < 0) so the
     turbulence displacement frays OUTSIDE the card — clipped by the card's
     overflow:hidden — instead of leaving a ragged gap around the border. */
  .grime {
    inset: -28px;
    z-index: 1;
    background-position: var(--grime-pos, center);
    opacity: var(--dirt-base-opacity);
    filter: url(#dirt-scrub);
    /* Per-card flip so the grime pattern isn't identical between cards. */
    transform: var(--grime-flip);
  }

  /* Faint plain grime over everything (incl. the foreground data), flipped so it
     doesn't align with the base grime. No turbulence filter — just a low-opacity
     wash, above the data (z 2) and below the wipe cover (z 5). */
  .wash {
    inset: 0;
    background-position: center;
    z-index: 4;
    opacity: var(--dirt-top-opacity);
    /* Per-card flip (distinct from the base grime's) for extra variation. */
    transform: var(--grime-top-flip, scaleX(-1));
  }

  /* Squeegee cover: a full-card grime sheet swept off by a soft diagonal linear
     mask, uncovering the base-grimed card beneath. */
  .wipe {
    inset: -28px;
    background-position: center;
    z-index: 5;
    opacity: 0.5;
    filter: url(#dirt-scrub);
    --wipe-mask: linear-gradient(115deg, #000 var(--wipe), transparent calc(var(--wipe) + 18%));
    -webkit-mask-image: var(--wipe-mask);
    mask-image: var(--wipe-mask);
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
  }

  /* The cover slides off (skipped under reduced-motion). Snappy so it feels
     immediate when flicking between cards. */
  .patina:not(.reduced-motion) .wipe {
    transition: --wipe 1s ease-out;
  }
  .patina:not(.reduced-motion):not(.visible) .wipe {
    --wipe: 100%;
  }
</style>
