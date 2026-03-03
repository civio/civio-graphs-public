/**
 * Builds the a11y description and data table for the main chart.
 *
 * @param {Object} params
 * @param {Object} params.hierarchy - concentricHierarchy with children[].name, .yearBreakdown (Map)
 * @param {Object} params.causes - motivo dictionary from language.svelte.js
 * @param {string[]} params.years - available years
 * @param {string} params.admLabel - human label for current admin (e.g. "AGE", "Cataluña")
 * @param {string} params.sexLabel - human label for current sex filter (e.g. "Todos", "Hombres", "Mujeres")
 * @param {Function} params.formatInt - integer formatter (e.g. vizLang.formatIntegers)
 * @param {Object} params.a11yTexts - a11y texts from language.svelte.js (descriptions, tableTitle, followingTable)
 * @returns {{ description: string, title: string, columns: string[], items: string[][] }}
 */
export function buildMainChartA11y({
  hierarchy,
  causes,
  years,
  admLabel,
  sexLabel,
  formatInt,
  a11yTexts,
}) {
  if (!hierarchy?.children?.length) {
    return { description: '', title: '', columns: [], items: [] };
  }

  // Build rows: one per motivo, with year breakdown + total
  const rows = hierarchy.children
    .map((child) => {
      const code = child.name;
      const cause = causes[code.toLowerCase()] ?? {};
      const yearValues = years.map((y) => child.yearBreakdown?.get(y) ?? 0);
      const total = yearValues.reduce((s, v) => s + v, 0);
      return { code, label: cause.labelShort ?? code, type: cause.type ?? '', yearValues, total };
    })
    .sort((a, b) => b.total - a.total);

  // Table columns: Motivo | Tipo | 2020 | ... | 2025* | Total
  const columns = ['Motivo', 'Tipo', ...years.map((y) => (y === '2025' ? '2025*' : y)), 'Total'];

  const items = rows.map((r) => [
    `${r.code.toUpperCase()} - ${r.label}`,
    r.type,
    ...r.yearValues.map((v) => formatInt(v)),
    formatInt(r.total),
  ]);

  // Description from language texts
  const key = `${admLabel}-${sexLabel}`;
  const description = a11yTexts.descriptions[key] ?? '';

  const filterContext = sexLabel !== 'Todos' ? ` para ${sexLabel.toLowerCase()}` : '';
  const title = `${a11yTexts.tableTitle} (${admLabel}${filterContext})`;

  return { description, title, columns, items };
}
