/**
 * Keyboard focus management for dialogs, shared by the chart Tooltip and the
 * share modal. Returns a pair:
 * - `attach`: an attachment for the dialog panel; moves focus into it on
 *   mount (the node needs `tabindex="-1"`) and restores the previously
 *   focused element on close.
 * - `handleTab`: Tab keydown handler; `aria-modal`/popover semantics hide the
 *   background from screen readers but don't stop Tab, so this keeps
 *   keyboard focus cycling inside the panel while it's open.
 */
export function createFocusTrap() {
  let panel = null;

  function attach(node) {
    panel = node;
    const previouslyFocused = document.activeElement;
    node.focus({ preventScroll: true });
    return () => {
      panel = null;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }

  function handleTab(event) {
    if (!panel) return;
    const focusables = [
      ...panel.querySelectorAll(
        'button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ),
    ];
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables.at(-1);
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === panel || !panel.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  }

  return { attach, handleTab };
}
