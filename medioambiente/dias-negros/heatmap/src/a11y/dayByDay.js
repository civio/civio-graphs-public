import { ascending, group } from 'd3';
import { fill, formatFires, formatDaysCount } from './helpers';

/**
 * Returns the day-by-day reading of the selected region, grouped by year,
 * for the DayByDayList disclosure: the keyboard/screen-reader alternative
 * to the pointer-only year tooltip.
 * @param {import('../states/language.svelte').vizLang} vizLang - The language state object
 * @param {string} region - The selected region name
 * @param {Array<Object>} data - The selected region data array
 * @returns {{summary: string, years: Array<{year: number, label: string, days: string[]}>}}
 */
export function getDayByDayA11y(vizLang, region = '', data = []) {
  const texts = vizLang.texts.a11y.dayByDay;

  const years = [...group(data, (d) => d.fecha.getUTCFullYear())]
    .toSorted(([yearA], [yearB]) => yearA - yearB)
    .map(([year, rows]) => ({
      year,
      label: fill(texts.yearLabel, { year, days: formatDaysCount(rows.length) }),
      days: rows
        .toSorted((a, b) => ascending(a.fecha, b.fecha))
        .map((d) =>
          fill(texts.dayItem, {
            date: vizLang.formatDayMonth.format(d.fecha),
            fires: formatFires(vizLang, d.incendios_activos),
          })
        ),
    }));

  return { summary: fill(texts.summary, { region }), years };
}
