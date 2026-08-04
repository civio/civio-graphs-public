// based on https://github.com/spiegelgraphics/svelte-5-utilities/blob/main/data.svelte.js

/**
 * @store Data
 *
 * This module defines a `Data` class that fetches data from a CSV file and stores it in a reactive state.
 * It also provides derived states for the region selector and the heatmap.
 *
 */

import { csv, autoType, max, extent, range, group, flatRollup, sum, descending } from 'd3';

// Days above this count are the "worst days": drives the intro/tooltip texts
// and the circle outlines in the heatmaps, so they always stay in sync.
export const severeFiresThreshold = 50;

// Single source for both territorial levels: each row is a day with active
// fires in a provincia, carrying the comunidad it belongs to
// (fecha,provincia,comunidad,incendios_activos). The comunidad reading is
// derived by summing its provincias day by day — an exact count, because
// every fire belongs to a single provincia (interprovincial mirror records
// are merged upstream in the pipeline). Ceuta is already absent from the
// file: it never has more than one active fire in a day.
const url = 'https://data.civio.es/espanaenllamas/fires-map/dias_negros/incendios_por_dia_provincia.csv';

// Shared readings over a set of day rows, used both here (whole region)
// and by the heatmap tooltip (a single year).
// Every row tied at the maximum, not just the first one: several days can
// share the same worst count and the texts/highlights must reflect that.
export function worstDays(rows) {
	const maxFires = max(rows, (d) => d.incendios_activos);
	return rows.filter((d) => d.incendios_activos === maxFires);
}

export function countSevereDays(rows) {
	return rows.filter((d) => d.incendios_activos > severeFiresThreshold).length;
}

// Everything a territorial level needs, precomputed once at load so switching
// levels is a pure lookup: the rows grouped by region name (O(1) lookup for
// the selector), the selector entries sorted by worst day, and the level-wide
// maximum so the color scale stays comparable across the level's regions.
function makeLevel(byRegion) {
	const regions = Array.from(byRegion, ([name, rows]) => ({
		name,
		worstDays: worstDays(rows),
	})).toSorted((a, b) =>
		descending(a.worstDays[0].incendios_activos, b.worstDays[0].incendios_activos)
	);
	return {
		byRegion,
		regions,
		// regions are sorted by their worst day, so the first one holds the max
		maxActiveFires: regions[0]?.worstDays[0].incendios_activos ?? 0,
	};
}

class Data {
	// Territorial level being read: picks which grouping feeds the chart.
	level = $state('comunidad');
	loading = $state(false);
	error = $state(null);

	// Explicit user selection; while undefined, `selectedRegion` falls back to
	// the active level's default region (see the getter below).
	#selectedRegion = $state(undefined);

	// Both levels of the single CSV, precomputed once after the fetch (see
	// makeLevel). `$state.raw`: only ever reassigned as a whole, so we skip
	// the deep-proxy overhead on the rows it stores.
	#datasets = $state.raw(undefined);
	#loadPromise = null;

	#dataset = $derived(this.#datasets?.[this.level]);

	// Rows of the active level, grouped by region.
	value = $derived(this.#dataset?.byRegion);

	// One entry per region with its worst days (ties included), sorted by
	// most active fires first: drives both the selector order and its labels.
	regions = $derived(this.#dataset?.regions ?? []);

	maxActiveFires = $derived(this.#dataset?.maxActiveFires ?? 0);

	// Full list of years in the dataset — the same for both levels, they share
	// the dates — so every region heatmap shows the same rows.
	years = $state.raw([]);

	// The selection defaults to the level's region with the worst day until
	// the user picks one, and again after each level switch. The setter lets
	// the selector's `bind:value` write through transparently.
	get selectedRegion() {
		return this.#selectedRegion ?? this.regions[0]?.name;
	}

	set selectedRegion(name) {
		this.#selectedRegion = name;
	}

	// Idempotent: concurrent and repeated calls share a single in-flight
	// fetch, and once loaded both levels are reused without re-fetching.
	async load() {
		if (this.#datasets) return this.#datasets;
		if (this.#loadPromise) return this.#loadPromise;

		this.loading = true;
		this.error = null;
		this.#loadPromise = (async () => {
			try {
				const rows = await csv(url, autoType);
				// One row per comunidad and day: the sum of its provincias
				const byComunidad = flatRollup(
					rows,
					(days) => sum(days, (d) => d.incendios_activos),
					(d) => d.comunidad,
					(d) => d.fecha
				).map(([comunidad, fecha, incendios_activos]) => ({ fecha, comunidad, incendios_activos }));
				this.#datasets = {
					provincia: makeLevel(group(rows, (d) => d.provincia)),
					comunidad: makeLevel(group(byComunidad, (d) => d.comunidad)),
				};
				// `range` excludes its end, so +1 to keep the last year
				const [minYear, maxYear] = extent(rows, (d) => d.fecha.getUTCFullYear());
				this.years = minYear === undefined ? [] : range(minYear, maxYear + 1);
				return this.#datasets;
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
	// switching is synchronous: no fetch, just a lookup. Clearing the
	// selection makes it fall back to the new level's default region.
	setLevel(level) {
		if (level === this.level || !this.#datasets?.[level]) return;
		this.level = level;
		this.#selectedRegion = undefined;
	}

	selectedData = $derived(this.value?.get(this.selectedRegion) ?? []);

	worstDays = $derived(this.regions.find((r) => r.name === this.selectedRegion)?.worstDays ?? []);

	totalDays = $derived(this.selectedData.length);

	// Days in the selected region above the severe threshold: feeds the
	// intro text ("Además, ha habido N días…").
	severeDaysCount = $derived(countSevereDays(this.selectedData));
}

// export a single instance of the Data class, this should only be done once per store and project
export const data = new Data();
