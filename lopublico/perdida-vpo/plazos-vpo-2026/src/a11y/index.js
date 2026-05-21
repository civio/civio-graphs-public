/**
 * @typedef {Object} PlazosA11yItem
 * @property {string} label - Housing type label (e.g. "Régimen general")
 * @property {string} duration - Human-readable protection period
 * @property {string | null} note - Optional clarifying note from the source
 *
 * @typedef {Object} PlazosA11ySection
 * @property {string} name - Region slug
 * @property {string} label - Region display name
 * @property {'estatal' | 'ccaa'} scope
 * @property {string | null} summary - Sentence with the count of housing types
 * @property {PlazosA11yItem[]} items
 *
 * @typedef {Object} PlazosA11yData
 * @property {string} title
 * @property {string} description
 * @property {string} navHint
 * @property {string} noDataLabel
 * @property {string} noteLabel
 * @property {PlazosA11ySection[]} sections
 */

export * from './plazos.js';
