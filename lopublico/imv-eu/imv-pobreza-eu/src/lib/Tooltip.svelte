<script>
  import { fade } from 'svelte/transition';
  import { clickOutside } from '../utils/clickOutside.svelte';
  import { isMobile, prefersReducedMotion } from '../states/utils.svelte';
  import { vizLang } from '../states/language.svelte';

  /**
   * Generic chart tooltip: anchored popover on desktop, centered modal on mobile.
   *
   * Render it inside a `position: relative` chart container — the overlay
   * covers that container, so `position` coordinates are relative to it.
   *
   * Pass `hover` for a pointer-following tooltip: no focus stealing, no close
   * button, and transparent to the mouse, so it can track the cursor without
   * flickering. The default (click/tap) mode keeps the dismissible dialog.
   *
   * @example
   * {#if tooltipData}
   *   <Tooltip
   *     label="Detalle: {tooltipData.name}"
   *     position={{ x: tooltipData.x, y: tooltipData.y }}
   *     onclose={() => (tooltipData = null)}
   *   >
   *     <p>{tooltipData.name}: {tooltipData.value}</p>
   *   </Tooltip>
   * {/if}
   */

  let {
    /** Accessible name for the dialog */
    label,
    /** Anchor point in px, relative to the chart container (desktop only) */
    position = { x: 0, y: 0 },
    /** Called when the user closes the tooltip (button, Escape or click outside) */
    onclose,
    /** Tooltip content */
    children,
    /**
     * Follow-the-pointer mode: decorative, non-focusable and click-through.
     * Use it for hover; leave it off for the tap-to-open dialog.
     */
    hover = false,
  } = $props();

  // No fade while following the pointer: it would lag a step behind the cursor,
  // and a bidirectional transition that keeps getting reversed mid-flight leaves
  // the node behind when the block is finally destroyed.
  const fadeOpts = $derived(
    hover || prefersReducedMotion.current ? { duration: 0 } : { duration: 100 }
  );

  // a11y: move focus into the tooltip on mount, restore it on close.
  // A hover tooltip must not do this: the pointer would yank keyboard focus
  // across the page on every row it crosses.
  function manageFocus(node) {
    if (hover) return;

    const previouslyFocused = document.activeElement;
    node.focus({ preventScroll: true });
    return () => previouslyFocused?.focus?.({ preventScroll: true });
  }

  function handleKeydown(event) {
    if (!hover && event.key === 'Escape') {
      onclose?.();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div transition:fade={fadeOpts} class={['chart-tooltip', isMobile.current ? 'mobile' : 'desktop']}>
  <div
    class={['tooltip-info', hover && 'hover']}
    role={hover ? 'presentation' : 'dialog'}
    aria-label={hover ? undefined : label}
    aria-hidden={hover ? 'true' : undefined}
    tabindex="-1"
    style={!isMobile.current
      ? `position:absolute;top:${position.y}px;left:${position.x}px;transform:translate(-50%, -110%)`
      : ''}
    {@attach manageFocus}
    {@attach clickOutside({
      onClickOutside: () => !hover && onclose?.(),
    })}
  >
    {#if !hover}
      <button
        class="close-button"
        onclick={() => onclose?.()}
        aria-label={vizLang.texts.closeTooltip}
      >
        ×
      </button>
    {/if}
    {@render children?.()}
  </div>
</div>

<style>
  /* Overlay covering the (position: relative) chart container */
  .chart-tooltip {
    position: absolute;
    inset: 0;
    z-index: 10;
  }

  .chart-tooltip.mobile {
    display: flex;
    align-items: center;
    justify-content: center;

    .tooltip-info {
      max-height: 95%;
      overflow-y: auto;
    }
  }

  /* Desktop: the overlay must not block chart interaction, only the popover does */
  .chart-tooltip.desktop {
    pointer-events: none;

    .tooltip-info {
      pointer-events: auto;
      min-width: 200px;
    }

    /* Following the cursor: capturing it would make the tooltip flicker as it
       slides under the pointer and steals the chart's mousemove events. */
    .tooltip-info.hover {
      pointer-events: none;
    }
  }

  .tooltip-info {
    background-color: white;
    max-width: 340px;
    width: 90%;
    border: 2px solid var(--bw990);
    border-radius: 10px;
    padding: 0.625rem;
    position: relative;
    box-shadow: 0 0 10px rgb(0 0 0 / 0.3);
  }

  .close-button {
    cursor: pointer;
    transition: transform 0.3s;
    background: none;
    border: none;
    font-size: 1rem;
    line-height: 1;
    position: absolute;
    right: 8px;
    top: 5px;

    &:active {
      transform: scale(0.93);
    }
  }
</style>
