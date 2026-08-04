/**
 * Returns the accessibility description for the main chart.
 * The visualization is a native HTML table (already accessible), so the
 * description carries only the summary insight — no duplicated data rows.
 * @param {import('../states/language.svelte').vizLang} vizLang - The language state object
 * @returns {import('./index').A11yDescription} The a11y description
 */
export function getMainChartA11y(vizLang) {
  return { ...vizLang.texts.a11y.mainChart };
}
