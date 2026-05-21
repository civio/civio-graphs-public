/**
 * @store PlazosData
 *
 * Loads the two CSVs that feed PlazosChart from the Civio data repo and
 * transforms them on the fly into the shape the component expects:
 *   detail  → { years, rows: [{ name, periods: [{ startYear, endYear, subs }] }] }
 *   entries → { yearSlots, totalSlots, entries: [...] }
 *
 * Idempotent: shared in-flight promise, cached forever after first load.
 */

import { dsvFormat } from 'd3';
import { csvAliasToId } from './ccaaCatalog';

const MARCO_URL = 'https://data.civio.es/lopublico/desaparicion-vpo/graficos/marco-legal-estructurado.csv';
const DETALLE_URL =
	'https://data.civio.es/lopublico/desaparicion-vpo/graficos/plazos-viviendas-estructurado.csv';

const parseCsv = dsvFormat(';').parse;

// CSV `region` values → canonical ccaaCatalog ids. Every accepted raw label
// lives in the catalog's `csvAliases`; "Estatal" rows are dropped at ingest
// (no chart consumes them).
function regionToSlug(name) {
	if (name === 'Estatal') return null;
	const slug = csvAliasToId[name];
	if (!slug) {
		throw new Error(`ccaaCatalog no reconoce la región "${name}". Añade el alias en csvAliases.`);
	}
	return slug;
}

const slugify = (s) =>
	String(s ?? '')
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');

const trimOrNull = (v) => {
	const s = String(v ?? '').trim();
	return s.length ? s : null;
};

// Excel-exported CSVs carry a UTF-8 BOM that d3-dsv doesn't strip; if not
// removed, the first column header arrives as `﻿code` and parsing breaks.
const stripBom = (s) => (s.charCodeAt(0) === 0xfeff ? s.slice(1) : s);

function buildMarcoLegal(rawRows) {
	const rows = rawRows
		.map((r, csvRow) => ({
			codigo: trimOrNull(r.code),
			ccaaRaw: trimOrNull(r.region),
			categoria: trimOrNull(r.norm_type),
			anioInicio: Number(r.start_year),
			anioFin: Number(r.end_year),
			titulo: trimOrNull(r.title) ?? '',
			subtitulo: trimOrNull(r.subtitle) ?? '',
			url: trimOrNull(r.url),
			nota: trimOrNull(r.note),
			csvRow,
		}))
		.filter(
			(r) => r.ccaaRaw && r.categoria && Number.isFinite(r.anioInicio) && Number.isFinite(r.anioFin)
		)
		.map((r) => ({ ...r, ccaa: regionToSlug(r.ccaaRaw) }))
		.filter((r) => r.ccaa);

	if (!rows.length) return { yearSlots: [], totalSlots: 0, entries: [] };

	const minYear = Math.min(...rows.map((r) => r.anioInicio));
	const maxYear = Math.max(...rows.map((r) => r.anioFin));
	const yearSlots = [];
	for (let y = minYear; y <= maxYear; y++) {
		yearSlots.push({ index: y - minYear, label: String(y), startYear: y, endYear: y });
	}

	// Multiple CSV rows can share the same `code`: that signals "same regulation,
	// alternative source URLs" (original BOE link + each subsequent modification).
	// Group them so the chart shows a single dot per regulation and the tooltip
	// can list every URL.
	const groups = [];
	const byCode = new Map();
	for (const r of rows) {
		if (!r.codigo) {
			groups.push([r]);
			continue;
		}
		const existing = byCode.get(r.codigo);
		if (existing) existing.push(r);
		else {
			const arr = [r];
			byCode.set(r.codigo, arr);
			groups.push(arr);
		}
	}

	// One row per (CCAA, category): all regulations of the same category within
	// a CCAA share a track. Order of category within CCAA follows CSV appearance.
	const ccaaCategoryRows = new Map();
	const entries = groups.map((group) => {
		const r = group[0];
		if (!ccaaCategoryRows.has(r.ccaa)) ccaaCategoryRows.set(r.ccaa, new Map());
		const catMap = ccaaCategoryRows.get(r.ccaa);
		if (!catMap.has(r.categoria)) catMap.set(r.categoria, catMap.size);
		const rowIndex = catMap.get(r.categoria);

		const urls = [...new Set(group.map((g) => g.url).filter(Boolean))];

		const entry = {
			id: r.codigo ?? `${slugify(r.ccaa)}-${slugify(r.categoria)}-${r.anioInicio}-${r.csvRow}`,
			ccaa: r.ccaa,
			category: r.categoria,
			rawCategory: null,
			startYear: r.anioInicio,
			endYear: r.anioFin,
			startSlot: r.anioInicio - minYear,
			endSlot: r.anioFin - minYear,
			title: r.titulo,
			subtitle: r.subtitulo || null,
			url: urls[0] ?? null,
			urls,
			rowIndex,
		};
		if (r.nota) entry.note = r.nota;
		return entry;
	});

	return { yearSlots, totalSlots: yearSlots.length, entries };
}

/**
 * Parses the `duration` cell:
 *   "15"     → { years: 15,   isPermanent: false }
 *   "P"      → { years: null, isPermanent: true  }
 *   "10-30"  → { years: null, isPermanent: false, minYears: 10, maxYears: 30 }
 *   "15-P"   → { years: null, isPermanent: true,  minYears: 15, maxYears: null }
 *   ""       → null  (the row is dropped)
 */
function parsePlazo(raw) {
	const v = String(raw ?? '').trim();
	if (!v) return null;
	if (v === 'P') return { years: null, isPermanent: true };
	if (v.includes('-')) {
		const [aRaw, bRaw] = v.split('-').map((s) => s.trim());
		const a = Number(aRaw);
		const isPermanent = bRaw === 'P';
		const b = isPermanent ? null : Number(bRaw);
		return {
			years: null,
			isPermanent,
			minYears: Number.isFinite(a) ? a : null,
			maxYears: Number.isFinite(b) ? b : null,
		};
	}
	const n = Number(v);
	return Number.isFinite(n) ? { years: n, isPermanent: false } : null;
}

function buildPlazosDetalle(rawRows) {
	const rows = rawRows
		.map((r) => ({
			ccaaRaw: trimOrNull(r.region),
			tipologia: trimOrNull(r.housing_type),
			anioInicio: Number(r.start_year),
			anioFin: Number(r.end_year),
			plazo: parsePlazo(r.duration),
			nota: trimOrNull(r.note),
		}))
		.filter(
			(r) =>
				r.ccaaRaw &&
				r.tipologia &&
				Number.isFinite(r.anioInicio) &&
				Number.isFinite(r.anioFin) &&
				r.plazo
		)
		.map((r) => ({ ...r, ccaa: regionToSlug(r.ccaaRaw) }))
		.filter((r) => r.ccaa);

	if (!rows.length) return { years: [], rows: [] };

	const minYear = Math.min(...rows.map((r) => r.anioInicio));
	const maxYear = Math.max(...rows.map((r) => r.anioFin));
	const years = [];
	for (let y = minYear; y <= maxYear; y++) years.push(y);

	// Group by CCAA and, within each CCAA, by period (anioInicio-anioFin).
	// Each housing type within a period is a "sub". Sub order within a period
	// preserves CSV row order (relevant for the "vigentes first, then CSV order"
	// sort in plazosUtils.buildSubRows).
	const byCcaa = new Map();
	for (const r of rows) {
		if (!byCcaa.has(r.ccaa)) byCcaa.set(r.ccaa, new Map());
		const periods = byCcaa.get(r.ccaa);
		const periodKey = `${r.anioInicio}-${r.anioFin}`;
		if (!periods.has(periodKey)) {
			periods.set(periodKey, { startYear: r.anioInicio, endYear: r.anioFin, subs: [] });
		}
		const sub = { label: r.tipologia, ...r.plazo };
		if (r.nota) sub.note = r.nota;
		periods.get(periodKey).subs.push(sub);
	}

	const rowsOut = [];
	for (const [ccaa, periods] of byCcaa) {
		const sortedPeriods = [...periods.values()].toSorted((a, b) => a.startYear - b.startYear);
		rowsOut.push({
			name: ccaa,
			periods: sortedPeriods,
		});
	}

	return { years, rows: rowsOut };
}

class PlazosData {
	detail = $state.raw(undefined);
	entries = $state.raw(undefined);
	loading = $state(false);
	error = $state(null);
	#loadPromise = null;

	async load() {
		if (this.detail !== undefined && this.entries !== undefined) return;
		if (this.#loadPromise) return this.#loadPromise;

		this.loading = true;
		this.error = null;
		this.#loadPromise = (async () => {
			try {
				const ts = Date.now();
				const [marcoCsv, detalleCsv] = await Promise.all([
					fetch(`${MARCO_URL}?${ts}`).then((r) => r.text()),
					fetch(`${DETALLE_URL}?${ts}`).then((r) => r.text()),
				]);
				this.entries = buildMarcoLegal(parseCsv(stripBom(marcoCsv)));
				this.detail = buildPlazosDetalle(parseCsv(stripBom(detalleCsv)));
			} catch (err) {
				this.error = err.message;
				this.#loadPromise = null;
				throw err;
			} finally {
				this.loading = false;
			}
		})();
		return this.#loadPromise;
	}
}

export const plazosData = new PlazosData();
