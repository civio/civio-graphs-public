/**
 * Shared helpers for the a11y description generators.
 */

/**
 * Fills a text template, replacing each `{key}` with its value.
 * @param {string} template - Text with `{key}` placeholders
 * @param {Object} values - Placeholder values keyed by name
 * @returns {string}
 */
export function fill(template, values) {
  return template.replaceAll(/\{(\w+)\}/g, (match, key) => values[key] ?? match);
}

/**
 * Formats a fire count with its pluralized noun: "1 incendio activo",
 * "94 incendios activos".
 * @param {import('../states/language.svelte').vizLang} vizLang
 * @param {number} count
 * @returns {string}
 */
export function formatFires(vizLang, count) {
  return `${vizLang.formatIntegers(count)} ${count === 1 ? 'incendio activo' : 'incendios activos'}`;
}

/**
 * Formats a day count with its pluralized noun: "1 día", "12 días".
 * @param {number} count
 * @returns {string}
 */
export function formatDaysCount(count) {
  return `${count} ${count === 1 ? 'día' : 'días'}`;
}
