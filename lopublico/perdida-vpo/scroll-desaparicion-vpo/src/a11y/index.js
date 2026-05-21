/**
 * @typedef {Object} A11yDescription
 * @property {string} description - Main insight of the chart (1-2 sentences)
 * @property {string} [title] - Title for the data section
 * @property {string[]} [columns] - Column names
 * @property {string[][]} [items] - Data rows [col1, col2, ...]
 * @property {'list' | 'table' | 'auto'} [format] - Presentation format
 */

export * from './mainChart.js';
