/**
 * Reactive singleton that tracks whether the page is currently being scrolled.
 * `isScrolling` turns true on scroll and flips back to false after 500ms of inactivity.
 *
 * The scroll listener is attached at module load — only imported in a browser
 * context (Vite SPA, no SSR), so `window` is always defined here.
 */
export const scrollActivity = $state({ isScrolling: false });

let timeout;
window.addEventListener(
  'scroll',
  () => {
    scrollActivity.isScrolling = true;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      scrollActivity.isScrolling = false;
    }, 500);
  },
  { passive: true }
);
