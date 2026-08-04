<script>
  import { fade, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { isMobile, prefersReducedMotion } from '../../states/utils.svelte';
  import { vizLang } from '../../states/language.svelte';
  import { createFocusTrap } from '../../utils/focusTrap';

  /**
   * Chart detail dialog: dimmed overlay with a card centered over the
   * nearest `position: relative` ancestor on desktop (the app container,
   * so it covers the whole project) and a viewport bottom sheet on mobile.
   * Clicking the overlay, the close
   * button or pressing Escape closes it. The overlay blocks interaction
   * with the chart underneath while open.
   *
   * @example
   * {#if tooltipData}
   *   <Tooltip
   *     label="Detalle: {tooltipData.name}"
   *     title={tooltipData.name}
   *     onclose={() => (tooltipData = null)}
   *   >
   *     <p>{tooltipData.value}</p>
   *   </Tooltip>
   * {/if}
   */

  let {
    /** Accessible name for the dialog */
    label,
    /** Heading shown in the panel header */
    title = '',
    /** Optional header controls rendered between the title and the close
     * button (e.g. a year stepper) */
    headerNav,
    /** Called when the user closes the tooltip (button, Escape or overlay click) */
    onclose,
    /** Tooltip content */
    children,
  } = $props();

  // On mobile the fade lasts as long as the sheet's slide: the overlay's
  // opacity also drives the children's, so a shorter fade would hide the
  // sheet before it finishes sliding out
  const fadeOpts = $derived(
    prefersReducedMotion.current ? { duration: 0 } : { duration: isMobile.current ? 300 : 100 }
  );

  // Mobile: the bottom sheet slides up from below the viewport (and back
  // down on close). Desktop keeps the plain overlay fade, so the fly is a
  // no-op there.
  const flyOpts = $derived(
    isMobile.current && !prefersReducedMotion.current
      ? { y: '100%', duration: 300, easing: cubicOut }
      : { duration: 0 }
  );

  // Lock the page scroll while the dialog is open, restoring the previous
  // value on close. On the root element (not body) so it also stops
  // wheel/touch scrolling behind the overlay inside the embed iframe.
  function lockScroll() {
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = previous;
    };
  }

  // a11y: move focus into the tooltip on mount, restore it on close, and
  // keep Tab cycling inside the dialog while it's open
  const focusTrap = createFocusTrap();

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      onclose?.();
    } else if (event.key === 'Tab') {
      focusTrap.handleTab(event);
    }
  }

  // Close only when the click lands on the overlay itself, not on the panel
  function handleOverlayClick(event) {
    if (event.target === event.currentTarget) {
      onclose?.();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  transition:fade={fadeOpts}
  class={['tooltip-overlay', isMobile.current && 'mobile']}
  onclick={handleOverlayClick}
  {@attach lockScroll}
>
  <div
    transition:fly={flyOpts}
    class="tooltip-panel"
    role="dialog"
    aria-modal="true"
    aria-label={label}
    tabindex="-1"
    {@attach focusTrap.attach}
  >
    <div class="tooltip-header">
      <h5 class="tooltip-title">{title}</h5>
      {@render headerNav?.()}
      <button
        class="close-button"
        onclick={() => onclose?.()}
        aria-label={vizLang.texts.closeTooltip}
      >
        ✕
      </button>
    </div>
    {@render children?.()}
  </div>
</div>

<style>
  /* Covers the chart container (the nearest positioned ancestor), so the
     card centers over the chart, not the viewport */
  .tooltip-overlay {
    position: absolute;
    inset: 0;
    z-index: 50;
    background-color: rgb(26 29 36 / 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100vw;
    left: calc((-100vw + 100%) / 2);
  }

  .tooltip-panel {
    box-sizing: border-box;
    width: 620px;
    max-width: calc(100vw - 32px);
    max-height: 100%;
    overflow-y: auto;
    /* If the panel itself scrolls, don't chain the scroll to the page */
    overscroll-behavior: contain;
    /* Every control in the dialog is a fast-tap target (stepper, chips,
       grid, close) — never trigger double-tap zoom inside the panel */
    touch-action: manipulation;
    background-color: white;
    border: 1px solid rgb(0 0 0 / 0.08);
    border-radius: 12px;
    box-shadow: 0 8px 28px rgb(0 42 109 / 0.18);
    padding: 18px 28px 14px;
  }

  .tooltip-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .tooltip-title {
    font-size: 1.1875rem;
    font-weight: 700;
    color: var(--bw900);
    margin: 0;
  }

  .close-button {
    width: 30px;
    height: 30px;
    flex: none;
    border: none;
    background: transparent;
    border-radius: 50%;
    color: var(--bw600);
    font-size: 0.9375rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    /* Optically align with the panel's padding edge */
    transform: translate(8px, -2px);

    &:hover {
      background-color: var(--bw70);
      color: var(--bw900);
    }
  }

  /* Mobile: bottom sheet pinned to the viewport */
  .tooltip-overlay.mobile {
    position: fixed;
    align-items: flex-end;

    & .tooltip-panel {
      width: 100%;
      max-width: none;
      max-height: calc(100dvh - 32px);
      border-radius: 16px 16px 0 0;
      border: none;
      box-shadow: 0 -8px 28px rgb(0 42 109 / 0.18);
      padding: 8px 18px 14px;
    }

    & .tooltip-title {
      font-size: 1rem;
    }

    & .close-button {
      width: 34px;
      height: 34px;
      transform: none;
    }
  }
</style>
