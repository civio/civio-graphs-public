// based on https://github.com/spiegelgraphics/svelte-5-utilities/blob/main/data.svelte.js

/**
 * @store Data
 *
 * Fetches the journalist CSV and exposes the raw rows as reactive state.
 * Consumers aggregate via `summarize`, `summarizeByPlan`, `summarizeByPromotor`,
 * `summarizeByTenencia` for any year.
 */

import { csv, ascending, autoType, range } from 'd3';

class Data {
	value = $state.raw(undefined);
	loading = $state(false);
	error = $state(null);
	years = range(1991, 2031);
	#loadPromise = null;

	// Idempotent: concurrent and repeated calls share the same fetch.
	async loadFromUrl(url) {
		if (this.value !== undefined) return this.value;
		if (this.#loadPromise) return this.#loadPromise;

		this.loading = true;
		this.error = null;
		this.#loadPromise = (async () => {
			try {
				const rows = await csv(url, autoType);
				this.value = rows
					.filter((d) => +d.year >= 1991 && +d.value > 0)
					.sort((a, b) => ascending(a.ccaa, b.ccaa) || ascending(+a.year, +b.year));
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
}

export const data = new Data();

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

// Like parseYear but for `voluntary_release`. "Sin plazo" means there is no
// minimum waiting period — voluntary descalification is available from day
// one — so we return -Infinity so the row always enters the "maybe" state
// once built.
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

// Shared loop for the "alive viviendas grouped by X bucket" summaries.
// `fields` lists the bucket keys the classifier may return.
function summarizeByBucket(rows, year, fields, classify) {
	const totals = { built: 0, lost: 0 };
	for (const f of fields) totals[f] = 0;
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
		totals[classify(row)] += v;
	}
	return totals;
}

// `plan` in the new dataset is already normalized to 'estatal' | 'autonomico'.
export function summarizeByPlan(rows, year) {
	return summarizeByBucket(rows, year, ['estatal', 'autonomico', 'sinInfo'], (row) =>
		row.plan === 'estatal' || row.plan === 'autonomico' ? row.plan : 'sinInfo'
	);
}

// Normalises the `promotor` column into the stable bucket keys used by the
// chart.
function classifyPromotor(raw) {
	if (raw === 'publico' || raw === 'privado') return raw;
	if (raw === 'Autopromotor') return 'autopromotor';
	if (raw === 'Sin ánimo de lucro') return 'sinAnimoLucro';
	return 'sinInfo';
}

export function summarizeByPromotor(rows, year) {
	return summarizeByBucket(
		rows,
		year,
		['publico', 'privado', 'autopromotor', 'sinAnimoLucro', 'sinInfo'],
		(row) => classifyPromotor(row.promotor)
	);
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

export function summarizeByTenencia(rows, year) {
	return summarizeByBucket(
		rows,
		year,
		['propiedad', 'alquiler', 'mixto', 'sinInfo'],
		(row) => classifyTenencia(row.tenencia)
	);
}

// Headline numbers referenced by the narrative steps. Computed at the
// projection endpoint (2030) — the same horizon used by the chart when
// the proyección step (4) is revealed. Returned as preformatted strings
// so step texts can interpolate them without each step re-formatting.
const PROJECTION_END_YEAR = 2030;

export function getKeyFigures(rows, formatInt) {
	const empty = { built: 0, permanent: 0, protected: 0, maybe: 0, lost: 0 };
	const end = rows && rows.length > 0 ? summarize(rows, PROJECTION_END_YEAR) : empty;
	return {
		permanent: formatInt(end.permanent),
		temporal: formatInt(end.built - end.permanent),
		maybe: formatInt(end.maybe),
		lost: formatInt(end.lost),
	};
}
