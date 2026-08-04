/**
 * Creates an attachment that detects clicks outside of the element
 * @param {Object} options - Configuration options
 * @param {string} [options.exclude] - CSS selector for elements to exclude from detection
 * @param {() => void} [options.onClickOutside] - Callback function to execute when clicking outside
 * @returns {import('svelte/attachments').Attachment}
 */
export function clickOutside(options = {}) {
  const { exclude, onClickOutside } = options;

  return (element) => {
    const handleClick = (event) => {
      const target = event.target;

      // Check if click is on excluded elements
      if (exclude && target.closest(exclude)) {
        return;
      }

      if (!element.contains(target) && !event.defaultPrevented) {
        onClickOutside?.();
      }
    };

    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  };
}
