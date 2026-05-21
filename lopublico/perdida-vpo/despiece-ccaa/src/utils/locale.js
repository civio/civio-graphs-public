import { formatLocale } from 'd3';

// Locale configurations for number formatting
const esES = {
  decimal: ',',
  thousands: '.',
  grouping: [3],
  currency: ['', '\u00a0€'],
};

const enEN = {
  decimal: '.',
  thousands: ',',
  grouping: [3],
  currency: ['', '\u00a0€'],
};

/* public */
export const dateOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

/* public */
export const months = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export const formatIntegers = {
  en: formatLocale(enEN).format(',d'),
  es: formatLocale(esES).format(',d'),
};

export const formatDecimals = {
  en: formatLocale(enEN).format('.1f'),
  es: formatLocale(esES).format('.1f'),
};
