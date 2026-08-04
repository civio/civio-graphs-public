import { group } from 'd3';
import { severeFiresThreshold, worstDays, countSevereDays } from '../states/data.svelte';
import { fill, formatFires, formatDaysCount } from './helpers';

// Listing every tied date is only readable up to a few; beyond that the
// cell reads as a count ("5 días con 3 incendios activos")
const maxListedTies = 3;

/**
 * Returns the accessibility description for the main chart: the chart's
 * shape, the region's worst day(s) and severe-day count, plus a per-year
 * table (year, worst day, days above the severe threshold).
 * @param {import('../states/language.svelte').vizLang} vizLang - The language state object
 * @param {string} region - The selected region name
 * @param {Array<Object>} data - The selected region data array
 * @returns {Object} The a11y description with description, title, columns, and items
 */
export function getMainChartA11y(vizLang, region = '', data = []) {
  const texts = vizLang.texts.a11y.mainChart;

  // Main insight: the region's worst day(s), mirroring WorstDaysSummary
  const regionWorst = worstDays(data);
  const severeCount = countSevereDays(data);

  const sentences = [fill(texts.description, { region })];
  if (regionWorst.length === 1) {
    sentences.push(
      fill(texts.worstDaySingle, {
        date: vizLang.formatFullDate.format(regionWorst[0].fecha),
        fires: formatFires(vizLang, regionWorst[0].incendios_activos),
      })
    );
  } else if (regionWorst.length > 1) {
    sentences.push(
      fill(texts.worstDayTie, {
        count: regionWorst.length,
        fires: formatFires(vizLang, regionWorst[0].incendios_activos),
        dates: vizLang.formatList.format(
          regionWorst.map((d) => vizLang.formatFullDate.format(d.fecha))
        ),
      })
    );
  }
  if (severeCount > 0) {
    sentences.push(
      fill(texts.severeDaysNote, {
        days: formatDaysCount(severeCount),
        threshold: severeFiresThreshold,
      })
    );
  }

  // One table row per year with data: worst day(s) and severe-day count
  const items = [...group(data, (d) => d.fecha.getUTCFullYear())]
    .toSorted(([yearA], [yearB]) => yearA - yearB)
    .map(([year, rows]) => {
      const yearWorst = worstDays(rows);
      const severe = countSevereDays(rows);
      const fires = formatFires(vizLang, yearWorst[0].incendios_activos);
      const worstCell =
        yearWorst.length <= maxListedTies
          ? fill(texts.worstDayCell, {
              dates: vizLang.formatList.format(
                yearWorst.map((d) => vizLang.formatDayMonth.format(d.fecha))
              ),
              fires,
            })
          : fill(texts.worstDayCellTie, { days: formatDaysCount(yearWorst.length), fires });
      return [
        String(year),
        worstCell,
        severe > 0 ? formatDaysCount(severe) : texts.noSevereDaysCell,
      ];
    });

  return {
    description: sentences.join(' '),
    title: fill(texts.title, { region }),
    columns: texts.columns.map((column) => fill(column, { threshold: severeFiresThreshold })),
    items,
  };
}
