/**
 * @store PlazosData
 *
 * Loads the plazos CSV from the Civio data repo and transforms it into the
 * shape PlazosVigentes expects:
 *   detail → { rows: [{ name, scope, subs }] }
 *
 * Only the current regulation (end_year === 2026) is kept; older periods are
 * dropped at parse time so the rest of the app doesn't need to choose a period.
 *
 * Idempotent: shared in-flight promise, cached forever after first load.
 */

import { dsvFormat } from 'd3';
import { csvAliasToId } from './ccaaCatalog';

const detalleUrl =
  'https://data.civio.es/lopublico/desaparicion-vpo/graficos/plazos-viviendas-estructurado.csv';

const parseCsv = dsvFormat(';').parse;

const CURRENT_END_YEAR = 2026;

// Maps a raw CSV region name to a canonical CCAA id. The alias table lives in
// ccaaCatalog.js (one row per CCAA bundles every known variant). "Estatal" is
// handled apart with its own 'estatal' pseudo-id (scope: 'estatal').
function regionToSlug(name) {
  if (name === 'Estatal') return 'estatal';
  const slug = csvAliasToId[name];
  if (!slug) {
    throw new Error(
      `ccaaCatalog no contiene un alias CSV para "${name}". Añádelo a csvAliases en ccaaCatalog.js.`
    );
  }
  return slug;
}

const trimOrNull = (v) => {
  const s = String(v ?? '').trim();
  return s.length ? s : null;
};

// Excel-exported CSVs carry a UTF-8 BOM that d3-dsv doesn't strip; if not
// removed, the first column header arrives as `﻿code` and parsing breaks.
const stripBom = (s) => (s.charCodeAt(0) === 0xfeff ? s.slice(1) : s);

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
  const byCcaa = new Map();
  for (const r of rawRows) {
    if (Number(r.end_year) !== CURRENT_END_YEAR) continue;
    const regionRaw = trimOrNull(r.region);
    const housingType = trimOrNull(r.housing_type);
    const duration = parsePlazo(r.duration);
    if (!regionRaw || !housingType || !duration) continue;

    const ccaa = regionToSlug(regionRaw);
    const sub = { label: housingType, ...duration };
    const note = trimOrNull(r.note);
    if (note) sub.note = note;

    if (!byCcaa.has(ccaa)) byCcaa.set(ccaa, []);
    byCcaa.get(ccaa).push(sub);
  }

  const rows = Array.from(byCcaa, ([name, subs]) => ({
    name,
    scope: name === 'estatal' ? 'estatal' : 'ccaa',
    subs,
  }));

  return { rows };
}

class PlazosData {
  detail = $state.raw(undefined);
  loading = $state(false);
  error = $state(null);
  #loadPromise = null;

  async load() {
    if (this.detail !== undefined) return;
    if (this.#loadPromise) return this.#loadPromise;

    this.loading = true;
    this.error = null;
    this.#loadPromise = (async () => {
      try {
        const ts = Date.now();
        const detalleCsv = await fetch(`${detalleUrl}?${ts}`).then((r) => r.text());
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
