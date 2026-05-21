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

export const formatIntegers = {
  en: formatLocale(enEN).format(',d'),
  es: formatLocale(esES).format(',d'),
};

export const formatDecimals = {
  en: formatLocale(enEN).format('.1f'),
  es: formatLocale(esES).format('.1f'),
};
