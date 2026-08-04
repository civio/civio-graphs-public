// based on https://github.com/spiegelgraphics/svelte-5-utilities/blob/main/data.svelte.js

/**
 * @store Data
 *
 * This module defines a `Data` class that fetches data from a CSV file and stores it in a reactive state.
 * It also provides a derived state based on the fetched data.
 *
 */

import { csv, autoType, ascending, descending, flatRollup, sum } from 'd3';

// A ranked territorial level: rows sorted by active fires with `month`/`year`
// helpers and a sequential `order` — the position in the fully ranked level,
// unique even when several days tie on `incendios_activos`.
function makeLevel(rows) {
	return rows
		.toSorted((a, b) => descending(a.incendios_activos, b.incendios_activos))
		.map((d, i) => ({
			...d,
			month: d.fecha.getMonth(),
			year: d.fecha.getFullYear(),
			order: i + 1,
		}));
}

class Data {
	// Territorial level being read: picks which ranked dataset feeds the table.
	level = $state('comunidad');
	loading = $state(false);
	error = $state(null);
	filterCount = $state(100); // Default filter count

	// Table filters: `null` means "no filter" (show all). The comunidad filter
	// applies at both levels; the provincia filter only at the provincia level.
	selectedCommunity = $state(null);
	selectedProvince = $state(null);
	selectedYear = $state(null);
	selectedMonth = $state(null);

	// Both levels of the single CSV, precomputed once after the fetch.
	// `$state.raw` instead of `$state`: the datasets are only ever reassigned,
	// never mutated in place, so we skip the deep-proxy overhead on large arrays.
	#datasets = $state.raw(undefined);
	#loadPromise = null;

	// Ranked rows of the active level
	value = $derived(this.#datasets?.[this.level]);

	// Idempotent: concurrent and repeated calls share a single in-flight fetch,
	// and once loaded both precomputed levels are reused without re-fetching.
	async loadFromUrl(url) {
		if (this.#datasets !== undefined) return this.#datasets;
		if (this.#loadPromise) return this.#loadPromise;

		this.loading = true;
		this.error = null;
		this.#loadPromise = (async () => {
			try {
				// Cache busting: a timestamp param so the browser always fetches
				// the latest version of the data instead of a cached response
				const freshUrl = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
				const rawData = await csv(freshUrl, autoType);
				// One row per comunidad and day: the sum of its provincias — an
				// exact count, because every fire belongs to a single provincia
				const byComunidad = flatRollup(
					rawData,
					(days) => sum(days, (d) => d.incendios_activos),
					(d) => d.comunidad,
					(d) => d.fecha
				).map(([comunidad, fecha, incendios_activos]) => ({ fecha, comunidad, incendios_activos }));
				return (this.#datasets = {
					provincia: makeLevel(rawData),
					comunidad: makeLevel(byComunidad),
				});
			} catch (e) {
				this.error = e.message;
				this.#loadPromise = null; // allow a later retry after a failure
				throw e;
			} finally {
				this.loading = false;
			}
		})();
		return this.#loadPromise;
	}

	// Both levels are precomputed from the same already-loaded CSV, so
	// switching is synchronous: no fetch, just a lookup. The comunidad filter
	// survives the switch (it applies at both levels); the provincia filter
	// only makes sense at the provincia level, so it is dropped when leaving it.
	setLevel(level) {
		if (level === this.level) return;
		this.level = level;
		if (level === 'comunidad') this.selectedProvince = null;
	}

	setCommunityFilter(community) {
		this.selectedCommunity = community;
		// Chained selects: drop the province filter if it no longer belongs to
		// the selected community (`provinces` already reflects the new community)
		if (this.selectedProvince !== null && !this.provinces.includes(this.selectedProvince)) {
			this.selectedProvince = null;
		}
	}

	setProvinceFilter(province) {
		this.selectedProvince = province;
	}

	setYearFilter(year) {
		this.selectedYear = year;
	}

	setMonthFilter(month) {
		this.selectedMonth = month;
	}

	clearFilters() {
		this.selectedCommunity = null;
		this.selectedProvince = null;
		this.selectedYear = null;
		this.selectedMonth = null;
	}

	hasActiveFilters = $derived(
		this.selectedCommunity !== null ||
			this.selectedProvince !== null ||
			this.selectedYear !== null ||
			this.selectedMonth !== null
	);

	// The active level is sorted by `incendios_activos` descending, so the
	// first row holds its maximum. Used as the color scale domain end, per
	// level so bars and colors stay comparable across that level's regions.
	maxActiveFires = $derived(this.value?.[0]?.incendios_activos ?? 0);

	// Name of the region a row belongs to, according to the active level
	regionName = (row) => (this.level === 'comunidad' ? row.comunidad : row.provincia);

	// Available filter options. Both levels carry `comunidad`, so the list
	// works whatever the active level; provinces always come from the
	// provincia dataset, chained to the community filter (only the provinces
	// of the selected community, all of them when none is selected)
	communities = $derived(
		[...new Set(this.value?.map((d) => d.comunidad))].toSorted((a, b) => a.localeCompare(b, 'es'))
	);
	provinces = $derived(
		[
			...new Set(
				this.#datasets?.provincia
					.filter((d) => this.selectedCommunity === null || d.comunidad === this.selectedCommunity)
					.map((d) => d.provincia)
			),
		].toSorted((a, b) => a.localeCompare(b, 'es'))
	);
	years = $derived([...new Set(this.value?.map((d) => d.year))].toSorted(ascending));

	// Top `filterCount` days for the current filters: the filters apply to the
	// full ranked level, so rows keep their global `order` (the numbering is
	// not consecutive when filters are active). `selectedProvince` is always
	// null at the comunidad level (see setLevel), whose rows have no provincia.
	filteredData = $derived(
		(this.value ?? [])
			.filter(
				(d) =>
					(this.selectedCommunity === null || d.comunidad === this.selectedCommunity) &&
					(this.selectedProvince === null || d.provincia === this.selectedProvince) &&
					(this.selectedYear === null || d.year === this.selectedYear) &&
					(this.selectedMonth === null || d.month === this.selectedMonth)
			)
			.slice(0, this.filterCount)
	);
}

// export a single instance of the Data class, this should only be done once per store and project
export const data = new Data();
