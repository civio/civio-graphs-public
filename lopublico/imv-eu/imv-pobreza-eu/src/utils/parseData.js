/**
 * Cleaning helpers for the Eurostat poverty threshold dataset.
 *
 * The source CSV encodes "no data" in several inconsistent ways, and `d3.autoType`
 * leaves every one of them as a plain string. A check like `row.amount > 0` on a
 * string silently evaluates to `false` instead of failing, so every value has to
 * go through an explicit parser before it reaches the chart.
 */

// Every sentinel found in the raw CSV for a missing value.
const MISSING = new Set(['NA', 'N/A', '-', '–', '—', '?', '', 'null', 'undefined', 'not clear']);

/**
 * Parses a raw cell into a finite number, or `null` when the value is missing.
 * @param {unknown} value
 * @returns {number | null}
 */
function parseNumber(value) {
  if (value == null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  const trimmed = String(value).trim();
  if (MISSING.has(trimmed)) return null;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * A text cell, or `null` when it holds one of the missing-value sentinels (R writes "NA").
 * @param {unknown} value
 * @returns {string | null}
 */
export function parseText(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return MISSING.has(trimmed) ? null : trimmed;
}

/**
 * Minimum income benefit, in euros per month.
 * @param {unknown} value
 * @returns {number | null}
 */
export function parseAmount(value) {
  return parseNumber(value);
}

/**
 * At-risk-of-poverty threshold, in euros per month.
 *
 * On top of the usual sentinels, the source uses `0` for countries with no
 * available threshold (Albania, Iceland, Kosovo, Switzerland, the UK). Zero is a
 * valid number that would pass any type check and draw a zero-length segment
 * indistinguishable from a genuinely low value, so it is treated as missing.
 *
 * @param {unknown} value
 * @returns {number | null}
 */
export function parseThreshold(value) {
  const parsed = parseNumber(value);
  return parsed === 0 ? null : parsed;
}

/**
 * Share of the poverty threshold covered by the benefit, as a percentage.
 *
 * Recomputed here rather than read from the CSV's `adequacy` column, which holds
 * a spurious `0` in the ten rows where the amount is missing.
 *
 * @param {number | null} amount
 * @param {number | null} threshold
 * @returns {number | null}
 */
export function computeAdequacy(amount, threshold) {
  if (amount == null || !threshold) return null;
  return (amount / threshold) * 100;
}
