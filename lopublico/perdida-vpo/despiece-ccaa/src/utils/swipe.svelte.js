/**
 * Creates an attachment that detects horizontal swipes on touch devices.
 * Ignores multi-touch gestures (pinch/zoom) so they don't spoof a swipe.
 * @param {Object} options
 * @param {number} [options.threshold=50] - Minimum horizontal distance (px) to count as swipe
 * @param {() => void} [options.onSwipeLeft]
 * @param {() => void} [options.onSwipeRight]
 * @returns {import('svelte/attachments').Attachment}
 */
export function swipe(options = {}) {
  const { threshold = 50, onSwipeLeft, onSwipeRight } = options;

  return (element) => {
    let startId = null;
    let startX = 0;
    let startY = 0;

    const onStart = (e) => {
      if (e.touches.length !== 1) {
        startId = null;
        return;
      }
      const t = e.touches[0];
      startId = t.identifier;
      startX = t.clientX;
      startY = t.clientY;
    };

    const onEnd = (e) => {
      if (startId === null) return;
      const t = [...e.changedTouches].find((touch) => touch.identifier === startId);
      startId = null;
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) onSwipeLeft?.();
        else onSwipeRight?.();
      }
    };

    const onCancel = () => {
      startId = null;
    };

    element.addEventListener('touchstart', onStart, { passive: true });
    element.addEventListener('touchend', onEnd, { passive: true });
    element.addEventListener('touchcancel', onCancel, { passive: true });

    return () => {
      element.removeEventListener('touchstart', onStart);
      element.removeEventListener('touchend', onEnd);
      element.removeEventListener('touchcancel', onCancel);
    };
  };
}
