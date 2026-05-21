/**
 * @store Data (shared base)
 *
 * Shared Data class and constants used by all dataset modules (housesData).
 * Each dataset creates its own instance with optional filter/sort config.
 */

import { csv, autoType, range } from 'd3';
import { csvAliasToId } from './ccaaCatalog';

// Houses CSV (`journalist.csv`) uses legacy CCAA labels in the `ccaa` column.
// Normalise them to the canonical ids defined in ccaaCatalog at ingest time so
// every consumer downstream works with the same id shape. The alias map lives
// in ccaaCatalog alongside the rest of the CCAA metadata.

/**
 * Generic reactive data loader. Each dataset module creates its own instance.
 *
 * @param {Object} [options]
 * @param {(row: any) => boolean} [options.filter] - Row filter applied after CSV parse.
 * @param {(a: any, b: any) => number} [options.sort] - Sort comparator applied after filter.
 * @param {string} [options.ccaaField] - Column name used to match CCAA (default: 'ccaa').
 */
export class Data {
	value = $state.raw(undefined);
	loading = $state(false);
	error = $state(null);
	years = range(1991, 2031);
	#loadPromise = null;
	#filter;
	#sort;
	#ccaaField;

	constructor({ filter, sort, ccaaField = 'ccaa' } = {}) {
		this.#filter = filter;
		this.#sort = sort;
		this.#ccaaField = ccaaField;
	}

	// Load data from a URL. Idempotent: concurrent and repeated calls share the same fetch.
	async loadFromUrl(url) {
		if (this.value !== undefined) return this.value;
		if (this.#loadPromise) return this.#loadPromise;

		this.loading = true;
		this.error = null;
		this.#loadPromise = (async () => {
			try {
				let rows = await csv(url, autoType);
				const field = this.#ccaaField;
				rows = rows.map((r) => ({ ...r, [field]: csvAliasToId[r[field]] ?? r[field] }));
				if (this.#filter) rows = rows.filter(this.#filter);
				if (this.#sort) rows = rows.sort(this.#sort);
				this.value = rows;
				return this.value;
			} catch (e) {
				this.error = e.message;
				this.#loadPromise = null;
				throw e;
			} finally {
				this.loading = false;
			}
		})();
		return this.#loadPromise;
	}

	forCcaa(ccaaId) {
		return this.value?.filter((d) => d[this.#ccaaField] === ccaaId) ?? [];
	}
}
