// Mobile breakpoint
import { MediaQuery } from 'svelte/reactivity';

export const isMobile = new MediaQuery('(max-width: 560px)');

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
}

export const urlInfo = new UrlInfo();
