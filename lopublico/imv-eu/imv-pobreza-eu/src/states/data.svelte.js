// based on https://github.com/spiegelgraphics/svelte-5-utilities/blob/main/data.svelte.js

/**
 * @store Data
 *
 * Loads the Eurostat poverty threshold dataset and exposes it grouped by country,
 * with the household-type filter and the sort order the chart is driven by.
 */

import { csv, autoType } from 'd3';
import { parseAmount, parseThreshold, parseText, computeAdequacy } from '../utils/parseData';
import { vizLang } from './language.svelte';

/**
 * The three household types, in the fixed order they are always drawn in.
 * `csv` is the literal value in the source file; `key` is what the rest of the
 * app uses, so a change in the source wording only touches this table.
 */
export const householdTypes = [
  { key: 'single', csv: 'Single person' },
  { key: 'couple', csv: 'Couple' },
  { key: 'family', csv: 'Couple + 2 children' },
];

const typeByCsv = new Map(householdTypes.map((type) => [type.csv, type.key]));

class Data {
  // `$state.raw` instead of `$state`: the dataset is only ever reassigned,
  // never mutated in place, so we skip the deep-proxy overhead on large arrays.
  value = $state.raw(undefined);
  loading = $state(false);
  error = $state(null);
  #loadPromise = null;

  /**
   * Which household is shown. Always exactly one — the chart never mixes types.
   */
  selectedType = $state('single');

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

  selectType(key) {
    this.selectedType = key;
  }

  /** The single active type, wrapped in an array for downstream compatibility. */
  activeHouseholdTypes = $derived(householdTypes.filter((type) => type.key === this.selectedType));

  /**
   * One entry per country, with the three household types already parsed.
   * Independent of the filters, so toggling a checkbox never re-parses the CSV.
   *
   * @type {Array<{iso: string, country: string, rows: Record<string, {threshold: number|null, amount: number|null, adequacy: number|null, scheme: string|null}>}>}
   */
  byCountry = $derived.by(() => {
    if (!this.value) return [];

    const countries = new Map();

    for (const row of this.value) {
      const typeKey = typeByCsv.get(row.householdType);
      if (!typeKey) continue;

      if (!countries.has(row.iso)) {
        // Translated from the language dictionary; the CSV name is only a fallback for unlisted codes
        const country = vizLang.texts.countries?.[row.iso] ?? row.country;
        countries.set(row.iso, { iso: row.iso, country, rows: {} });
      }

      const threshold = parseThreshold(row.amount_poverty);
      const amount = parseAmount(row.amount_IMV);

      countries.get(row.iso).rows[typeKey] = {
        threshold,
        amount,
        adequacy: computeAdequacy(amount, threshold),
        // The benefit's own name in its country. Per household: Italy pays each one through a
        // different programme.
        scheme: parseText(row.scheme_IMV),
      };
    }

    return [...countries.values()];
  });

  /** Countries with no amount data at all, excluded from the charts. */
  excludedCountries = $derived(
    this.byCountry.filter(
      (entry) => !householdTypes.some((type) => entry.rows[type.key]?.adequacy != null)
    )
  );

  /**
   * Countries sorted by the selected household's adequacy, worst first.
   * Switching type re-sorts — the charts animate the position change.
   * Countries without data for any type sink to the bottom, alphabetically.
   */
  sortedCountries = $derived.by(() => {
    const typeKey = this.selectedType;

    const keyed = this.byCountry
      .filter((entry) => householdTypes.some((type) => entry.rows[type.key]?.adequacy != null))
      .map((entry) => ({
        ...entry,
        sortValue: entry.rows[typeKey]?.adequacy ?? null,
      }));

    return keyed.sort((a, b) => {
      if (a.sortValue == null && b.sortValue == null)
        return a.country.localeCompare(b.country, vizLang.value);
      if (a.sortValue == null) return 1;
      if (b.sortValue == null) return -1;
      return a.sortValue - b.sortValue;
    });
  });
}

// export a single instance of the Data class, this should only be done once per store and project
export const data = new Data();
