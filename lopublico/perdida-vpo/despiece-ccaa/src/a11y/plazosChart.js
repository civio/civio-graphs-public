/**
 * Screen-reader description(s) for the per-CCAA PlazosChart timeline.
 *
 * The chart shows two layers:
 *  1) Protection-period bars per housing type, broken down by historical periods.
 *  2) Legislation tracks (laws / plans) per category, with start/end years.
 *
 * To keep each `<ScreenReaderDescription>` focused on a single dataset, this
 * helper returns an array of prop objects: one for the protection periods and,
 * if there is any associated legislation, a second one for the laws.
 *
 * @param {import('../states/language.svelte').vizLang} vizLang - Reactive language state
 * @param {Object} ctx
 * @param {string} ctx.ccaa - Display name of the autonomous community
 * @param {Object|null|undefined} ctx.row - Row from `plazos-detalle.json` (`{ name, periods }`)
 * @param {Array<Object>} ctx.entries - Legislation entries already filtered for this CCAA
 * @param {number} ctx.firstYear - First year visible in the chart
 * @param {number} ctx.lastYear - Last year visible in the chart (current period)
 * @returns {Array<Object>} Array of prop objects for `<ScreenReaderDescription>`
 */
export function getCcaaPlazosA11y(
	vizLang,
	{ ccaa, ccaaTitle, row, entries, firstYear, lastYear }
) {
	if (!row || !Array.isArray(row.periods) || row.periods.length === 0) return [];

	const copy = vizLang.texts.a11y.plazosChart;
	const periods = row.periods;
	const lastPeriod = periods[periods.length - 1];
	const currentSubs = lastPeriod?.subs ?? [];

	const periodsCount = periods.length;
	const currentTypesText =
		currentSubs.length > 0
			? currentSubs.map((s) => `${s.label} (${formatProtection(s)})`).join('; ')
			: copy.noCurrent;

	// Legislation entries visible in the chart (endYear within or after firstYear),
	// sorted chronologically, then grouped per category to count distinct categories.
	const visibleEntries = (entries ?? [])
		.filter((e) => e.endYear >= firstYear)
		.toSorted((a, b) => a.startYear - b.startYear || a.endYear - b.endYear);

	const categories = [...new Set(visibleEntries.map((e) => e.category))];
	const lawsCount = visibleEntries.length;

	const description = copy.description({
		ccaa,
		firstYear,
		lastYear,
		periodsCount,
		currentTypesText,
		lawsCount,
		categoriesCount: categories.length,
	});

	const result = [];

	// Protection periods table: one row per (period × housing type).
	const periodsItems = [];
	for (const period of periods) {
		const periodLabel =
			period.startYear === period.endYear
				? `${period.startYear}`
				: `${period.startYear}–${period.endYear}`;
		for (const sub of period.subs ?? []) {
			periodsItems.push([
				periodLabel,
				sub.label,
				formatProtection(sub),
				sub.note ?? '',
			]);
		}
	}

	result.push({
		description,
		title: copy.periodsTitle(ccaaTitle ?? ccaa),
		columns: copy.periodsColumns,
		items: periodsItems,
		format: 'table',
	});

	// Legislation table — only when there is associated legislation.
	if (visibleEntries.length > 0) {
		const tooltipCopy = vizLang.texts.plazosChart.tooltip;
		const lawsItems = visibleEntries.map((e) => {
			const range =
				e.startYear === e.endYear ? `${e.startYear}` : `${e.startYear}–${e.endYear}`;
			const urls = e.urls ?? (e.url ? [e.url] : []);
			const sources =
				urls.length === 0
					? ''
					: urls.length === 1
					? { text: tooltipCopy.viewSource, href: urls[0] }
					: urls.map((href, i) => ({ text: tooltipCopy.sourceLabel(i + 1), href }));
			return [e.title ?? '', e.subtitle ?? '', e.category ?? '', range, sources];
		});

		result.push({
			description: copy.lawsDescription({ ccaa, lawsCount, categoriesCount: categories.length }),
			title: copy.lawsTitle(ccaaTitle ?? ccaa),
			columns: copy.lawsColumns,
			items: lawsItems,
			format: 'table',
		});
	}

	return result;
}

/**
 * Human-readable protection-duration string for a sub-row entry.
 * @param {{ isPermanent?: boolean, years?: number|null, minYears?: number|null, maxYears?: number|null }} sub
 */
function formatProtection(sub) {
	if (sub.isPermanent && sub.years == null) return 'permanente';
	if (sub.years != null) return `${sub.years} años`;
	if (sub.minYears != null && sub.maxYears != null) {
		return `${sub.minYears}–${sub.maxYears} años`;
	}
	if (sub.maxYears != null) return `hasta ${sub.maxYears} años`;
	if (sub.minYears != null) return `desde ${sub.minYears} años`;
	return 'sin especificar';
}
