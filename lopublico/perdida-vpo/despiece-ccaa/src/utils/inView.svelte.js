/**
 * Creates an attachment that fires callbacks when the element enters/exits the viewport.
 * @param {Object} options
 * @param {Element | null} [options.root] - Root element for the IntersectionObserver
 * @param {number} [options.top] - Shrink viewport from the top (px)
 * @param {number} [options.bottom] - Shrink viewport from the bottom (px)
 * @param {() => void} [options.onEnter]
 * @param {() => void} [options.onExit]
 * @returns {import('svelte/attachments').Attachment}
 */
export function inView(options = {}) {
  const { root = null, top, bottom, onEnter, onExit } = options;

  return (element) => {
    const handleIntersect = (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) onEnter?.();
      else onExit?.();
    };

    const marginTop = -(top ?? 0);
    const marginBottom = -(bottom ?? 0);
    const rootMargin = `${marginTop}px 0px ${marginBottom}px 0px`;

    const observer = new IntersectionObserver(handleIntersect, { root, rootMargin });
    observer.observe(element);

    return () => observer.disconnect();
  };
}
