<script>
  import { scrollActivity } from '../utils/scrolling.svelte';
  import { isMobile } from '../states/utils.svelte.js';
  import { vizLang } from '../states/language.svelte.js';

  let { onprev, onnext } = $props();

  $effect(() => {
    if (isMobile.current) return;

    const onKeydown = (e) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
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
  });
</script>

<div class={['nav-sticky', scrollActivity.isScrolling && 'scrolling']}>
  <button
    type="button"
    class="nav-button nav-prev"
    onclick={onprev}
    aria-label={vizLang.texts.nav.prevCcaa}
  >
    <svg viewBox="0 0 24 24" width="20" height="20" focusable="false">
      <path
        d="M15 6l-6 6 6 6"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button>
  <button
    type="button"
    class="nav-button nav-next"
    onclick={onnext}
    aria-label={vizLang.texts.nav.nextCcaa}
  >
    <svg viewBox="0 0 24 24" width="20" height="20" focusable="false">
      <path
        d="M9 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button>
</div>

<style>
  .nav-sticky {
    position: sticky;
    top: 90dvh;
    height: 0;
    pointer-events: none;
    z-index: 5;
    width: 100%;
    view-transition-name: nav-sticky;
    transition: top 0.6s ease;
  }

  .nav-button {
    position: absolute;
    top: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--nav-button-size);
    height: var(--nav-button-size);
    padding: 0;
    border: 1px solid color-mix(in srgb, var(--primary) 30%, transparent);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(2px);
    color: var(--primary);
    cursor: pointer;
    pointer-events: auto;
    transition:
      background-color 0.15s ease,
      color 0.15s ease,
      border-color 0.15s ease,
      transform 0.25s ease,
      scale 0.15s ease;
  }

  .nav-button:focus-visible,
  .nav-button:active {
    background: var(--primary);
    color: #fff;
    border-color: var(--primary);
    scale: 0.9;
  }

  @media (hover: hover) {
    .nav-button:hover {
      background: var(--primary);
      color: #fff;
      border-color: var(--primary);
    }
  }

  .nav-prev {
    left: var(--nav-edge-offset);
    transform: translate(-40%, -50%);
  }

  .nav-next {
    right: var(--nav-edge-offset);
    transform: translate(40%, -50%);
  }

  @media (width > 730px) {
    .nav-sticky {
      top: 50dvh;
    }
  }

  @media (width > 865px) {
    .nav-prev {
      transform: translate(-50%, -50%);
    }

    .nav-next {
      transform: translate(50%, -50%);
    }
  }

  @media (width <= 500px) {
    .nav-sticky.scrolling .nav-prev {
      transform: translate(-160%, -50%);
    }

    .nav-sticky.scrolling .nav-next {
      transform: translate(160%, -50%);
    }
  }
</style>
