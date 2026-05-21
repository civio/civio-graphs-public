// Mobile breakpoint
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
	// Attribute-based overrides (set from main.js via data-a11y / data-alt)
	attrA11y = $state(false);
	attrAlt = $state(false);
	isCivio = $derived(
		this.url.hostname.includes('civio.es') && this.url.hostname !== 'graphs.civio.es'
	);
	lang = $derived(this.url.searchParams?.get('lang'));
	a11y = $derived(this.url.searchParams?.has('a11y') || this.attrA11y);
	alt = $derived(this.url.searchParams?.has('alt') || this.attrAlt);
	// Debug: force ccaa detection mode ('ip' | 'random' | 'manual')
	mode = $derived(this.url.searchParams?.get('mode'));
	// Single-chart embed: ?ccaa=<id>&chart=area|laws
	embedCcaa = $derived(this.url.searchParams?.get('ccaa'));
	embedChart = $derived(this.url.searchParams?.get('chart'));
	isEmbed = $derived(
		!!(this.embedCcaa && (this.embedChart === 'area' || this.embedChart === 'laws'))
	);
}

export const urlInfo = new UrlInfo();

// Shared UI state across all CCAA chart instances.
class ViewState {
	planView = $state('protection');
}

export const view = new ViewState();

// Selector height
class SelectorState {
	height = $state(0);
}

export const selector = new SelectorState();

// Shared chart container width. A single ResizeObserver in App.svelte feeds
// this so every Chart instance reads the same value without owning its own
// observer, and on-demand mounts get a valid width on first paint.
class ChartLayout {
	containerWidth = $state(300);
}

export const chartLayout = new ChartLayout();
