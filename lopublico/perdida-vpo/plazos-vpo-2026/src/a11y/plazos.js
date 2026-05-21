import { isFullyPermanent, getCurrentSubs } from '../lib/plazos/colorScale.js';

/**
 * Builds the screen-reader-friendly description of the plazos chart.
 *
 * Mirrors what the visual chart shows (only the last/current period of each
 * region) and produces a nested structure that PlazosA11y.svelte renders as
 * sr-only headings + lists, so SR users can navigate by region and read each
 * housing type with its protection period.
 *
 * @param {Array} rows - sortedRows from the data store
 * @param {object} vizLang - active language state
 */
export function getPlazosA11y(rows, vizLang) {
  const t = vizLang.texts.a11y;

  function describeDuration(sub) {
    if (isFullyPermanent(sub) && sub.minYears == null) return t.permanent;
    if (sub.years != null) return t.years(sub.years);
    if (sub.minYears != null && sub.maxYears != null)
      return t.yearsRange(sub.minYears, sub.maxYears);
    if (sub.minYears != null && sub.isPermanent) return t.yearsToPermanent(sub.minYears);
    return t.noData;
  }

  const sections = rows.map((row) => {
    const subs = getCurrentSubs(row);
    return {
      name: row.name,
      label: vizLang.ccaaLabel(row.name),
      scope: row.scope,
      summary:
        subs.length === 0 ? null : subs.length === 1 ? t.summaryOne : t.summaryMany(subs.length),
      items: subs.map((sub) => ({
        label: sub.label,
        duration: describeDuration(sub),
        note: sub.note ?? null,
      })),
    };
  });

  return {
    title: vizLang.texts.title,
    description: t.description,
    navHint: t.navHint,
    noDataLabel: t.noData,
    noteLabel: t.noteLabel,
    sections,
  };
}
