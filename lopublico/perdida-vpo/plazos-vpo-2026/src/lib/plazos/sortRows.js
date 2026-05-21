import { thresholds, effectiveYears, isFullyPermanent, getCurrentSubs } from './colorScale.js';

// Hidden from the chart: Ceuta and Melilla don't have their own VPO regulation
// (they fall under the state framework).
const hiddenRows = new Set(['ceuta', 'melilla']);

function tierIndex(sub) {
  if (isFullyPermanent(sub)) return -1;
  const v = effectiveYears(sub);
  if (v == null) return -2;
  for (let i = 0; i < thresholds.length; i++) {
    if (v <= thresholds[i].max) return i;
  }
  return thresholds.length - 1;
}

function lastPeriodMix(row) {
  const subs = getCurrentSubs(row);
  if (!subs.length) return null;
  const total = subs.length;
  const bandCounts = new Array(thresholds.length).fill(0);
  let permCount = 0;
  let minYears = Number.POSITIVE_INFINITY;
  for (const sub of subs) {
    const idx = tierIndex(sub);
    if (idx === -1) permCount++;
    else if (idx >= 0) bandCounts[idx]++;
    if (!isFullyPermanent(sub)) {
      const v = sub.years ?? sub.minYears ?? sub.maxYears;
      if (v != null && v < minYears) minYears = v;
    }
  }
  return {
    bands: bandCounts.map((c) => c / total),
    perm: permCount / total,
    minYears,
  };
}

function compareByMix(ma, mb) {
  if (!ma && !mb) return 0;
  if (!ma) return 1;
  if (!mb) return -1;
  for (let i = 0; i < ma.bands.length; i++) {
    if (ma.bands[i] !== mb.bands[i]) return mb.bands[i] - ma.bands[i];
  }
  if (ma.perm !== mb.perm) return ma.perm - mb.perm;
  // minYears is Infinity when every current sub is permanent; comparing two
  // Infinities would yield NaN and an undefined sort order, so guard for it.
  if (ma.minYears !== mb.minYears) return ma.minYears - mb.minYears;
  return 0;
}

export function sortRows(rows) {
  const visible = rows.filter((r) => !hiddenRows.has(r.name));
  const estatales = visible.filter((r) => r.scope === 'estatal');
  const autonomicasConDatos = visible
    .filter((r) => r.scope !== 'estatal' && r.subs.length > 0)
    .map((r) => ({ row: r, mix: lastPeriodMix(r) }))
    .sort((a, b) => compareByMix(a.mix, b.mix))
    .map((d) => d.row);
  const autonomicasSinDatos = visible.filter((r) => r.scope !== 'estatal' && r.subs.length === 0);
  return [...estatales, ...autonomicasConDatos, ...autonomicasSinDatos];
}
