import { sum } from 'd3';

/**
 * Returns the accessibility description for the main stacked bar chart.
 * @param {import('../states/language.svelte').vizLang} vizLang - The language state object
 * @param {Array<Object>} grouped - The grouped data (year → administrations → categories)
 * @param {string} type - 'sancion' or 'proteccion'
 * @returns {import('./index').A11yDescription}
 */
export function getMainChartA11y(vizLang, grouped, type) {
	const baseA11y = vizLang.texts.a11y.mainChart[type] ?? vizLang.texts.a11y.mainChart.sancion;
	const admDict = vizLang.texts.a11y.admDict;
	const formatInt = vizLang.formatIntegers;

	const admKeys = ['AGE', 'CAT', 'PV'];

	const items = (grouped ?? []).map((yearGroup) => {
		const cells = [yearGroup.year];
		const admMap = new Map(yearGroup.data.map((d) => [d.adm, d]));
		for (const key of admKeys) {
			const admData = admMap.get(key);
			if (admData) {
				const ratio = Math.round(sum(admData.categories, (c) => +c.relX1000));
				const total = formatInt(sum(admData.categories, (c) => +c.total));
				cells.push(`${ratio}‰ (${total})`);
			} else {
				cells.push('—');
			}
		}
		return cells;
	});

	return {
		description: baseA11y.description,
		title: baseA11y.title,
		columns: ['Año', ...admKeys.map((k) => admDict[k])],
		format: 'table',
		items,
	};
}
