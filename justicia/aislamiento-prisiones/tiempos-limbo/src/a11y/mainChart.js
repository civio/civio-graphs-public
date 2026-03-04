/**
 * Returns the accessibility description for the main waffle chart.
 * @param {import('../states/language.svelte').vizLang} vizLang - The language state object
 * @param {Array<[string, {count: number, perc: number}]>} data - The data array of [label, {count, perc}] tuples
 * @returns {Object} The a11y description with description, title, columns, and items
 */
export function getMainChartA11y(vizLang, data = []) {
	const baseA11y = vizLang.texts.a11y.mainChart;
	const groupLabels = vizLang.texts.groupLabels;

	const items = data.map(([label, { count, perc }]) => [
		groupLabels[label] || label,
		vizLang.formatIntegers(count),
		perc >= 1 ? vizLang.formatIntegers(perc) + '%' : vizLang.formatDecimals(perc) + '%',
	]);

	return {
		...baseA11y,
		items,
	};
}
