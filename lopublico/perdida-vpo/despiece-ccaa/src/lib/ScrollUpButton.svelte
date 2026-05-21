<script>
  import { vizLang } from '../states/language.svelte.js';
  import { cubicOut } from 'svelte/easing';

  let { onclick, visible = true } = $props();

  function scaleSlide(node, { duration = 200 } = {}) {
    const style = getComputedStyle(node);
    // style.height is "auto" inside display:none ancestors, yielding NaN
    const height = parseFloat(style.height) || 0;
    const marginTop = parseFloat(style.marginTop) || 0;
    const marginBottom = parseFloat(style.marginBottom) || 0;
    return {
      duration,
      easing: cubicOut,
      css: (t) => `
        height: ${t * height}px;
        margin-top: ${t * marginTop}px;
        margin-bottom: ${t * marginBottom}px;
        opacity: ${t};
        transform: scale(${0.8 + 0.2 * t});
        overflow: hidden;
      `,
    };
  }
</script>

{#if visible}
  <div class="scroll-up-wrapper" transition:scaleSlide={{ duration: 200 }}>
    <button type="button" class="scroll-up-button" {onclick} aria-label={vizLang.texts.nav.scrollUp}>
      <svg viewBox="0 0 24 24" width="16" height="16" focusable="false" aria-hidden="true">
        <path
          d="M6 15l6-6 6 6"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span>{vizLang.texts.nav.pickOtherCcaa}</span>
    </button>
  </div>
{/if}

<style>
  .scroll-up-wrapper {
    margin-top: 0.75rem;
    text-align: center;
  }

  .scroll-up-button {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem 0.8rem 0.3rem 0.6rem;
    border: 1px solid color-mix(in srgb, var(--primary) 40%, transparent);
    border-radius: 999px;
    background: transparent;
    color: var(--primary);
    font: inherit;
    font-size: 0.875rem;
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      color 0.15s ease,
      border-color 0.15s ease,
      scale 0.15s ease;
  }

  .scroll-up-button:hover,
  .scroll-up-button:focus-visible {
    background: var(--primary);
    color: #fff;
    border-color: var(--primary);
  }

  .scroll-up-button:active {
    scale: 0.9;
  }
</style>
