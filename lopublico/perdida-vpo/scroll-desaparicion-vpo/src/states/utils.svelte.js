import { MediaQuery } from 'svelte/reactivity';

export const isMobile = new MediaQuery('(max-width: 500px)');

// Accessibility: user prefers reduced motion
export const prefersReducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)');

// Touch device detection: covers hybrids where `pointer: coarse` alone is unreliable
const pointerCoarse = new MediaQuery('(pointer: coarse)');

class TouchDeviceState {
	current = $derived(
		(typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) || pointerCoarse.current
	);
}

export const isTouchDevice = new TouchDeviceState();

// URL info
import { SvelteURL } from 'svelte/reactivity';

class UrlInfo {
  url = $state(new SvelteURL(window.location.href));
  isCivio = $derived(
    this.url.hostname.includes('civio.es') && this.url.hostname !== 'graphs.civio.es'
  );
  lang = $derived(this.url.searchParams?.get('lang'));
  a11y = $derived(this.url.searchParams?.has('a11y'));
  alt = $derived(this.url.searchParams?.has('alt'));
  // Dossier/PDF mode: render all 6 steps stacked with a static snapshot each.
  print = $derived(this.url.searchParams?.has('print'));
}

export const urlInfo = new UrlInfo();
