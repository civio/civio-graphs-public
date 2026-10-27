<script>
  import { isMobile } from '../states/utils.svelte.js';
  import { vizLang } from '../states/language.svelte.js';

  let { onprev, onnext } = $props();

  // ←/→ keys move between cards, but only while the reader is on the carousel
  // (focus inside it or pointer over it): elsewhere they keep scrolling the
  // article as usual. Attached to the flank, so `area` is the card area around it.
  function arrowKeys(node) {
    if (isMobile.current) return;
    const area = node.parentElement;

    const onKeydown = (e) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      if (!area.contains(document.activeElement) && !area.matches(':hover')) return;
      const t = e.target;
      if (t instanceof HTMLElement) {
        const tag = t.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable)
          return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onprev?.();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onnext?.();
      }
    };

    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }
</script>

<!-- Flanks the card: requires a parent container with position: relative.
     Centers vertically over it and follows the page scroll. -->
<div class="nav-flank" {@attach arrowKeys}>
  <button
    type="button"
    class="nav-button nav-prev"
    onclick={onprev}
    aria-label={vizLang.texts.nav.prevRegion}
  >
    <svg viewBox="0 0 24 24" width="20" height="20" focusable="false">
      <path
        d="M15 6l-6 6 6 6"
        fill="none"
        stroke="currentColor"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button>
  <button
    type="button"
    class="nav-button nav-next"
    onclick={onnext}
    aria-label={vizLang.texts.nav.nextRegion}
  >
    <svg viewBox="0 0 24 24" width="20" height="20" focusable="false">
      <path
        d="M9 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button>
</div>

<style>
  .nav-flank {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 0;
    pointer-events: none;
    z-index: 5;
  }

  .nav-button {
    position: absolute;
    top: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--nav-button-size, 40px);
    height: var(--nav-button-size, 40px);
    padding: 0;
    border: 2px solid var(--bw700);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(2px);
    color: var(--bw700);
    cursor: pointer;
    pointer-events: auto;
    transition:
      background-color 0.15s ease,
      color 0.15s ease,
      border-color 0.15s ease,
      scale 0.15s ease;
  }

  .nav-button:focus-visible,
  .nav-button:active {
    background: var(--bw700);
    color: #fff;
    border-color: var(--bw700);
    scale: 0.9;
  }

  @media (hover: hover) {
    .nav-button:hover {
      background: var(--bw700);
      color: #fff;
      border-color: var(--bw700);
    }
  }

  /* Named so the buttons ride into the View Transitions top layer alongside the
     card; otherwise the crossfading card (which is named) paints over them for a
     moment. z-index ordering lives in App.svelte's global VT rules. */
  .nav-prev {
    view-transition-name: nav-prev;
  }
  .nav-next {
    view-transition-name: nav-next;
  }

  /* Default (narrow screens): overlaid on the card's edges. */
  .nav-prev {
    left: 6px;
    transform: translate(0, 50%);
  }
  .nav-next {
    right: 6px;
    transform: translate(0, 50%);
  }

  /* With room to spare: half outside, flanking the card. */
  @media (width > 760px) {
    .nav-prev {
      left: 0;
      transform: translate(-50%, -50%);
    }
    .nav-next {
      right: 0;
      transform: translate(50%, -50%);
    }
  }
</style>
