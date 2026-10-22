import { householdTypes } from '../states/data.svelte';
import { fill } from '../utils/template';

// Same factors as the chart: severe poverty is 40 % of the median income, poverty 60 %.
const REFERENCE_RATIO = { poverty: 1, extreme: 40 / 60 };

// The country the description always mentions. Fixed rather than taken from the reader's IP,
// so the text copied from `?alt` is the same for everyone and never depends on a third party.
const FOCUS_ISO = 'ES';

// Above this many countries, the countries over a threshold are summed up as a range.
const MAX_LISTED_COUNTRIES = 3;

/**
 * Distance from the benefit to the threshold, as a % of the threshold — the chart's x axis:
 * negative below, positive above. Null when there is no data for that household.
 */
function deviation(entry, typeKey, reference) {
  const adequacy = entry.rows[typeKey]?.adequacy;
  return adequacy == null ? null : adequacy / REFERENCE_RATIO[reference] - 100;
}

function referenceTerm(texts, reference) {
  return reference === 'extreme' ? texts.extremeTerm : texts.povertyTerm;
}

function formatters(vizLang) {
  const listFormat = new Intl.ListFormat(vizLang.value, { type: 'conjunction' });
  return {
    list: (items) => listFormat.format(items),
    // Rounded in prose: a figure you hear once has to be easy to keep in mind.
    roundPercent: (value) => `${vizLang.formatIntegers(Math.round(Math.abs(value)))} %`,
    signedPercent: (value) =>
      value == null
        ? vizLang.texts.noData
        : `${value > 0 ? '+' : ''}${vizLang.formatDecimals(value)} %`,
  };
}

/**
 * Accessibility description of the view on screen: the chart, and how the benefit compares to
 * the threshold currently selected, across the three households. It deliberately does not cover
 * both thresholds at once — six combinations in one paragraph were too much to hold by ear. The
 * threshold switch rebuilds it, the household switch is announced by the live region, and the
 * table below carries the detail.
 *
 * @param {import('../states/language.svelte').vizLang} vizLang - The language state object
 * @param {Array<Object>} countries - Countries with data, from `data.sortedCountries`
 * @param {'poverty' | 'extreme'} reference - Threshold the table measures against
 * @returns {import('./index.js').A11yDescription}
 */
export function getMainChartA11y(vizLang, countries = [], reference = 'poverty') {
  const texts = vizLang.texts;
  const base = texts.a11y.mainChart;

  const { list, roundPercent, signedPercent } = formatters(vizLang);
  const householdName = (key) => texts.householdNarrative[key];

  const activeTerm = referenceTerm(texts, reference);

  // What never changes: the piece, and what a threshold is. On screen the definition is a note
  // at the foot; by ear it would only arrive after the table, so it is reused here, at the top,
  // where it is needed.
  const intro = [
    fill(base.shape, {
      count: countries.length,
      households: list(householdTypes.map((type) => householdName(type.key))),
    }),
    texts.thresholdNote,
    base.howToRead,
  ].join(' ');

  // What the selected threshold shows. Rebuilt on every switch, and announced when it changes.
  const sentences = [];

  // Which countries go over the threshold on screen, and for which households.
  const aboveByCountry = new Map(); // country → household keys over the threshold
  const countsByHousehold = householdTypes.map(() => 0);

  for (const entry of countries) {
    householdTypes.forEach((type, index) => {
      const value = deviation(entry, type.key, reference);
      if (value == null || value < 0) return;

      countsByHousehold[index] += 1;
      const keys = aboveByCountry.get(entry.country) ?? [];
      aboveByCountry.set(entry.country, [...keys, type.key]);
    });
  }

  if (aboveByCountry.size === 0) {
    sentences.push(fill(base.aboveNone, { term: activeTerm }));
  } else if (aboveByCountry.size <= MAX_LISTED_COUNTRIES) {
    const items = Array.from(aboveByCountry, ([country, keys]) =>
      fill(base.countryHouseholds, {
        country,
        households:
          keys.length === householdTypes.length
            ? base.allHouseholds
            : list(keys.map(householdName)),
      })
    );
    sentences.push(fill(base.aboveList, { term: activeTerm, countries: list(items) }));
  } else {
    const min = Math.min(...countsByHousehold);
    const max = Math.max(...countsByHousehold);
    sentences.push(
      min === max
        ? fill(base.aboveSame, { term: activeTerm, count: min })
        : fill(base.aboveRange, { term: activeTerm, min, max })
    );
  }

  // The focus country against that same threshold, in rounded figures.
  const focus = countries.find((entry) => entry.iso === FOCUS_ISO);
  const focusValues = focus
    ? householdTypes
        .map((type) => ({ key: type.key, value: deviation(focus, type.key, reference) }))
        .filter((item) => item.value != null)
    : [];

  if (focusValues.length > 0) {
    // One figure per household rather than a range: heard once, "between 38 % and 52 %" says
    // less than the three numbers, and the household line by the filter no longer repeats them.
    const items = (entries) =>
      list(
        entries.map((item) =>
          fill(base.focusItem, {
            pct: roundPercent(item.value),
            household: householdName(item.key),
          })
        )
      );

    const below = focusValues.filter((item) => item.value < 0);
    const above = focusValues.filter((item) => item.value >= 0);

    if (above.length === 0) {
      sentences.push(
        fill(base.focusBelowList, {
          country: focus.country,
          term: activeTerm,
          items: items(below),
        })
      );
    } else if (below.length === 0) {
      sentences.push(
        fill(base.focusAboveList, {
          country: focus.country,
          term: activeTerm,
          items: items(above),
        })
      );
    } else {
      sentences.push(
        fill(base.focusMixedList, {
          country: focus.country,
          term: activeTerm,
          above: items(above),
          below: items(below),
        })
      );
    }
  }

  // Alphabetical: the table no longer follows one household's ranking, so a predictable
  // order is what lets someone find a country.
  const items = countries
    .toSorted((a, b) => a.country.localeCompare(b.country, vizLang.value))
    .map((entry) => [
      entry.country,
      ...householdTypes.map((type) => signedPercent(deviation(entry, type.key, reference))),
    ]);

  // The table closes the summary, so a threshold switch announces the new picture and the fact
  // that the table went with it, in one go — instead of a second live region racing this one.
  // Only in the live region: the table is next to it there, and `?alt` below leaves it out.
  const summary = [...sentences, base.tableHint].join(' ');

  return {
    intro,
    summary,
    // `?alt` takes a single string: a screenshot shows one threshold, so it gets both layers.
    // Built from the sentences rather than from `summary`: `?alt` renders no table, so the hint
    // that closes the summary would point at something that is not there.
    description: [intro, ...sentences].join(' '),
    title: fill(base.title, { term: activeTerm }),
    columns: [base.countryColumn, ...householdTypes.map((type) => texts.household[type.key])],
    items,
  };
}

/**
 * The household on screen, in one or two sentences: how many countries it falls short in, and by
 * how much in the focus country. It opens with the household's name, so it reads both as a label
 * on a cold pass and as an announcement when the filter rewrites it.
 *
 * @param {import('../states/language.svelte').vizLang} vizLang - The language state object
 * @param {Array<Object>} countries - Countries with data, from `data.sortedCountries`
 * @param {string} typeKey - Selected household type
 * @param {'poverty' | 'extreme'} reference - Threshold the chart measures against
 * @returns {string}
 */
export function getScenarioSummary(vizLang, countries, typeKey, reference) {
  const texts = vizLang.texts;
  const base = texts.a11y.scenario;
  if (!base) return '';

  const values = countries
    .map((entry) => ({ entry, value: deviation(entry, typeKey, reference) }))
    .filter((item) => item.value != null);
  const below = values.filter((item) => item.value < 0).length;

  const lead = fill(base.householdChanged, { household: texts.household[typeKey] });
  // Names the threshold: with two of them on the piece, "does not reach the threshold" leaves
  // the reader guessing which one, and this line is heard on its own, away from the summary.
  const reach = fill(below === values.length ? base.noneReach : base.someReach, {
    term: referenceTerm(texts, reference),
    below,
    count: values.length,
  });

  // The count alone: the summary above already gives the focus country for all three households,
  // so repeating one of them here was the same figure twice, a few seconds apart.
  return `${lead} ${reach}`;
}
