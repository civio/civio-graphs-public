import { urlInfo } from './utils.svelte';
import { ipRegionToId } from './ccaaCatalog';

class CcaaState {
	sections = $state([]);
	selectedId = $state(null);
	// 'ip' = detected by geolocation, 'random' = fallback, 'manual' = user changed
	source = $state(null);

	selected = $derived(this.sections.find((s) => s.id === this.selectedId));

	setSections(sections) {
		// Always sort alphabetically by display name so the dropdown and the
		// prev/next cycle stay independent of the HTML embed order.
		this.sections = [...sections].sort((a, b) =>
			a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
		);
		// Hide all sections initially; prefer the wrapper block when present
		sections.forEach((s) => ((s.blockElement ?? s.element).style.display = 'none'));
	}

	async detectAndSelect() {
		if (this.sections.length === 0) return;

		// Debug override via ?mode=ip|random|manual
		const forced = urlInfo.mode;
		if (forced === 'random' || forced === 'manual') {
			const idx = Math.floor(Math.random() * this.sections.length);
			this.selectedId = this.sections[idx].id;
			this.source = forced;
			return;
		}
		// For ?mode=ip we just continue with normal IP detection below

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 2500);
		try {
			// Testing different IP services with no luck
			// const ipInfo = await fetch('https://freeipapi.com/api/json').then((r) => r.json());
			// const ipInfo = await fetch('https://ipapi.co/json/').then((r) => r.json());
			// const ipInfo = await fetch('https://ipwho.is/').then((r) => r.json());

			const ipInfo = await fetch('https://get.geojs.io/v1/ip/geo.json', {
				signal: controller.signal,
			}).then((r) => r.json());

			if (ipInfo?.country_code === 'ES') {
				const ccaaId = ipRegionToId[ipInfo.region];
				if (ccaaId && this.sections.some((s) => s.id === ccaaId)) {
					this.selectedId = ccaaId;
					this.source = 'ip';
					return;
				}
			}
		} catch (e) {
			// Silently fall through to random
		} finally {
			clearTimeout(timeoutId);
		}

		// Fallback: random
		const idx = Math.floor(Math.random() * this.sections.length);
		this.selectedId = this.sections[idx].id;
		this.source = 'random';
	}

	select(id) {
		this.selectedId = id;
		this.source = 'manual';
	}

	prev() {
		if (this.sections.length === 0) return;
		const idx = this.sections.findIndex((s) => s.id === this.selectedId);
		const newIdx = (idx - 1 + this.sections.length) % this.sections.length;
		this.select(this.sections[newIdx].id);
	}

	next() {
		if (this.sections.length === 0) return;
		const idx = this.sections.findIndex((s) => s.id === this.selectedId);
		const newIdx = (idx + 1) % this.sections.length;
		this.select(this.sections[newIdx].id);
	}
}

export const ccaa = new CcaaState();
