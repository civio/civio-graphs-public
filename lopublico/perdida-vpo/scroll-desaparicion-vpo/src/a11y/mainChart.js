import {
	summarize,
	summarizeByPlan,
	summarizeByPromotor,
	summarizeByTenencia,
	getKeyFigures,
} from '../states/data.svelte';
import {
	texts as stepTexts,
	areaSum,
	stackOrder as protectionStackOrder,
	firstProjectionYear,
} from '../states/steps.svelte';

/**
 * Screen-reader description for the national stacked-area chart.
 *
 * @param {import('../states/language.svelte').vizLang} vizLang - Reactive language state
 * @param {Object} ctx
 * @param {Array<Object>} ctx.rows - All CSV rows (national aggregate)
 * @param {number[]} ctx.years - Years in the x-axis domain
 * @param {number} ctx.firstProjectionYear - First year whose values are a projection
 * @param {number} ctx.step - Active narrative step (-1 if before/after the scrolly)
 * @param {'protection' | 'plan' | 'promotor' | 'tenencia'} ctx.planView - Active stack grouping
 * @returns {Object|null} Props for ScreenReaderDescription, or null when data is not ready
 */

// Alternate (bucketed) views config. `protection` is special-cased in the
// function body because it uses different column fields.
const bucketViews = {
	plan: {
		summarize: summarizeByPlan,
		fields: ['estatal', 'autonomico', 'sinInfo'],
	},
	promotor: {
		summarize: summarizeByPromotor,
		fields: ['publico', 'privado', 'autopromotor', 'sinAnimoLucro', 'sinInfo'],
	},
	tenencia: {
		summarize: summarizeByTenencia,
		fields: ['propiedad', 'alquiler', 'mixto', 'sinInfo'],
	},
};

export function getMainChartA11y(
	vizLang,
	{ rows, years, firstProjectionYear, planView, step = -1 }
) {
	if (!rows || rows.length === 0) return null;

	const copy = vizLang.texts.mainChart;
	const a11y = copy.a11y;
	const areaLabels = copy.areaLabels;
	const fmt = vizLang.formatIntegers;
	const lastYear = step >= 4 ? years.at(-1) : firstProjectionYear - 1;
	const projection = (year) =>
		year >= firstProjectionYear ? `${year}${copy.projectionSuffix}` : `${year}`;

	const figures = getKeyFigures(rows, fmt);
	const description =
		step >= 0 && step < stepTexts.length ? stepTexts[step].a11y(figures) : '';

	let columns;
	let items;
	const yearsInRange = years.filter((y) => y <= lastYear);

	if (planView === 'protection') {
		if (step === 0) {
			// Only the built line is visible: show what was built each year + cumulative.
			columns = a11y.columns.step0;
			let prevBuilt = 0;
			items = yearsInRange.map((year) => {
				const t = summarize(rows, year);
				const delta = t.built - prevBuilt;
				prevBuilt = t.built;
				return [projection(year), fmt(delta), fmt(t.built)];
			});
		} else {
			// Mirror what the chart actually paints: derive visible areas from
			// areaSum() so the table matches the stacked layers at this step.
			const visibleAreas = protectionStackOrder.filter(
				(key) => areaSum(key, step).length > 0
			);
			const [yearCol, builtCol] = a11y.columns.protection;
			columns = [yearCol, builtCol, ...visibleAreas.map((k) => areaLabels[k])];
			items = yearsInRange.map((year) => {
				const t = summarize(rows, year);
				return [
					projection(year),
					fmt(t.built),
					...visibleAreas.map((areaKey) => {
						const sumKeys = areaSum(areaKey, step);
						return fmt(sumKeys.reduce((s, k) => s + (t[k] ?? 0), 0));
					}),
				];
			});
		}
	} else {
		const view = bucketViews[planView];
		columns = a11y.columns[planView];
		items = yearsInRange.map((year) => {
			const p = view.summarize(rows, year);
			return [
				projection(year),
				fmt(p.built),
				...view.fields.map((f) => fmt(p[f])),
				fmt(p.lost),
			];
		});
	}

	return {
		description,
		columns,
		items,
	};
}

// Per-dimension bucket-field config reused by getAltText below. `protection`
// is special-cased since it uses fixed fields.
const altBuckets = {
	plan: { summarize: summarizeByPlan, fields: ['estatal', 'autonomico', 'sinInfo'] },
	promotor: {
		summarize: summarizeByPromotor,
		fields: ['publico', 'privado', 'autopromotor', 'sinAnimoLucro', 'sinInfo'],
	},
	tenencia: {
		summarize: summarizeByTenencia,
		fields: ['propiedad', 'alquiler', 'mixto', 'sinInfo'],
	},
};

/**
 * Single comprehensive alt text describing the chart at its final interactive
 * step, varying with the selected planView. Intended for journalists to copy
 * alongside a screenshot — not exposed to screen readers.
 *
 * @param {import('../states/language.svelte').vizLang} vizLang
 * @param {Object} ctx
 * @param {Array<Object>} ctx.rows
 * @param {'protection'|'plan'|'promotor'|'tenencia'} ctx.planView
 * @returns {string}
 */
export function getAltText(vizLang, { rows, planView }) {
	if (!rows || rows.length === 0) return '';

	const tpl = vizLang.texts.altDescription?.[planView];
	if (!tpl) return '';

	const fmt = vizLang.formatIntegers;
	const lastYear = firstProjectionYear - 1;
	const projectionEnd = 2030;

	const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

	if (planView === 'protection') {
		const t = summarize(rows, lastYear);
		const p = summarize(rows, projectionEnd);
		return tpl({
			lastYear,
			projectionEnd,
			totalBuilt: fmt(t.built),
			permanent: fmt(t.permanent),
			protectedNum: fmt(t.protected),
			maybe: fmt(t.maybe),
			lost: fmt(t.lost),
			projectedPermanent: fmt(p.permanent),
			projectedProtected: fmt(p.protected),
			projectedMaybe: fmt(p.maybe),
		});
	}

	const view = altBuckets[planView];
	const t = view.summarize(rows, lastYear);
	const p = view.summarize(rows, projectionEnd);
	const args = { lastYear, projectionEnd, totalBuilt: fmt(t.built) };
	for (const f of view.fields) {
		args[f] = fmt(t[f]);
		args[`projected${capitalize(f)}`] = fmt(p[f]);
	}
	return tpl(args);
}
