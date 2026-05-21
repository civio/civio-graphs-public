// Returns groups [{category, entries}, …] — one group per category within the CCAA.
// `rowName` is a canonical CCAA id (`andalucia`, `paisvasco`, …). Order of
// groups follows `rowIndex` (assigned in build-data.js as the category's first
// appearance). Each group renders as an independent track, so two regulations
// in different categories never collide vertically.
export function entryGroupsForRowName(entriesData, firstYear, rowName) {
	const list = entriesData?.entries ?? [];
	const matched = list.filter((e) => e.ccaa === rowName);
	const visible = matched
		.filter((e) => e.endYear >= firstYear)
		.toSorted((a, b) => a.rowIndex - b.rowIndex || a.startYear - b.startYear);

	const byCategory = new Map();
	for (const e of visible) {
		if (!byCategory.has(e.category)) byCategory.set(e.category, []);
		byCategory.get(e.category).push(e);
	}

	// stackIdx per track: if two regulations in the same category share a start column,
	// they stack vertically within their own track.
	return [...byCategory.entries()].map(([category, entries]) => {
		const sorted = entries.toSorted((a, b) => a.startYear - b.startYear);
		const counts = new Map();
		const annotated = sorted.map((e) => {
			const key = Math.max(e.startYear, firstYear);
			const idx = counts.get(key) ?? 0;
			counts.set(key, idx + 1);
			return { ...e, stackIdx: idx };
		});
		return { category, entries: annotated };
	});
}

// Builds the per-housing-type sub-rows from a CCAA row.
// Order:
//   1. latestEndYear desc — vigentes share the top because they share the max
//      endYear; obsoletes fall below by their last-used year.
//   2. latestStartYear desc — within a tied endYear, the one that started more
//      recently comes first (e.g. P. Valencià: Promoc. pública 2025–2026 above
//      the three 2024–2026 tipologías).
//   3. csvIndex asc — physical CSV row order, the editorial tiebreaker.
//
// `lastYear` is the chart's global last year (data.years[length-1]). A label
// is `isCurrent` iff it has a span ending in that year — same criterion the
// SubRow uses to render bars as "current" — so the row label opacity matches
// the bar opacity even when a CCAA has overlapping periods that don't all
// belong to the chronologically last one (e.g. CLM: 2004–2026 and 2009–2026
// coexist; both must count as current).
export function buildSubRows(row, lastYear) {
	if (!row.periods.length) return [];

	// CSV order of first appearance + the latest startYear/endYear seen for
	// each label. Periods are already chronologically sorted in build-data;
	// subs within each period preserve CSV row order.
	const csvIndex = new Map();
	const latestStartYear = new Map();
	const latestEndYear = new Map();
	for (const period of row.periods) {
		for (const sub of period.subs) {
			if (!csvIndex.has(sub.label)) csvIndex.set(sub.label, csvIndex.size);
			const prevS = latestStartYear.get(sub.label) ?? -Infinity;
			if (period.startYear > prevS) latestStartYear.set(sub.label, period.startYear);
			const prevE = latestEndYear.get(sub.label) ?? -Infinity;
			if (period.endYear > prevE) latestEndYear.set(sub.label, period.endYear);
		}
	}

	const allLabels = [...csvIndex.keys()].sort((a, b) => {
		const dy = latestEndYear.get(b) - latestEndYear.get(a);
		if (dy !== 0) return dy;
		const ds = latestStartYear.get(b) - latestStartYear.get(a);
		if (ds !== 0) return ds;
		return csvIndex.get(a) - csvIndex.get(b);
	});

	return allLabels.map((label) => {
		const spans = [];
		for (const period of row.periods) {
			const sub = period.subs.find((s) => s.label === label);
			if (sub) {
				spans.push({ startYear: period.startYear, endYear: period.endYear, ...sub });
			}
		}
		return { label, spans, isCurrent: latestEndYear.get(label) === lastYear };
	});
}
