// based on https://github.com/spiegelgraphics/svelte-5-utilities/blob/main/data.svelte.js

/**
 * @store Data
 *
 * Loads the parliaments dataset (clean CSV exported from the newsroom's Excel)
 * and exposes it as `parliaments`, with the ids and display names the cards use.
 * Figures are shown exactly as the newsroom delivered them: no derived values.
 */

import { csv, autoType } from 'd3';
import { vizLang } from './language.svelte.js';

// Region ISO code → stable parliament id. The id keys the chamber photos, the
// ?region= param, IP detection and the display-name dictionary, so it must not
// depend on how a name is spelled in the source.
const idByIso = {
  'ES-AN': 'andalucia',
  'ES-AR': 'aragon',
  'ES-AS': 'asturias',
  'ES-IB': 'baleares',
  'ES-CN': 'canarias',
  'ES-CB': 'cantabria',
  'ES-CM': 'castillalamancha',
  'ES-CL': 'castillayleon',
  'ES-CT': 'cataluna',
  'ES-VC': 'comunitatvalenciana',
  'ES-EX': 'extremadura',
  'ES-GA': 'galicia',
  'ES-RI': 'larioja',
  'ES-MD': 'madrid',
  'ES-MC': 'murcia',
  'ES-NC': 'navarra',
  'ES-PV': 'paisvasco',
};

// Every parliament id, known before the data loads. Any of them is a valid
// `view`: it shows that single card (e.g. view=galicia for a local embed).
export const parliamentIds = [...Object.values(idByIso), 'congreso', 'senado'];

// National chambers have no ISO code: their id is the source name as a slug
// ('Congreso' → 'congreso').
const slug = (name) =>
  String(name)
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replaceAll(/[^a-z]/g, '');

/**
 * @typedef {{
 *   id: string,
 *   iso: string | null,
 *   name: string,
 *   type: 'regional' | 'chamber',
 *   company: string | null,
 *   lastContract: string | null,
 *   weeklyHours: number | null,
 *   hoursBasis: 'semanal' | 'anual',
 *   annualHours: number | null,
 *   annualSalary: number | null,
 *   monthlySalary: number | null,
 *   agreementYear: number,
 *   agreementStatus: 'publicado' | 'sin_publicar' | 'sin_negociar',
 *   agreementUrl: string | null,
 *   notes: string | null,
 * }} Parliament
 */

class Data {
  // `$state.raw` instead of `$state`: the dataset is only ever reassigned,
  // never mutated in place, so we skip the deep-proxy overhead on large arrays.
  value = $state.raw(undefined);
  loading = $state(false);
  error = $state(null);
  #loadPromise = null;

  // Idempotent: concurrent and repeated calls share a single in-flight fetch,
  // and once loaded the cached value is returned without re-fetching.
  async loadFromUrl(url) {
    if (this.value !== undefined) return this.value;
    if (this.#loadPromise) return this.#loadPromise;

    this.loading = true;
    this.error = null;
    this.#loadPromise = (async () => {
      try {
        this.value = await csv(url, autoType);
        return this.value;
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

  /**
   * One entry per parliament. Display names come from the language dictionary
   * (falling back to the source name), so they follow the active language.
   * @type {Parliament[]}
   */
  parliaments = $derived(
    (this.value ?? []).map((row) => {
      const id = row.iso ? idByIso[row.iso] : slug(row.name);
      return {
        ...row,
        id,
        name: vizLang.texts.regionNames?.[id] ?? row.name,
        type: row.iso ? 'regional' : 'chamber',
      };
    })
  );

  /**
   * Parliaments shown in a view: all regions, or the single chamber.
   * @param {string} view 'regions' | 'congreso' | 'senado'
   */
  inView(view) {
    return view === 'regions'
      ? this.parliaments.filter((p) => p.type === 'regional')
      : this.parliaments.filter((p) => p.id === view);
  }
}

// export a single instance of the Data class, this should only be done once per store and project
export const data = new Data();
