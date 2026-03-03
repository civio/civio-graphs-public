// based on https://github.com/spiegelgraphics/svelte-5-utilities/blob/main/data.svelte.js

/**
 * @store Data
 *
 * This module defines a `Data` class that fetches data from a JSON file and stores it in a reactive state.
 * It also provides a derived state based on the fetched data.
 *
 */

import { csv, rollup } from 'd3';

// Motivos excluded from the visualization (never reach 1% in any filter combination)
const excludedMotivos = new Set(['']);

/**
 * Build a hierarchy where each motivo's value is its maximum percentage
 * across ALL filter combinations (adm × sex). This ensures baseSide is
 * always large enough so filtered squares never overflow their cell.
 */
function buildMaxHierarchy(allRows) {
  const adms = [...new Set(allRows.map((d) => d.adm))];
  const sexes = ['', 'V', 'M'];
  const maxPct = new Map();

  for (const adm of adms) {
    for (const sex of sexes) {
      let rows = allRows.filter((d) => d.adm === adm);
      if (sex) rows = rows.filter((d) => d.sexo === sex);

      // Group by year to get year-specific percentages
      const byYear = new Map();
      for (const r of rows) {
        if (!byYear.has(r.year)) byYear.set(r.year, new Map());
        const ym = byYear.get(r.year);
        ym.set(r.motivo, (ym.get(r.motivo) || 0) + Number(r.total));
      }

      for (const [, motivoMap] of byYear) {
        const yearTotal = [...motivoMap.values()].reduce((s, v) => s + v, 0);
        if (!yearTotal) continue;
        for (const [motivo, count] of motivoMap) {
          const pct = count / yearTotal;
          maxPct.set(motivo, Math.max(maxPct.get(motivo) || 0, pct));
        }
      }
    }
  }

  return {
    name: 'root',
    children: Array.from(maxPct, ([name, value]) => ({
      name,
      value,
      yearBreakdown: new Map(),
    })),
  };
}

function buildConcentricHierarchy(rows) {
  const grouped = rollup(
    rows,
    (v) => v.reduce((sum, d) => sum + Number(d.total), 0),
    (d) => d.motivo,
    (d) => d.year
  );
  let grandTotal = 0;
  for (const yearMap of grouped.values()) {
    for (const v of yearMap.values()) grandTotal += v;
  }
  return {
    name: 'root',
    children: Array.from(grouped, ([name, yearMap]) => {
      const motivoTotal = [...yearMap.values()].reduce((s, v) => s + v, 0);
      return {
        name,
        value: grandTotal ? motivoTotal / grandTotal : 0,
        yearBreakdown: yearMap,
      };
    }),
  };
}

class Data {
  value = $state(undefined);
  loading = $state(false);
  error = $state(null);
  selectedYear = $state('2025');
  selectedAdm = $state('AGE');
  selectedSex = $state('');

  availableYears = ['2020', '2021', '2022', '2023', '2024', '2025'];

  availableAdms = $derived(this.value ? [...new Set(this.value.map((d) => d.adm))].sort() : []);

  // Base rows filtered by selected adm
  filteredRows = $derived((this.value ?? []).filter((d) => d.adm === this.selectedAdm));

  rows = $derived(
    this.selectedSex
      ? this.filteredRows.filter((d) => d.sexo === this.selectedSex)
      : this.filteredRows
  );

  // Total sanctions by sex (from filteredRows, which are filtered by adm + tipo)
  totalsBySex = $derived.by(() => {
    const rows = this.filteredRows;
    let all = 0;
    let V = 0;
    let M = 0;
    for (const r of rows) {
      const n = Number(r.total);
      all += n;
      if (r.sexo === 'V') V += n;
      else if (r.sexo === 'M') M += n;
    }
    return { '': all, V, M };
  });

  // Base hierarchy using max % per motivo across all (adm, sex) combinations
  baseConcentricHierarchy = $derived(this.value?.length ? buildMaxHierarchy(this.value) : null);

  // Filtered hierarchy (percentages) — for ring radii and stats
  concentricHierarchy = $derived(this.rows.length ? buildConcentricHierarchy(this.rows) : null);

  selectYear(year) {
    this.selectedYear = year;
  }

  selectSex(sex) {
    this.selectedSex = sex;
  }

  selectAdm(adm) {
    this.selectedAdm = adm;
  }

  // Load data from a URL
  async loadFromUrl(url) {
    this.loading = true;
    this.error = null;
    try {
      const raw = await csv(url);
      this.value = raw.filter((d) => !excludedMotivos.has(d.motivo));
    } catch (e) {
      this.error = e.message;
    } finally {
      this.loading = false;
    }
  }
}

// export a single instance of the Data class, this should only be done once per store and project
export const data = new Data();
