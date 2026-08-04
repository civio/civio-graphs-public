import { utcDay, utcYear, range } from 'd3';

// Day-of-year of the first day of each month, in a leap reference year
// so the ticks match a 366-day domain.
export const monthTicks = range(12).map((m) =>
	utcDay.count(new Date(Date.UTC(2000, 0, 1)), new Date(Date.UTC(2000, m, 1)))
);

export function dayOfYear(date) {
	return utcDay.count(utcYear(date), date);
}
