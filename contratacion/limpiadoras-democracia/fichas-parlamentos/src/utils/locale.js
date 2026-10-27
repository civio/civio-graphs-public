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

// Grouped thousands (2.040,80): Civio's editorial style, also for 4-digit numbers
export const formatDecimals = {
  en: formatLocale(enEN).format(',.2f'),
  es: formatLocale(esES).format(',.2f'),
};

// Up to 2 decimals, trailing zeros trimmed: 39, 37,5, 37,75
export const formatHours = {
  en: formatLocale(enEN).format(',.2~f'),
  es: formatLocale(esES).format(',.2~f'),
};
