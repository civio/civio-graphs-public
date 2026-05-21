import {
	summarize,
	summarizeByPlan,
	summarizeByPromotor,
	summarizeByTenencia,
} from '../states/housesData.svelte';

function joinNonZero(items, fmt, leadingNoun = '') {
	const parts = items
		.filter(([v]) => v > 0)
		.map(([v, label], i) => {
			const noun = i === 0 && leadingNoun ? ` ${leadingNoun}` : '';
			return `${fmt(v)}${noun} ${label}`;
		});
	if (parts.length === 0) return '';
	if (parts.length === 1) return parts[0];
	return parts.slice(0, -1).join(', ') + ' y ' + parts[parts.length - 1];
}

/**
 * Screen-reader description for a per-CCAA stacked-area chart.
 *
 * @param {import('../states/language.svelte').vizLang} vizLang - Reactive language state
 * @param {Object} ctx
 * @param {string} ctx.ccaa - Display name of the autonomous community (CSV `ccaa` value)
 * @param {Array<Object>} ctx.rows - CSV rows already filtered for this CCAA
 * @param {number[]} ctx.years - Years in the x-axis domain
 * @param {number} ctx.firstProjectionYear - First year whose values are a projection
 * @param {'protection' | 'plan' | 'promotor' | 'tenencia'} ctx.planView - Active stack grouping
 * @returns {Object|null} Props for ScreenReaderDescription, or null when data is not ready
 */
export function getCcaaChartA11y(
	vizLang,
	{ ccaa, ccaaTitle, rows, years, firstProjectionYear, planView }
) {
	if (!rows || rows.length === 0) return null;

	const copy = vizLang.texts.ccaaChart;
	const a11y = copy.a11y;
	const labels = a11y.breakdownLabels;
	const projLabels = a11y.projectionLabels;
	const fmt = vizLang.formatIntegers;
	const lastYear = firstProjectionYear - 1;
	const projectionEnd = years.length > 0 ? years[years.length - 1] : lastYear;

	const lastTotals = summarize(rows, lastYear);
	const alive = lastTotals.permanent + lastTotals.protected + lastTotals.maybe;

	let description;
	let columns;
	let items;

	if (planView === 'plan') {
		const last = summarizeByPlan(rows, lastYear);
		const projected = summarizeByPlan(rows, projectionEnd);
		const breakdown = joinNonZero(
			[
				[last.estatal, labels.plan.estatal],
				[last.autonomico, labels.plan.autonomico],
				[last.sinInfo, labels.plan.sinInfo],
			],
			fmt
		);
		const projectedBreakdown = joinNonZero(
			[
				[projected.estatal, projLabels.plan.estatal],
				[projected.autonomico, projLabels.plan.autonomico],
				[projected.sinInfo, projLabels.plan.sinInfo],
			],
			fmt,
			'viviendas'
		);
		description = a11y.description.plan({
			ccaa,
			lastYear,
			projectionEnd,
			totalBuilt: fmt(lastTotals.built),
			alive: fmt(alive),
			breakdown,
			projectedBreakdown,
		});
		columns = a11y.columns.plan;
		items = years.map((year) => {
			const p = summarizeByPlan(rows, year);
			const label = year >= firstProjectionYear ? `${year}${copy.projectionSuffix}` : `${year}`;
			return [
				label,
				fmt(p.built),
				fmt(p.estatal),
				fmt(p.autonomico),
				fmt(p.sinInfo),
				fmt(p.lost),
			];
		});
	} else if (planView === 'promotor') {
		const last = summarizeByPromotor(rows, lastYear);
		const projected = summarizeByPromotor(rows, projectionEnd);
		const breakdown = joinNonZero(
			[
				[last.publico, labels.promotor.publico],
				[last.privado, labels.promotor.privado],
				[last.autopromotor, labels.promotor.autopromotor],
				[last.sinAnimoLucro, labels.promotor.sinAnimoLucro],
				[last.sinInfo, labels.promotor.sinInfo],
			],
			fmt
		);
		const projectedBreakdown = joinNonZero(
			[
				[projected.publico, labels.promotor.publico],
				[projected.privado, labels.promotor.privado],
				[projected.autopromotor, labels.promotor.autopromotor],
				[projected.sinAnimoLucro, labels.promotor.sinAnimoLucro],
				[projected.sinInfo, labels.promotor.sinInfo],
			],
			fmt,
			'viviendas'
		);
		description = a11y.description.promotor({
			ccaa,
			lastYear,
			projectionEnd,
			totalBuilt: fmt(lastTotals.built),
			alive: fmt(alive),
			breakdown,
			projectedBreakdown,
		});
		columns = a11y.columns.promotor;
		items = years.map((year) => {
			const p = summarizeByPromotor(rows, year);
			const label = year >= firstProjectionYear ? `${year}${copy.projectionSuffix}` : `${year}`;
			return [
				label,
				fmt(p.built),
				fmt(p.publico),
				fmt(p.privado),
				fmt(p.autopromotor),
				fmt(p.sinAnimoLucro),
				fmt(p.sinInfo),
				fmt(p.lost),
			];
		});
	} else if (planView === 'tenencia') {
		const last = summarizeByTenencia(rows, lastYear);
		const projected = summarizeByTenencia(rows, projectionEnd);
		const breakdown = joinNonZero(
			[
				[last.propiedad, labels.tenencia.propiedad],
				[last.alquiler, labels.tenencia.alquiler],
				[last.mixto, labels.tenencia.mixto],
				[last.sinInfo, labels.tenencia.sinInfo],
			],
			fmt
		);
		const projectedBreakdown = joinNonZero(
			[
				[projected.propiedad, labels.tenencia.propiedad],
				[projected.alquiler, labels.tenencia.alquiler],
				[projected.mixto, labels.tenencia.mixto],
				[projected.sinInfo, labels.tenencia.sinInfo],
			],
			fmt,
			'viviendas'
		);
		description = a11y.description.tenencia({
			ccaa,
			lastYear,
			projectionEnd,
			totalBuilt: fmt(lastTotals.built),
			alive: fmt(alive),
			breakdown,
			projectedBreakdown,
		});
		columns = a11y.columns.tenencia;
		items = years.map((year) => {
			const p = summarizeByTenencia(rows, year);
			const label = year >= firstProjectionYear ? `${year}${copy.projectionSuffix}` : `${year}`;
			return [
				label,
				fmt(p.built),
				fmt(p.propiedad),
				fmt(p.alquiler),
				fmt(p.mixto),
				fmt(p.sinInfo),
				fmt(p.lost),
			];
		});
	} else {
		const projectedTotals = summarize(rows, projectionEnd);
		const lostShow = lastTotals.lost > 0;
		const lostPct = lastTotals.built > 0 ? lastTotals.lost / lastTotals.built : 0;
		const breakdown = joinNonZero(
			[
				[lastTotals.permanent, labels.protection.permanent],
				[lastTotals.protected, labels.protection.protected],
				[lastTotals.maybe, labels.protection.maybe],
			],
			fmt
		);
		const projectedBreakdown = joinNonZero(
			[
				[projectedTotals.permanent, projLabels.protection.permanent],
				[projectedTotals.protected, projLabels.protection.protected],
				[projectedTotals.maybe, projLabels.protection.maybe],
			],
			fmt,
			'viviendas'
		);
		description = a11y.description.protection({
			ccaa,
			lastYear,
			projectionEnd,
			totalBuilt: fmt(lastTotals.built),
			alive: fmt(alive),
			breakdown,
			lost: lostShow ? fmt(lastTotals.lost) : '',
			lostPct: lostShow ? `${(lostPct * 100).toFixed(1).replace('.', ',')}%` : '',
			projectedBreakdown,
		});
		columns = a11y.columns.protection;
		items = years.map((year) => {
			const t = summarize(rows, year);
			const label = year >= firstProjectionYear ? `${year}${copy.projectionSuffix}` : `${year}`;
			return [label, fmt(t.built), fmt(t.permanent), fmt(t.protected), fmt(t.maybe), fmt(t.lost)];
		});
	}

	return {
		description,
		title: a11y.title(ccaaTitle ?? ccaa),
		columns,
		items,
		format: 'table',
	};
}
