/**
 * @store HousesData
 *
 * Houses-specific data instance and summarizers for the stacked-area chart.
 * Uses the shared Data class from data.svelte.js.
 */

import { Data } from './data.svelte';

// Data functions

// Parses a year-like field. Numeric strings/numbers → that year. Strings that
// start with a 4-digit year (e.g. "2039-11-27 00:00:00") → that year, since
// the source CSV mixes plain years with full timestamps. "Permanente" is
// handled separately via isPermanentRow. Any other non-numeric token
// ("No se permite", "Sin info pero en 2018 las tenía Vipasa", "", null) →
// Infinity, so it never falsely triggers a threshold in the past.
function parseYear(v) {
	if (typeof v === 'string') {
		const m = v.match(/^\d{4}/);
		if (m) return +m[0];
	}
	const n = +v;
	return Number.isFinite(n) && n > 0 ? n : Infinity;
}

// Like parseYear, but for `voluntary_release`. "Sin plazo" means there is no
// minimum waiting period — voluntary descalification is available from day
// one — so we return -Infinity so the row always enters the "maybe" state
// once built. "No se permite" / pending / unknown stay as Infinity (never
// trigger).
function parseVoluntaryRelease(v) {
	if (typeof v === 'string' && /^sin\s*plazo/i.test(v.trim())) return -Infinity;
	return parseYear(v);
}

// Permanent if either bound starts with "Permanente" (covers "Permanente",
// "Permanentes", trailing whitespace and longer phrases like
// "Permanente mientras no sean enajenadas y…").
function isPermanentRow(row) {
	return /^permanente/i.test(row.min_end_of_protection ?? '')
		|| /^permanente/i.test(row.max_end_of_protection ?? '');
}

// Returns one of: 'notBuilt' | 'permanent' | 'protected' | 'maybe' | 'lost'
function classifyRow(row, year) {
	const start = +row.year;
	if (year < start) return 'notBuilt';

	if (isPermanentRow(row)) return 'permanent';

	const min = parseYear(row.min_end_of_protection);
	const max = parseYear(row.max_end_of_protection);
	const desc = parseVoluntaryRelease(row.voluntary_release);

	if (year >= max) return 'lost';

	const threshold = Math.min(desc, max);
	if (year >= threshold) return 'maybe';
	return 'protected';
}

// Sums viviendas by state for a collection of rows at a given year.
export function summarize(rows, year) {
	const totals = { built: 0, permanent: 0, protected: 0, maybe: 0, lost: 0 };
	for (const row of rows) {
		const v = +row.value;
		if (!(v > 0)) continue;
		const state = classifyRow(row, year);
		if (state === 'notBuilt') continue;
		totals[state] += v;
		totals.built += v;
	}
	return totals;
}

// Sums "alive" viviendas (permanent + protected + maybe) grouped by plan bucket.
export function summarizeByPlan(rows, year) {
	const totals = { built: 0, estatal: 0, autonomico: 0, sinInfo: 0, lost: 0 };
	for (const row of rows) {
		const v = +row.value;
		if (!(v > 0)) continue;
		const state = classifyRow(row, year);
		if (state === 'notBuilt') continue;
		totals.built += v;
		if (state === 'lost') {
			totals.lost += v;
			continue;
		}
		const bucket = row.plan === 'estatal' || row.plan === 'autonomico' ? row.plan : 'sinInfo';
		totals[bucket] += v;
	}
	return totals;
}

// Normalises the `promotor` column into the stable bucket keys used by the
// chart.
function classifyPromotor(raw) {
	if (raw === 'publico' || raw === 'privado') return raw;
	if (raw === 'Autopromotor') return 'autopromotor';
	if (raw === 'Sin ánimo de lucro') return 'sinAnimoLucro';
	return 'sinInfo';
}

// Sums "alive" viviendas grouped by promotor bucket.
export function summarizeByPromotor(rows, year) {
	const totals = {
		built: 0,
		publico: 0,
		privado: 0,
		autopromotor: 0,
		sinAnimoLucro: 0,
		sinInfo: 0,
		lost: 0,
	};
	for (const row of rows) {
		const v = +row.value;
		if (!(v > 0)) continue;
		const state = classifyRow(row, year);
		if (state === 'notBuilt') continue;
		totals.built += v;
		if (state === 'lost') {
			totals.lost += v;
			continue;
		}
		totals[classifyPromotor(row.promotor)] += v;
	}
	return totals;
}

// Normalises the `tenencia` column into the buckets used by the chart.
// `alquiler_con_opcion` is grouped with `Venta o alquiler con opción a compra`
// under `mixto`: both are contracts with a purchase option, distinct from
// pure rental.
function classifyTenencia(raw) {
	if (raw === 'propiedad') return 'propiedad';
	if (raw === 'alquiler_sin_opcion' || raw === 'Alquiler u otros regímenes') return 'alquiler';
	if (raw === 'alquiler_con_opcion' || raw === 'Venta o alquiler con opción a compra') return 'mixto';
	return 'sinInfo';
}

// Sums "alive" viviendas grouped by tenencia bucket.
export function summarizeByTenencia(rows, year) {
	const totals = { built: 0, propiedad: 0, alquiler: 0, mixto: 0, sinInfo: 0, lost: 0 };
	for (const row of rows) {
		const v = +row.value;
		if (!(v > 0)) continue;
		const state = classifyRow(row, year);
		if (state === 'notBuilt') continue;
		totals.built += v;
		if (state === 'lost') {
			totals.lost += v;
			continue;
		}
		totals[classifyTenencia(row.tenencia)] += v;
	}
	return totals;
}

// Singleton instance for houses data
export const housesData = new Data({
	filter: (d) => +d.year >= 1991 && +d.value > 0,
	sort: (a, b) => a.ccaa.localeCompare(b.ccaa) || +a.year - +b.year,
});
