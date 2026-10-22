// Video module of the minimum income vs poverty line dot chart, loaded by the
// "Vídeos para historias" editor of civio-toolkit from
// https://graphs.civio.es/lopublico/imv-eu/imv-pobreza-eu/video/story.js.
// The SVG chart is redrawn on canvas with its mobile design (same marks,
// colors, labels, ticks every 40 % and controls) laid out again at the
// width of the story, as the web would on a wider phone: the whole chart and
// its filters always in view. Contract: .claude/skills/video-story/CONTRACT.md.
//
// Text drawn through `kit.text`/`kit.callout` is editorial and disappears in
// the "no text" export; the chart's labels, controls and tooltip are drawn on
// the canvas directly because they are part of the chart.

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Same file the chart loads (App.svelte), with the same cache buster
const dataUrl = `https://data.civio.es/lopublico/imv-eu/imv-pobreza-eu/data.csv?t=${Date.now()}`;
const iconUrls = {
  single: new URL('../src/assets/people/person.png', import.meta.url).href,
  couple: new URL('../src/assets/people/couple.png', import.meta.url).href,
  family: new URL('../src/assets/people/family.png', import.meta.url).href,
};

// ---------------------------------------------------------------------------
// Texts, copied from src/states/language.svelte.js (it uses runes, so it
// can't be imported here). `households` and `references` are the editor's,
// in Spanish (fields and {placeholders}); `chartTexts` are the ones the
// chart draws, in the language of the video (`kit.lang`).

const households = [
  { key: 'single', csv: 'Single person', label: 'Persona sola', narrative: 'una persona sola' },
  { key: 'couple', csv: 'Couple', label: 'Pareja', narrative: 'una pareja' },
  {
    key: 'family',
    csv: 'Couple + 2 children',
    label: 'Pareja con 2 hijos',
    narrative: 'una pareja con 2 hijos',
  },
];
const householdByKey = new Map(households.map((h) => [h.key, h]));

const references = {
  extreme: {
    label: 'Umbral de pobreza severa',
    term: 'umbral de pobreza severa',
    percent: (40 / 60) * 100,
    ratio: 40 / 60,
  },
  poverty: {
    label: 'Umbral de pobreza',
    term: 'umbral de pobreza',
    percent: 100,
    ratio: 1,
  },
};
// Selector order, as in App.svelte: severe poverty first, like on the axis
const referenceOrder = ['extreme', 'poverty'];

const chartTexts = {
  es: {
    household: { single: 'Persona sola', couple: 'Pareja', family: 'Pareja con 2 hijos' },
    householdNarrative: {
      single: 'una persona sola',
      couple: 'una pareja',
      family: 'una pareja con 2 hijos',
    },
    reference: { extreme: 'Umbral de pobreza severa', poverty: 'Umbral de pobreza' },
    // povertyTerm and extremeTerm, for the tooltip's {term}
    term: { extreme: 'umbral de pobreza severa', poverty: 'umbral de pobreza' },
    referenceNoun: { extreme: 'la pobreza severa', poverty: 'la pobreza' },
    countries: {
      AT: 'Austria',
      BE: 'Bélgica',
      BG: 'Bulgaria',
      CY: 'Chipre',
      CZ: 'República Checa',
      DE: 'Alemania',
      DK: 'Dinamarca',
      EE: 'Estonia',
      EL: 'Grecia',
      ES: 'España',
      FI: 'Finlandia',
      FR: 'Francia',
      HR: 'Croacia',
      HU: 'Hungría',
      IE: 'Irlanda',
      IT: 'Italia',
      LT: 'Lituania',
      LU: 'Luxemburgo',
      LV: 'Letonia',
      MT: 'Malta',
      NL: 'Países Bajos',
      PL: 'Polonia',
      PT: 'Portugal',
      RO: 'Rumanía',
      SE: 'Suecia',
      SI: 'Eslovenia',
      SK: 'Eslovaquia',
    },
    noRatio: 'Sin datos',
    noData: 'Sin datos',
    thresholdMark: 'Pobreza',
    extremeMark: ['Pobreza', 'severa'],
    axisTitleShortfall: '% que falta para salir de {reference}',
    axisTitleSurplus: '% por encima de {reference}',
    tooltip: {
      benefit:
        'En <b>{country}</b>, <b>{household}</b> cobra como máximo {amount} del <i>{scheme}</i>.',
      benefitNoScheme:
        'En <b>{country}</b>, <b>{household}</b> cobra como máximo {amount} de renta mínima.',
      below:
        'Esta cantidad está <strong>un {pct} por debajo</strong> del <b>{term}</b> del país ({threshold}).',
      above:
        'Esta cantidad está <strong>un {pct} por encima</strong> del <b>{term}</b> del país ({threshold}).',
      noAmount:
        'En <b>{country}</b>, no hay datos claros sobre la cuantía de la renta mínima para <b>{household}</b>.',
      noThreshold: 'No se dispone del <b>{term}</b> del país.',
    },
  },
  en: {
    household: { single: 'Single person', couple: 'Couple', family: 'Couple with 2 children' },
    householdNarrative: {
      single: 'a single person',
      couple: 'a couple',
      family: 'a couple with 2 children',
    },
    reference: { extreme: 'Severe poverty line', poverty: 'Poverty line' },
    term: { extreme: 'Severe poverty line', poverty: 'poverty line' },
    referenceNoun: { extreme: 'severe poverty', poverty: 'poverty' },
    countries: {
      AT: 'Austria',
      BE: 'Belgium',
      BG: 'Bulgaria',
      CY: 'Cyprus',
      CZ: 'Czechia',
      DE: 'Germany',
      DK: 'Denmark',
      EE: 'Estonia',
      EL: 'Greece',
      ES: 'Spain',
      FI: 'Finland',
      FR: 'France',
      HR: 'Croatia',
      HU: 'Hungary',
      IE: 'Ireland',
      IT: 'Italy',
      LT: 'Lithuania',
      LU: 'Luxembourg',
      LV: 'Latvia',
      MT: 'Malta',
      NL: 'Netherlands',
      PL: 'Poland',
      PT: 'Portugal',
      RO: 'Romania',
      SE: 'Sweden',
      SI: 'Slovenia',
      SK: 'Slovakia',
    },
    noRatio: 'No ratio',
    noData: 'No data',
    thresholdMark: 'Poverty',
    extremeMark: ['Severe', 'poverty'],
    axisTitleShortfall: '% to escape {reference}',
    axisTitleSurplus: '% above {reference}',
    tooltip: {
      benefit: 'In <b>{country}</b>, <b>{household}</b> gets a maximum income benefit of {amount}.',
      benefitNoScheme:
        'In <b>{country}</b>, <b>{household}</b> gets a maximum income benefit of {amount}.',
      below:
        'This amount is <strong> {pct} below</strong> the <b>{term}</b> poverty line of ({threshold}).',
      above:
        'This amount is <strong> {pct} above</strong> the <b>{term}</b> poverty line of ({threshold}).',
      noAmount:
        'In this <b>{country}</b>, we lack clear data on the income benefit for <b>{household}</b>.',
      noThreshold: 'We lack the <b>{term}</b> for this country.',
    },
  },
};

// Number formats of src/utils/locale.js, by language
const numberLocales = {
  es: { decimal: ',', thousands: '.', grouping: [3], currency: ['', ' €'] },
  en: { decimal: '.', thousands: ',', grouping: [3], currency: ['', ' €'] },
};
const formats = Object.fromEntries(
  Object.entries(numberLocales).map(([lang, spec]) => {
    const locale = d3.formatLocale(spec);
    return [lang, { euros: locale.format('$,.2f'), decimals: locale.format('.2f') }];
  })
);
const percentText = (value, lang = 'es') => `${formats[lang].decimals(value)} %`;

// ---------------------------------------------------------------------------
// Mobile geometry and colors, in CSS px

// Grey ramp of src/utils/colors.js: --bwN goes from white (0) to black (1000)
const bw = (n) => d3.interpolateRgb('white', 'black')(n / 1000);
const shortfallColor = '#f74383';
const surplusColor = '#08a6bf';
const shortfallText = '#d43a71';
const surplusText = '#068296';

// Video area of the chart: the header's full width (kit layout: margin 64,
// 952 px), from right below the header (its last line sits at y 425 at most)
// down to the source line (y 1755)
const area = { x: 64, y: 470, width: 952, height: 1265 };
// Every size of the chart (fonts, dots, strokes, pills) is its CSS size times
// this scale; the layout then fills the area's width, as in a 443 px
// container, and the rows take the height left (see rowLayout). The mobile
// values of DotChart.svelte are kept.
const fontScale = 2.15;
const containerWidth = area.width / fontScale;

// rowLayout.svelte.js and DotChart.svelte, mobile values (isNarrow)
const labelWidth = 108;
const marginTop = 10;
const marginRight = 18;
const innerWidth = containerWidth - labelWidth - marginRight;
const dotRadius = 4;
const referenceTop = -20;
const tickStep = 40;
const markY = -52;
// Room below the rows for the surplus ticks and axis title
const marginBottom = 40;

// Page blocks in CSS px from the top of the household pills, as measured on
// the published chart: pills, reference pills and the chart, whose 76 px
// top margin holds the threshold labels. The hint line between controls and
// chart («Filtra por tipo de hogar…») is left out to give the text more size.
const page = { householdY: 0, referenceY: 66, svgY: 106 + 76 };

// Rows: 16 px + 4 px gap on the web; here as tall as the area allows, up to
// that, keeping the same proportion between row and gap
function rowLayout(count) {
  const room = area.height / fontScale - page.svgY - marginTop - marginBottom;
  const block = Math.min(20, room / count);
  const gap = block * 0.2;
  return { block, gap, middle: (block - gap) / 2 };
}

// CSS `ease`, the timing of every transition in the chart
const cssEase = cubicBezier(0.25, 0.1, 0.25, 1);
const changeTime = 0.5;
const pillTime = 0.3;
const fadeTime = 0.25;

function cubicBezier(x1, y1, x2, y2) {
  const at = (u, a, b) => 3 * (1 - u) ** 2 * u * a + 3 * (1 - u) * u ** 2 * b + u ** 3;
  return (k) => {
    if (k <= 0) return 0;
    if (k >= 1) return 1;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      if (at(mid, x1, x2) < k) lo = mid;
      else hi = mid;
    }
    return at((lo + hi) / 2, y1, y2);
  };
}

// ---------------------------------------------------------------------------
// Data

async function loadIcon(url) {
  const image = await createImageBitmap(await (await fetch(url)).blob());
  // White copy for the selected pill (`filter: brightness(0) invert(1)`)
  const canvas = new OffscreenCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, image.width, image.height);
  return { black: image, white: canvas, ratio: image.width / image.height };
}

// Missing-value sentinels of src/utils/parseData.js
const missing = new Set(['NA', 'N/A', '-', '–', '—', '?', '', 'null', 'undefined', 'not clear']);
function parseNumber(value) {
  if (value == null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const trimmed = String(value).trim();
  if (missing.has(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}
function parseText(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return missing.has(trimmed) ? null : trimmed;
}

async function load() {
  const [rows, ...icons] = await Promise.all([
    d3.csv(dataUrl, d3.autoType),
    ...households.map((h) => loadIcon(iconUrls[h.key])),
  ]);

  // As data.svelte.js: one entry per country, the three households parsed
  const byIso = new Map();
  const keyByCsv = new Map(households.map((h) => [h.csv, h.key]));
  for (const row of rows) {
    const key = keyByCsv.get(row.householdType);
    if (!key) continue;
    if (!byIso.has(row.iso)) {
      byIso.set(row.iso, {
        iso: row.iso,
        country: chartTexts.es.countries[row.iso] ?? row.country,
        rows: {},
      });
    }
    const amount = parseNumber(row.amount_IMV);
    const threshold = parseNumber(row.amount_poverty) || null;
    byIso.get(row.iso).rows[key] = {
      amount,
      threshold,
      adequacy: amount == null || !threshold ? null : (amount / threshold) * 100,
      scheme: parseText(row.scheme_IMV),
    };
  }

  const all = [...byIso.values()];
  const countries = all.filter((c) => households.some((h) => c.rows[h.key]?.adequacy != null));

  // Worst first; countries without data for the household sink to the end
  const order = {};
  for (const { key } of households) {
    order[key] = countries
      .toSorted((a, b) => {
        const va = a.rows[key]?.adequacy ?? null;
        const vb = b.rows[key]?.adequacy ?? null;
        if (va == null && vb == null) return a.country.localeCompare(b.country, 'es');
        if (va == null) return 1;
        if (vb == null) return -1;
        return va - vb;
      })
      .map((c) => c.iso);
  }

  const maxValue = d3.max([
    100,
    ...all.flatMap((c) => households.map((h) => c.rows[h.key]?.adequacy ?? 100)),
  ]);

  return {
    countries,
    byIso,
    order,
    rank: Object.fromEntries(
      households.map(({ key }) => [key, new Map(order[key].map((iso, i) => [iso, i]))])
    ),
    maxValue,
    x: d3.scaleLinear().domain([0, maxValue]).nice().range([0, innerWidth]),
    icons: Object.fromEntries(households.map((h, i) => [h.key, icons[i]])),
    rows: rowLayout(countries.length),
    rich: new Map(),
  };
}

// ---------------------------------------------------------------------------
// Readings for the {placeholders}

function listText(names) {
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} y ${names.at(-1)}` : (names[0] ?? '');
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Benefit of one country for a household against a reference, as the
// tooltip computes it (TooltipShortfall.svelte)
function reading(data, iso, household, reference) {
  const entry = data.byIso.get(iso);
  const row = entry?.rows[household];
  const { ratio } = references[reference];
  if (!row) return null;
  const share = row.adequacy == null ? null : row.adequacy / ratio;
  return {
    country: entry.country,
    amount: row.amount,
    scheme: row.scheme,
    threshold: row.threshold == null ? null : row.threshold * ratio,
    share,
    above: share != null && share >= 100,
  };
}

function stateVars(data, household, reference) {
  const { term, label: referenceLabel, percent } = references[reference];
  const order = data.order[household];
  const withData = order.filter((iso) => data.byIso.get(iso).rows[household]?.adequacy != null);
  const noData = order.filter((iso) => !withData.includes(iso));
  const above = withData.filter((iso) => data.byIso.get(iso).rows[household].adequacy >= percent);
  const name = (iso) => data.byIso.get(iso).country;
  const count = withData.length;
  // Sentences of the chart's screen reader texts (language.svelte.js, a11y)
  let aboveSummary;
  if (above.length === 0)
    aboveSummary = `En ningún país la renta mínima queda por encima del ${term}.`;
  else if (above.length <= 3)
    aboveSummary = `La renta mínima solo queda por encima del ${term} en ${listText(above.map(name))}.`;
  else aboveSummary = `La renta mínima queda por encima del ${term} en ${above.length} países.`;
  return {
    hogar: householdByKey.get(household).label,
    umbral: term,
    umbralTitulo: referenceLabel,
    // The chart's own labels on the threshold lines (thresholdMark, extremeMark)
    umbralCorto:
      reference === 'poverty' ? chartTexts.es.thresholdMark : chartTexts.es.extremeMark.join(' '),
    paises: count,
    porDebajo: count - above.length,
    porEncima: above.length,
    resumen:
      above.length === 0 ? `los ${count} países` : `${count - above.length} de ${count} países`,
    resumenEncima: aboveSummary,
    sinDatos: noData.length ? `Sin datos: ${listText(noData.map(name))}.` : '',
    peor: withData.length ? name(withData[0]) : '',
    mejor: withData.length ? name(withData.at(-1)) : '',
  };
}

function countryVars(data, iso, household, reference) {
  const r = reading(data, iso, household, reference);
  const empty = {
    pais: '',
    puesto: '',
    cuantia: '',
    programa: '',
    umbralEuros: '',
    distancia: '',
    direccion: '',
    lectura: '',
    detalle: '',
    lecturaCorta: '',
  };
  if (!r) return empty;
  const narrative = householdByKey.get(household).narrative;
  const { term } = references[reference];
  const vars = {
    ...empty,
    pais: r.country,
    puesto: data.rank[household].get(iso) + 1,
  };
  if (r.amount == null) {
    return {
      ...vars,
      lectura: `No hay datos claros sobre la cuantía de la renta mínima para ${narrative}.`,
      detalle: `No hay datos claros sobre la cuantía de la renta mínima para ${narrative}.`,
      lecturaCorta: chartTexts.es.noRatio,
    };
  }
  vars.cuantia = formats.es.euros(r.amount);
  vars.programa = r.scheme ? `del ${r.scheme}` : 'de renta mínima';
  const benefit = `${capitalize(narrative)} cobra como máximo ${vars.cuantia} ${vars.programa}`;
  if (r.share == null) {
    return {
      ...vars,
      lectura: `No se dispone del ${term} del país.`,
      detalle: `${benefit}. No se dispone del ${term} del país.`,
      lecturaCorta: chartTexts.es.noRatio,
    };
  }
  vars.umbralEuros = formats.es.euros(r.threshold);
  vars.distancia = percentText(Math.abs(100 - r.share));
  vars.direccion = r.above ? 'por encima' : 'por debajo';
  // Two lines under a one-line title: the distance and both amounts
  vars.lectura = `Un ${vars.distancia} ${vars.direccion} del ${term}: ${vars.cuantia} frente a ${vars.umbralEuros}.`;
  // The tooltip's two sentences in one: three lines, longer than the header allows over the chart
  vars.detalle = `${benefit}: un ${vars.distancia} ${vars.direccion} del ${term} del país (${vars.umbralEuros}).`;
  vars.lecturaCorta = `${vars.distancia} ${vars.direccion}`;
  return vars;
}

// What each placeholder is, for the editor's list of data
const statePlaceholders = {
  hogar: 'Tipo de hogar del filtro, como en el selector («Persona sola»)',
  umbral: 'Umbral del filtro, para una frase («umbral de pobreza»)',
  umbralTitulo: 'Umbral del filtro, como en el selector («Umbral de pobreza»)',
  umbralCorto: 'Umbral del filtro, como en su línea del gráfico («Pobreza severa»)',
  paises: 'Países con datos para ese hogar',
  porDebajo: 'Países cuya renta mínima queda por debajo del umbral',
  porEncima: 'Países cuya renta mínima queda por encima del umbral',
  resumen: 'Países por debajo, para una frase («los 23 países», «21 de 23 países»)',
  resumenEncima: 'Frase con los países por encima del umbral (o «En ningún país…»)',
  sinDatos: '«Sin datos: …» con los países sin datos para ese hogar, o vacío',
  peor: 'País de la primera fila, el más alejado del umbral',
  mejor: 'País de la última fila con datos',
};
const countryPlaceholders = {
  pais: 'Nombre del país',
  puesto: 'Fila del país, contando desde arriba',
  cuantia: 'Renta mínima máxima para ese hogar, en euros',
  programa: 'Programa que la paga («del Ingreso Mínimo Vital (IMV)» o «de renta mínima»)',
  umbralEuros: 'Umbral del país, en euros',
  distancia: 'Distancia al umbral, en porcentaje («27,96 %»)',
  direccion: '«por debajo» o «por encima» del umbral',
  lectura: 'Frase de dos líneas con la distancia y las dos cuantías',
  detalle: 'Las dos frases del detalle del gráfico en una (tres líneas)',
  lecturaCorta: 'Distancia y dirección («27,96 % por debajo») o «Sin datos»',
};

// ---------------------------------------------------------------------------
// Fields

const householdOptions = households.map((h) => ({ value: h.key, label: h.label }));
const referenceOptions = referenceOrder.map((key) => ({
  value: key,
  label: references[key].label,
}));
// The chart's own pills, in the language of the video
const householdPills = (lang) =>
  households.map((h) => ({ value: h.key, label: chartTexts[lang].household[h.key] }));
const referencePills = (lang) =>
  referenceOrder.map((key) => ({ value: key, label: chartTexts[lang].reference[key] }));
const countryOptions = (data) =>
  data.countries
    .toSorted((a, b) => a.country.localeCompare(b.country, 'es'))
    .map((c) => ({ value: c.iso, label: c.country }));
const stateFields = [
  { key: 'household', label: 'Tipo de hogar', type: 'select', options: householdOptions },
  { key: 'reference', label: 'Umbral', type: 'select', options: referenceOptions },
];
const readerField = {
  key: 'reader',
  label: 'País resaltado',
  type: 'select',
  options: (data) => [{ value: '', label: 'Ninguno' }, ...countryOptions(data)],
  help: 'La web resalta el país de quien la lee. Vacío: ninguno.',
};
// ---------------------------------------------------------------------------
// Layout

function rowTop(data, household, iso) {
  return (data.rank[household].get(iso) ?? 0) * data.rows.block;
}

function svgHeight(data) {
  return marginTop + data.countries.length * data.rows.block + marginBottom;
}

// From page coordinates (CSS px) to the video canvas
function toCanvas([x, y]) {
  return [area.x + x * fontScale, area.y + y * fontScale];
}

// ---------------------------------------------------------------------------
// Drawing, in CSS px under the page transform

function rowState(data, iso, { household, reference }) {
  const row = data.byIso.get(iso).rows[household];
  const activeX = data.x(references[reference].percent);
  const adequacy = row?.adequacy ?? null;
  const top = rowTop(data, household, iso);
  if (adequacy == null) return { top, hasData: false, activeX };
  const dotX = data.x(adequacy);
  const above = adequacy >= references[reference].percent;
  return { top, hasData: true, activeX, dotX, above, color: above ? surplusColor : shortfallColor };
}

function ticksFor(data, reference) {
  const { ratio } = references[reference];
  const furthest = data.maxValue / ratio - 100;
  const out = [];
  for (let deviation = -100; deviation <= furthest; deviation += tickStep) out.push(deviation);
  return out;
}

// One frame of the chart going from state `from` to `to`: `k` is the eased
// progress of the 0.5 s transitions, `fade` the linear 0.25 s fades. Options:
// `reveal(iso)` 0–1 grows each row's mark out of the threshold line,
// `dim(iso)` its opacity, `hovered` the tapped country, `reader` the
// highlighted one; `lang` the language of its labels.
function drawChart(ctx, data, { from, to, k = 1, fade = 1, reveal, dim, hovered, reader, lang }) {
  const texts = chartTexts[lang];
  const lerp = (a, b) => a + (b - a) * k;
  const state = k > 0 ? to : from;
  const fromActiveX = data.x(references[from.reference].percent);
  const toActiveX = data.x(references[to.reference].percent);
  const activeX = lerp(fromActiveX, toActiveX);
  const povertyX = data.x(references.poverty.percent);
  const extremeX = data.x(references.extreme.percent);
  const height = data.countries.length * data.rows.block;
  const { ratio } = references[state.reference];
  const tickX = (deviation) => data.x((deviation + 100) * ratio);

  ctx.save();
  ctx.translate(0, page.svgY + marginTop);

  const rows = data.countries.map((c) => {
    const a = rowState(data, c.iso, from);
    const b = rowState(data, c.iso, to);
    return {
      iso: c.iso,
      country: texts.countries[c.iso] ?? c.country,
      a,
      b,
      top: lerp(a.top, b.top),
      alpha: dim ? dim(c.iso) : 1,
    };
  });

  // Bands: the tapped row hides the reader's band, as in the chart
  ctx.fillStyle = bw(50);
  for (const row of rows) {
    if (row.iso === reader && !hovered)
      ctx.fillRect(0, row.top - data.rows.gap / 2, containerWidth, data.rows.block);
  }
  if (hovered) {
    const row = rows.find((r) => r.iso === hovered);
    ctx.fillStyle = bw(100);
    ctx.fillRect(0, row.top - data.rows.gap / 2, containerWidth, data.rows.block);
  }

  ctx.translate(labelWidth, 0);

  // Grid and tick labels (they switch at once: no transition in the chart)
  const ticks = ticksFor(data, state.reference);
  ctx.strokeStyle = bw(150);
  ctx.lineWidth = 0.5;
  for (const deviation of ticks) {
    if (deviation === -100) continue;
    ctx.beginPath();
    ctx.moveTo(tickX(deviation), 0);
    ctx.lineTo(tickX(deviation), height);
    ctx.stroke();
  }
  ctx.font = '400 11.2px Lato';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  for (const deviation of ticks) {
    if (deviation === 0 || deviation === -100) continue;
    ctx.fillStyle = deviation < 0 ? shortfallText : surplusText;
    ctx.fillText(
      `${deviation > 0 ? '+' : ''}${deviation} %`,
      tickX(deviation),
      deviation < 0 ? -12 : height + 16
    );
  }

  // Threshold labels: the color fades, the weight switches at once
  const litColor = (key) => {
    const was = from.reference === key ? bw(900) : bw(300);
    const is = to.reference === key ? bw(900) : bw(300);
    return d3.interpolateRgb(was, is)(k);
  };
  const markFont = (key) => `${state.reference === key ? 700 : 400} 14.4px Lato`;
  ctx.font = markFont('poverty');
  ctx.fillStyle = litColor('poverty');
  ctx.fillText(texts.thresholdMark, povertyX, markY);
  ctx.font = markFont('extreme');
  ctx.fillStyle = litColor('extreme');
  texts.extremeMark.forEach((line, j) =>
    ctx.fillText(line, extremeX, markY - (texts.extremeMark.length - 1 - j) * 17)
  );

  // Axis titles
  const noun = texts.referenceNoun[state.reference];
  ctx.font = '700 12px Lato';
  ctx.textAlign = 'left';
  ctx.fillStyle = shortfallText;
  ctx.fillText(texts.axisTitleShortfall.replace('{reference}', noun), 0, -30);
  ctx.textAlign = 'right';
  ctx.fillStyle = surplusText;
  ctx.fillText(texts.axisTitleSurplus.replace('{reference}', noun), innerWidth, height + 33);

  // Marks: guide to the dot or the line, gap line, dot
  for (const row of rows) {
    const { a, b } = row;
    const grow = reveal ? reveal(row.iso) : 1;
    // A row that loses its data fades out with its old marks; one that gains
    // it fades in at the new place
    const marks = [];
    if (a.hasData && b.hasData) marks.push({ s: a, e: b, alpha: 1 });
    else {
      if (a.hasData) marks.push({ s: a, e: a, alpha: 1 - fade });
      if (b.hasData) marks.push({ s: b, e: b, alpha: fade });
    }
    for (const { s, e, alpha } of marks) {
      const markAlpha = alpha * row.alpha * Math.min(1, grow * 4);
      if (markAlpha <= 0) continue;
      const startDot = fromActiveX + (s.dotX - fromActiveX) * grow;
      const endDot = toActiveX + (e.dotX - toActiveX) * grow;
      const dotX = lerp(startDot, endDot);
      const guide = lerp(s.above ? fromActiveX : startDot, e.above ? toActiveX : endDot);
      const color = d3.interpolateRgb(s.color, e.color)(k);
      ctx.globalAlpha = markAlpha;
      ctx.fillStyle = bw(100);
      ctx.fillRect(0, row.top + data.rows.middle - 0.5, guide, 1);
      ctx.fillStyle = color;
      ctx.fillRect(
        Math.min(activeX, dotX),
        row.top + data.rows.middle - 0.25,
        Math.abs(dotX - activeX),
        0.5
      );
      ctx.beginPath();
      ctx.arc(dotX, row.top + data.rows.middle, dotRadius, 0, 2 * Math.PI);
      ctx.fill();
    }
    const noDataAlpha = (a.hasData ? 0 : 1 - fade) + (b.hasData ? 0 : fade);
    if (!a.hasData && !b.hasData ? true : noDataAlpha > 0) {
      ctx.globalAlpha =
        (!a.hasData && !b.hasData ? 1 : noDataAlpha) * row.alpha * Math.min(1, grow * 4);
      ctx.font = 'italic 400 11.2px Lato';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = bw(300);
      ctx.fillText(texts.noRatio, 2, row.top + data.rows.middle);
      ctx.textBaseline = 'alphabetic';
    }
  }
  ctx.globalAlpha = 1;

  // Threshold lines: both dashed, plus the solid one on the active reference
  ctx.strokeStyle = bw(250);
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  for (const x of [povertyX, extremeX]) {
    ctx.beginPath();
    ctx.moveTo(x, referenceTop);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.strokeStyle = bw(900);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(activeX, referenceTop);
  ctx.lineTo(activeX, height);
  ctx.stroke();

  // Country labels
  ctx.translate(-labelWidth, 0);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (const row of rows) {
    const empty = !(k > 0 ? row.b : row.a).hasData;
    ctx.globalAlpha = row.alpha;
    ctx.font = `${row.iso === reader ? 700 : 400} 12px Lato`;
    ctx.fillStyle = row.iso === reader ? bw(900) : empty ? bw(300) : bw(800);
    ctx.fillText(row.country, labelWidth - 10, row.top + data.rows.middle);
  }
  ctx.restore();
}

// Pill group of HouseholdFilter.svelte / RadialSelector.svelte. The selected
// option is bold, so widths jump with the selection while the dark slider
// slides between them in 0.3 s.
function pillLayout(ctx, options, selected, { padding, font, extra = () => 0 }) {
  let x = 0;
  const items = options.map((option) => {
    ctx.font = `${option.value === selected ? 700 : 400} ${font}`;
    const width = Math.max(ctx.measureText(option.label).width, extra(option)) + 2 * padding;
    const item = { ...option, x, width };
    x += width + 4;
    return item;
  });
  return { items, width: x - 4 };
}

function drawPills(ctx, data, { options, from, to, k, y, height, padding, font, icons }) {
  const selected = k > 0 ? to : from;
  const extra = icons ? (option) => 25.6 * data.icons[option.value].ratio : undefined;
  const layout = pillLayout(ctx, options, selected, { padding, font, extra });
  const before = pillLayout(ctx, options, from, { padding, font, extra });
  const left = (containerWidth - layout.width) / 2;
  const leftBefore = (containerWidth - before.width) / 2;
  const slideFrom = before.items.find((i) => i.value === from);
  const slideTo = layout.items.find((i) => i.value === to);

  ctx.fillStyle = bw(70);
  ctx.beginPath();
  ctx.roundRect(left, y, layout.width, height, height / 2);
  ctx.fill();
  ctx.fillStyle = bw(700);
  ctx.beginPath();
  ctx.roundRect(
    d3.interpolateNumber(leftBefore + slideFrom.x, left + slideTo.x)(k),
    y,
    d3.interpolateNumber(slideFrom.width, slideTo.width)(k),
    height,
    height / 2
  );
  ctx.fill();

  for (const item of layout.items) {
    // How selected the option looks: color and icon fade in 0.3 s
    const on = (item.value === from ? 1 - k : 0) + (item.value === to ? k : 0);
    const cx = left + item.x + item.width / 2;
    ctx.font = `${item.value === selected ? 700 : 400} ${font}`;
    ctx.fillStyle = d3.interpolateRgb(bw(900), 'white')(on);
    ctx.textAlign = 'center';
    if (icons) {
      const icon = data.icons[item.value];
      const iconWidth = 25.6 * icon.ratio;
      ctx.globalAlpha = 1 - on;
      ctx.drawImage(icon.black, cx - iconWidth / 2, y + 5.6, iconWidth, 25.6);
      ctx.globalAlpha = on;
      ctx.drawImage(icon.white, cx - iconWidth / 2, y + 5.6, iconWidth, 25.6);
      ctx.globalAlpha = 1;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(item.label, cx, y + 44.5);
    } else {
      ctx.textBaseline = 'middle';
      ctx.fillText(item.label, cx, y + height / 2 + 0.5);
    }
  }
  ctx.textBaseline = 'alphabetic';
}

// The page around the chart: both pill groups
function drawControls(ctx, data, { from, to, kHousehold, kReference, lang }) {
  drawPills(ctx, data, {
    options: householdPills(lang),
    from: from.household,
    to: to.household,
    k: kHousehold,
    y: page.householdY,
    height: 53.8,
    padding: 14.4,
    font: '12px Lato',
    icons: true,
  });
  drawPills(ctx, data, {
    options: referencePills(lang),
    from: from.reference,
    to: to.reference,
    k: kReference,
    y: page.referenceY,
    height: 32,
    padding: 14.4,
    font: '12px Lato',
  });
}

function pillCenter(ctx, data, group, value, selected, lang) {
  const isHousehold = group === 'household';
  const options = isHousehold ? householdPills(lang) : referencePills(lang);
  const extra = isHousehold ? (option) => 25.6 * data.icons[option.value].ratio : undefined;
  const layout = pillLayout(ctx, options, selected, { padding: 14.4, font: '12px Lato', extra });
  const item = layout.items.find((i) => i.value === value);
  const left = (containerWidth - layout.width) / 2;
  return [
    left + item.x + item.width / 2,
    isHousehold ? page.householdY + 27 : page.referenceY + 16,
  ];
}

// Rich sentence of the tooltip: <b>, <i> and <strong> runs, word-wrapped
function richRuns(template, values, above) {
  const filled = template.replaceAll(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));
  const runs = [];
  let style = 'normal';
  for (const part of filled.split(/(<\/?(?:b|i|strong)>)/)) {
    const tag = part.match(/^<(\/?)(b|i|strong)>$/);
    if (tag) style = tag[1] ? 'normal' : tag[2];
    else if (part) runs.push({ text: part, style, above });
  }
  return runs;
}

function runFont(style) {
  if (style === 'b') return '700 12.48px Lato';
  if (style === 'i') return 'italic 400 12.48px Lato';
  if (style === 'strong') return '900 12.48px Lato';
  return '400 12.48px Lato';
}

function runColor(run) {
  if (run.style === 'b') return bw(900);
  if (run.style === 'strong') return run.above ? surplusText : shortfallText;
  return bw(700);
}

function wrapRuns(ctx, runs, maxWidth) {
  // Words are made of pieces that may change style ("España" + ",")
  const words = [];
  let word = [];
  for (const run of runs) {
    const pieces = run.text.split(/( )/);
    for (const piece of pieces) {
      if (piece === ' ') {
        if (word.length) words.push(word);
        word = [];
      } else if (piece) word.push({ ...run, text: piece });
    }
  }
  if (word.length) words.push(word);

  const measureWord = (w) =>
    w.reduce((sum, piece) => {
      ctx.font = runFont(piece.style);
      return sum + ctx.measureText(piece.text).width;
    }, 0);
  ctx.font = runFont('normal');
  const space = ctx.measureText(' ').width;
  const lines = [];
  let line = [];
  let width = 0;
  for (const w of words) {
    const wordWidth = measureWord(w);
    if (line.length && width + space + wordWidth > maxWidth) {
      lines.push(line);
      line = [];
      width = 0;
    }
    width += (line.length ? space : 0) + wordWidth;
    line.push(w);
  }
  if (line.length) lines.push(line);
  return { lines, space };
}

function tooltipRuns(data, iso, household, reference, lang) {
  const r = reading(data, iso, household, reference);
  const texts = chartTexts[lang];
  const t = texts.tooltip;
  const { euros } = formats[lang];
  const values = {
    country: texts.countries[iso] ?? r.country,
    household: texts.householdNarrative[household],
    scheme: r.scheme,
    term: texts.term[reference],
    amount: r.amount == null ? texts.noData : euros(r.amount),
    threshold: r.threshold == null ? texts.noData : euros(r.threshold),
  };
  if (r.amount == null) return richRuns(t.noAmount, values);
  const runs = richRuns(r.scheme ? t.benefit : t.benefitNoScheme, values);
  if (r.share == null)
    return [...runs, { text: ' ', style: 'normal' }, ...richRuns(t.noThreshold, values)];
  const pct = percentText(Math.abs(100 - r.share), lang);
  return [
    ...runs,
    { text: ' ', style: 'normal' },
    ...richRuns(r.above ? t.above : t.below, { ...values, pct }, r.above),
  ];
}

// Mobile modal of Tooltip.svelte + TooltipShortfall.svelte, centered in the
// chart box. On a phone it is 340 of the 380 px of the chart, so it is drawn
// in those mobile units and scaled to keep that share of the width (and the
// same line breaks); `s` is the page scale, which canvas shadows ignore.
const tooltipScale = containerWidth / 380;

function drawTooltip(ctx, data, { iso, household, reference, alpha, s, lang }) {
  const width = 340;
  const textX = 2 + 10 + 44.8 + 8;
  const textWidth = width - textX - 10 - 2;
  const lineHeight = 12.48 * 1.45;
  const key = `${iso}|${household}|${reference}|${lang}`;
  if (!data.rich.has(key))
    data.rich.set(
      key,
      wrapRuns(ctx, tooltipRuns(data, iso, household, reference, lang), textWidth)
    );
  const { lines, space } = data.rich.get(key);
  const height = 2 + 10 + Math.max(lines.length * lineHeight, 28) + 10 + 2;
  const left = (containerWidth - width * tooltipScale) / 2;
  const top = page.svgY + (svgHeight(data) - height * tooltipScale) / 2;
  // Close button: "×" at 1rem, 8 px from the right and 5 px from the top
  const close = [width - 2 - 8 - 10.5, 2 + 5 + 10];
  const closeAt = [left + close[0] * tooltipScale, top + close[1] * tooltipScale];
  if (alpha <= 0) return { closeAt };

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(left, top);
  ctx.scale(tooltipScale, tooltipScale);
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 10 * s * tooltipScale;
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, 10);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = bw(990);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(1, 1, width - 2, height - 2, 9);
  ctx.stroke();

  const icon = data.icons[household];
  const iconWidth = 25.6 * icon.ratio;
  ctx.drawImage(icon.black, 12 + (44.8 - iconWidth) / 2, 12 + 2.4, iconWidth, 25.6);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  lines.forEach((line, i) => {
    let x = textX;
    const y = 12 + lineHeight * (i + 0.5);
    line.forEach((word, j) => {
      if (j > 0) x += space;
      for (const piece of word) {
        ctx.font = runFont(piece.style);
        ctx.fillStyle = runColor(piece);
        ctx.fillText(piece.text, x, y);
        x += ctx.measureText(piece.text).width;
      }
    });
  });

  ctx.font = '400 16px Lato';
  ctx.fillStyle = 'black';
  ctx.textAlign = 'center';
  ctx.fillText('×', ...close);
  ctx.restore();
  return { closeAt };
}

// Draws the page (controls and chart) in CSS px over the video's chart area
function withPage(kit, draw) {
  const { ctx } = kit;
  ctx.save();
  ctx.translate(area.x, area.y);
  ctx.scale(fontScale, fontScale);
  const result = draw(ctx);
  ctx.restore();
  return result;
}

// The finger comes in from below the frame, under its first target, and
// leaves the same way once its last tap is done
function offFrame(kit, [x]) {
  return [x, kit.format.height + 100];
}

function leaveFrame(kit, keyframes, lastTap) {
  const at = keyframes.at(-1).at;
  keyframes.push({ t: lastTap + 0.4, at }, { t: lastTap + 1, at: offFrame(kit, at) });
}

function firstRow(data, household) {
  return data.order[household][0];
}

// ---------------------------------------------------------------------------
// Scene types

// The whole chart for a household and a reference, optionally growing row
// by row out of the threshold line
const chart = {
  label: 'Gráfico completo',
  group: 'Gráfico',
  description:
    'Todo el gráfico para un tipo de hogar y un umbral, ya dibujado o apareciendo fila a fila.',
  duration: 8,
  enter: 'fade',
  exit: 'none',
  placeholders: statePlaceholders,
  fields: [
    ...stateFields,
    {
      key: 'drawing',
      label: 'Aparición',
      type: 'select',
      options: [
        { value: 'rows', label: 'Fila a fila' },
        { value: 'none', label: 'Ya dibujado' },
      ],
    },
    readerField,
  ],
  defaults: {
    title: '{hogar}',
    text: 'La renta mínima queda por debajo del {umbral} en {resumen}.',
    household: 'single',
    reference: 'poverty',
    drawing: 'rows',
    reader: 'ES',
  },
  vars: (data, scene) => stateVars(data, scene.household, scene.reference),
  render(kit, { t, duration, scene, data }) {
    const state = { household: scene.household, reference: scene.reference };
    const order = data.order[scene.household];
    const span = Math.max(1, duration * 0.55);
    const step = Math.min(0.15, span / order.length);
    const reveal =
      scene.drawing === 'rows'
        ? (iso) =>
            kit.progress(
              t,
              0.4 + order.indexOf(iso) * step,
              0.4 + order.indexOf(iso) * step + 0.7,
              cssEase
            )
        : null;
    withPage(kit, (ctx) => {
      drawControls(ctx, data, {
        from: state,
        to: state,
        kHousehold: 1,
        kReference: 1,
        lang: kit.lang,
      });
      drawChart(ctx, data, {
        from: state,
        to: state,
        reveal,
        reader: scene.reader,
        lang: kit.lang,
      });
    });
  },
};

// Cover: the chart's subject as kicker and a headline over a minimal chart,
// the rows without labels, axes or controls: the threshold line draws
// itself and each country's gap grows out of it, as in `chart`
const cover = {
  label: 'Portada',
  group: 'Gráfico',
  description:
    'Antetítulo y titular sobre una versión mínima del gráfico: la línea del umbral se dibuja y las filas, sin etiquetas, crecen desde ella.',
  header: false,
  source: false,
  duration: 5,
  enter: 'none',
  exit: 'fade',
  placeholders: statePlaceholders,
  fields: [
    { key: 'coverKicker', label: 'Antetítulo', type: 'text', section: 'Textos' },
    {
      key: 'coverTitle',
      label: 'Titular',
      type: 'textarea',
      section: 'Textos',
      help: 'Doce palabras como máximo. La portada dura lo que se tarda en leerlo: palabras ÷ 4 + 0,5 s. Usa saltos de línea para cortarlo donde quieras.',
    },
    ...stateFields,
    { key: 'logo', label: 'Logo de Civio', type: 'checkbox' },
  ],
  defaults: {
    // Chart title (language.svelte.js), shortened
    coverKicker: 'Rentas mínimas y umbral de pobreza',
    // Headline given by the user
    coverTitle: 'Las rentas mínimas europeas no sacan a la gente de la pobreza',
    household: 'single',
    reference: 'poverty',
    logo: true,
  },
  vars: (data, scene) => stateVars(data, scene.household, scene.reference),
  render(kit, { t, scene, data, vars }) {
    const { ctx, progress, ease } = kit;
    const centerX = area.x + area.width / 2;
    const titleIn = progress(t, 0.1, 0.7, ease.out);

    kit.text(kit.fill(scene.coverKicker, vars).toUpperCase(), centerX, 470 + (1 - titleIn) * 30, {
      font: '900 32px Lato',
      color: kit.colors.accent,
      align: 'center',
      letterSpacing: '4px',
      alpha: titleIn,
    });
    const titleFont = '900 80px Merriweather';
    kit.lines(kit.fill(scene.coverTitle, vars), area.width, titleFont).forEach((line, i) => {
      kit.text(line, centerX, 580 + i * 100 + (1 - titleIn) * 40, {
        font: titleFont,
        align: 'center',
        alpha: titleIn,
      });
    });

    // Minimal chart across the full width: one line and dot per country
    // with data, in the chart's order, scale and colors
    const top = 880;
    const height = 520;
    const toX = (x) => area.x + (x / innerWidth) * area.width;
    const thresholdX = toX(data.x(references[scene.reference].percent));
    const rows = data.order[scene.household]
      .map((iso) => rowState(data, iso, scene))
      .filter((row) => row.hasData);
    const lineIn = progress(t, 0.2, 0.6, ease.out);
    ctx.strokeStyle = bw(900);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(thresholdX, top - 20);
    ctx.lineTo(thresholdX, top - 20 + (height + 40) * lineIn);
    ctx.stroke();
    rows.forEach((row, i) => {
      const grow = kit.stagger(t, i, { start: 0.6, duration: 0.5, count: rows.length, total: 1.2 });
      if (grow <= 0) return;
      const x = thresholdX + (toX(row.dotX) - thresholdX) * grow;
      const y = top + ((i + 0.5) * height) / rows.length;
      ctx.fillStyle = row.color;
      ctx.fillRect(Math.min(x, thresholdX), y - 1, Math.abs(x - thresholdX), 2);
      ctx.beginPath();
      ctx.arc(x, y, dotRadius * fontScale, 0, 2 * Math.PI);
      ctx.fill();
    });

    if (scene.logo) kit.logo(centerX - 110, 1530, 220, progress(t, 0.6, 1.2, ease.out));
  },
};

// One country: the rest dims and a callout
// points at its dot
const focus = {
  label: 'Foco en un país',
  group: 'Gráfico',
  description:
    'Atenúa el resto de filas y señala un país con su distancia al umbral. Vacío: la primera fila.',
  duration: 7,
  enter: 'none',
  exit: 'none',
  placeholders: { ...countryPlaceholders, ...statePlaceholders },
  fields: [
    ...stateFields,
    {
      key: 'country',
      label: 'País',
      type: 'select',
      options: (data) => [{ value: '', label: 'Primera fila' }, ...countryOptions(data)],
      help: 'Vacío: el país de la primera fila, el que más lejos queda.',
    },
    readerField,
    { key: 'callout', label: 'Marca con su lectura', type: 'checkbox' },
    { key: 'calloutTitle', label: 'Marca: título', type: 'text', section: 'Textos' },
    { key: 'calloutText', label: 'Marca: texto', type: 'text', section: 'Textos' },
    {
      key: 'fromCountry',
      label: 'País señalado al empezar',
      type: 'select',
      options: (data) => [{ value: '', label: 'Ninguno' }, ...countryOptions(data)],
      help: 'Para seguir a otro foco sin salto: empieza con ese país señalado y pasa al nuevo.',
    },
    {
      key: 'release',
      label: 'Quitar el foco al final',
      type: 'checkbox',
      help: 'Para seguir con una interacción sin foco sin salto: la marca se va y las filas vuelven 2 s antes del final.',
    },
  ],
  defaults: {
    title: '{pais}',
    text: '{lectura}',
    household: 'single',
    reference: 'poverty',
    country: '',
    reader: 'ES',
    fromCountry: '',
    release: false,
    callout: true,
    calloutTitle: '{pais}',
    calloutText: '{lecturaCorta}',
  },
  vars: (data, scene) => ({
    ...stateVars(data, scene.household, scene.reference),
    ...countryVars(
      data,
      scene.country || firstRow(data, scene.household),
      scene.household,
      scene.reference
    ),
  }),
  render(kit, { t, duration, scene, data, vars }) {
    const { progress, ease } = kit;
    const state = { household: scene.household, reference: scene.reference };
    const iso = scene.country || firstRow(data, scene.household);
    // Coming from another focus, its country is lit and marked at first;
    // the highlight then passes to this one
    const from = scene.fromCountry && scene.fromCountry !== iso ? scene.fromCountry : null;
    const pass = progress(t, 0.3, 0.9);
    const release = scene.release ? progress(t, duration - 2, duration - 1.5) : 0;
    const dimK = (from ? 1 : progress(t, 1.0, 1.6)) * (1 - release);
    const lit = (code) => (code === iso ? (from ? pass : 1) : code === from ? 1 - pass : 0);
    const dim = (code) => 1 - 0.75 * dimK * (1 - lit(code));
    withPage(kit, (ctx) => {
      drawControls(ctx, data, {
        from: state,
        to: state,
        kHousehold: 1,
        kReference: 1,
        lang: kit.lang,
      });
      drawChart(ctx, data, { from: state, to: state, dim, reader: scene.reader, lang: kit.lang });
    });

    if (!scene.callout) return;
    const calloutAt = (code, codeVars, alpha) => {
      const row = rowState(data, code, state);
      const x = labelWidth + (row.hasData ? row.dotX : 40);
      const y = page.svgY + marginTop + row.top + data.rows.middle;
      const [cx, cy] = toCanvas([x, y]);
      kit.callout({
        x: cx,
        y: cy,
        radius: (row.hasData ? dotRadius : 6) * fontScale,
        alpha,
        lines: [scene.calloutTitle, scene.calloutText]
          .map((text) => kit.fill(text, codeVars).trim())
          .filter(Boolean)
          .map((text) => ({ text })),
      });
    };
    if (from) {
      const fromVars = { ...vars, ...countryVars(data, from, scene.household, scene.reference) };
      calloutAt(from, fromVars, 1 - progress(t, 0, 0.4, ease.in));
    }
    const calloutIn = from ? progress(t, 0.6, 1.2, ease.out) : progress(t, 1.4, 2.0);
    const calloutOut = scene.release ? progress(t, duration - 2.3, duration - 2, ease.in) : 0;
    calloutAt(iso, vars, calloutIn * (1 - calloutOut));
  },
};

// Header title or text of a scene with steps, one segment per step: the
// scene's own wording from the start, then each step's from its second on
// when it brings one (empty keeps the previous wording). The placeholders
// always follow the active step, so {umbral} or {porDebajo} change with the
// filter even when the wording doesn't.
const stepTextFields = [
  { key: 'title', label: 'Título desde aquí', type: 'text' },
  { key: 'text', label: 'Texto desde aquí', type: 'textarea' },
];

function stepSegments(key, scene, steps, duration, startVars) {
  const segments = [{ start: 0, text: scene[key], vars: startVars }];
  for (const step of steps) {
    if (step.at >= duration) continue;
    const text = step[key]?.trim() ? step[key] : segments.at(-1).text;
    segments.push({ start: step.at, text, vars: step.vars });
  }
  return segments.map((segment, i) => ({ ...segment, end: segments[i + 1]?.start ?? duration }));
}

// One filter per step: a household or a reference, as the pill it taps
const filterOptions = [
  ...householdOptions.map((o) => ({ value: `household:${o.value}`, label: `Hogar: ${o.label}` })),
  ...referenceOptions.map((o) => ({ value: `reference:${o.value}`, label: o.label })),
];

// The chart's state before and after each step, in time order
function changeSteps(scene) {
  let state = { household: scene.fromHousehold, reference: scene.fromReference };
  return (scene.steps ?? [])
    .toSorted((a, b) => a.at - b.at)
    .map((step) => {
      const [group, value] = String(step.filter).split(':');
      const from = state;
      state = { ...state, [group]: value };
      return { at: step.at, title: step.title, text: step.text, group, from, to: state };
    });
}

function changeSegments(key, scene, duration, data) {
  const steps = changeSteps(scene).map((step) => ({
    ...step,
    vars: stateVars(data, step.to.household, step.to.reference),
  }));
  const startVars = stateVars(data, scene.fromHousehold, scene.fromReference);
  return stepSegments(key, scene, steps, duration, startVars);
}

// Filter changes, each tapped on its pill at the second set in the editor:
// rows re-sort and dots move as in the chart (0.5 s)
const change = {
  label: 'Cambio de filtro',
  group: 'Demos',
  description:
    'Un dedo pulsa los selectores de hogar y umbral en los segundos que elijas; el gráfico se reordena como en la web.',
  duration: 8,
  enter: 'none',
  exit: 'none',
  placeholders: statePlaceholders,
  placeholdersHelp: 'Siguen al filtro activo: cambian con cada paso.',
  fields: [
    { key: 'fromHousehold', label: 'Hogar al empezar', type: 'select', options: householdOptions },
    { key: 'fromReference', label: 'Umbral al empezar', type: 'select', options: referenceOptions },
    {
      key: 'steps',
      label: 'Cambios',
      type: 'steps',
      fields: [
        { key: 'at', label: 'Segundo', type: 'time' },
        { key: 'filter', label: 'Control que se pulsa', type: 'select', options: filterOptions },
        ...stepTextFields,
      ],
      newItem: { filter: 'reference:extreme' },
      help: 'Cada cambio pulsa un control en su segundo de la interacción. «Ahora» toma el momento de la barra de tiempo. El título y el texto de un paso sustituyen a los generales desde ese segundo; vacíos, sigue la redacción anterior. Los datos entre llaves son siempre los del filtro activo.',
    },
    { key: 'finger', label: 'Dedo que pulsa los controles', type: 'checkbox' },
    readerField,
  ],
  defaults: {
    title: '{umbralCorto}',
    text: '{resumenEncima}',
    fromHousehold: 'single',
    fromReference: 'poverty',
    steps: [{ at: 2, filter: 'reference:extreme' }],
    finger: true,
    reader: 'ES',
  },
  vars: (data, scene) => {
    const last = changeSteps(scene).at(-1)?.to;
    return stateVars(
      data,
      last?.household ?? scene.fromHousehold,
      last?.reference ?? scene.fromReference
    );
  },
  titleSegments: (scene, duration, data) => changeSegments('title', scene, duration, data),
  textSegments: (scene, duration, data) => changeSegments('text', scene, duration, data),
  render(kit, { t, scene, data }) {
    const { ctx } = kit;
    const steps = changeSteps(scene);
    const start = { household: scene.fromHousehold, reference: scene.fromReference };
    const current = steps.findLast((step) => t >= step.at);
    let from = start;
    let to = start;
    let k = 1;
    let fade = 1;
    let kHousehold = 1;
    let kReference = 1;
    if (current) {
      ({ from, to } = current);
      k = kit.progress(t, current.at, current.at + changeTime, cssEase);
      fade = kit.progress(t, current.at, current.at + fadeTime, kit.ease.linear);
      const pill = kit.progress(t, current.at, current.at + pillTime, cssEase);
      if (current.group === 'household') kHousehold = pill;
      else kReference = pill;
    }
    withPage(kit, (pageCtx) => {
      drawControls(pageCtx, data, { from, to, kHousehold, kReference, lang: kit.lang });
      drawChart(pageCtx, data, { from, to, k, fade, reader: scene.reader, lang: kit.lang });
    });

    if (scene.finger && steps.length > 0) {
      const keyframes = [];
      let previous = -Infinity;
      for (const step of steps) {
        const target = toCanvas(
          pillCenter(ctx, data, step.group, step.to[step.group], step.from[step.group], kit.lang)
        );
        if (keyframes.length === 0) keyframes.push({ t: 0, at: offFrame(kit, target) });
        const moveFrom = Math.max(previous + 0.2, step.at - 0.8);
        keyframes.push({ t: moveFrom, at: keyframes.at(-1).at }, { t: step.at - 0.1, at: target });
        previous = step.at;
      }
      leaveFrame(kit, keyframes, previous);
      kit.finger({ t, keyframes, taps: steps.map((step) => step.at) });
    }
  },
};

// Taps in time order, each with the moment its detail closes: on the × when
// there is time before the next tap (or the end), otherwise at the next tap
function tooltipTaps(scene, duration) {
  const taps = (scene.taps ?? []).toSorted((a, b) => a.at - b.at);
  return taps.map((tap, i) => {
    const next = taps[i + 1]?.at ?? (scene.close ? duration : Infinity);
    const closeAt = next - 1.1 >= tap.at + 1.2 ? next - 1.1 : null;
    return { ...tap, closeAt, end: closeAt ?? next };
  });
}

function tooltipSegments(key, scene, duration, data) {
  const { household, reference } = scene;
  const varsOf = (country) => ({
    ...stateVars(data, household, reference),
    ...countryVars(data, country, household, reference),
  });
  const taps = tooltipTaps(scene, duration).map((tap) => ({ ...tap, vars: varsOf(tap.country) }));
  // Before the first tap, the country placeholders are those of the first one
  return stepSegments(key, scene, taps, duration, varsOf(taps[0]?.country));
}

// Interaction demo: a finger taps one country after another and the mobile
// detail opens for each
const tooltip = {
  label: 'Demo: toca un país',
  group: 'Demos',
  description:
    'Un dedo toca uno o varios países y se abre su detalle, como en el móvil; se cierra con la ×.',
  duration: 7,
  enter: 'none',
  exit: 'none',
  placeholders: { ...countryPlaceholders, ...statePlaceholders },
  placeholdersHelp:
    'Los del país siguen al último país tocado (antes del primer toque, los del primero).',
  fields: [
    ...stateFields,
    {
      key: 'taps',
      label: 'Países que se tocan',
      type: 'steps',
      fields: [
        { key: 'at', label: 'Segundo', type: 'time' },
        { key: 'country', label: 'País', type: 'select', options: countryOptions },
        ...stepTextFields,
      ],
      newItem: { country: 'ES' },
      maxItems: 8,
      help: 'Cada país se toca en su segundo de la interacción y su detalle se cierra antes del siguiente. «Ahora» toma el momento de la barra de tiempo. El título y el texto de un paso sustituyen a los generales desde ese segundo; vacíos, sigue la redacción anterior. Los datos del país ({pais}, {lectura}…) son siempre los del último país tocado.',
    },
    readerField,
    { key: 'close', label: 'Cerrar el último detalle al final', type: 'checkbox' },
  ],
  defaults: {
    title: 'Toca un país para ver sus cifras',
    household: 'single',
    reference: 'poverty',
    taps: [{ at: 2.2, country: 'ES' }],
    reader: 'ES',
    close: true,
  },
  vars: (data, scene) => ({
    ...stateVars(data, scene.household, scene.reference),
    ...countryVars(
      data,
      tooltipTaps(scene, Infinity)[0]?.country,
      scene.household,
      scene.reference
    ),
  }),
  titleSegments: (scene, duration, data) => tooltipSegments('title', scene, duration, data),
  textSegments: (scene, duration, data) => tooltipSegments('text', scene, duration, data),
  render(kit, { t, duration, scene, data }) {
    const state = { household: scene.household, reference: scene.reference };
    const taps = tooltipTaps(scene, duration);
    // The chart opens and closes the modal with a 100 ms fade
    const open = taps.findLast((tap) => t >= tap.at && t < tap.end + 0.1);
    const alpha = !open
      ? 0
      : Math.min(
          kit.progress(t, open.at, open.at + 0.1, kit.ease.linear),
          open.closeAt == null
            ? 1
            : 1 - kit.progress(t, open.closeAt, open.closeAt + 0.1, kit.ease.linear)
        );
    const shown = open ?? taps[0];

    const closeAt = withPage(kit, (ctx) => {
      drawControls(ctx, data, {
        from: state,
        to: state,
        kHousehold: 1,
        kReference: 1,
        lang: kit.lang,
      });
      drawChart(ctx, data, {
        from: state,
        to: state,
        hovered: alpha > 0 ? shown.country : null,
        reader: scene.reader,
        lang: kit.lang,
      });
      if (!shown) return null;
      const { household, reference } = scene;
      return drawTooltip(ctx, data, {
        iso: shown.country,
        household,
        reference,
        alpha,
        s: fontScale,
        lang: kit.lang,
      }).closeAt;
    });
    if (taps.length === 0) return;

    // Finger: to each country, and to the × when the detail closes on it
    const keyframes = [];
    const presses = [];
    let previous = -Infinity;
    const press = (at, target) => {
      if (keyframes.length === 0) keyframes.push({ t: 0, at: offFrame(kit, target) });
      const moveFrom = Math.max(previous + 0.2, at - 0.8);
      keyframes.push({ t: moveFrom, at: keyframes.at(-1).at }, { t: at - 0.1, at: target });
      presses.push(at);
      previous = at;
    };
    for (const tap of taps) {
      const row = rowState(data, tap.country, state);
      press(
        tap.at,
        toCanvas([
          labelWidth + (row.hasData ? row.dotX : 40),
          page.svgY + marginTop + row.top + data.rows.middle,
        ])
      );
      if (tap.closeAt != null) press(tap.closeAt, toCanvas(closeAt));
    }
    leaveFrame(kit, keyframes, previous);
    kit.finger({ t, keyframes, taps: presses });
  },
};

export default {
  id: 'imv-pobreza-eu',
  title: 'Rentas mínimas y umbral de pobreza en Europa',
  // The chart exists in English too (language.svelte.js): its labels follow
  // the language of the video
  languages: ['es', 'en'],
  source: {
    es: 'Fuente: MISSOC, Eurostat y páginas oficiales.',
    en: 'Source: MISSOC, Eurostat and official sources.',
  },
  theme: { accent: shortfallText },
  load,
  scenes: { cover, chart, focus, change, tooltip },
  // A cover with the minimal chart opens the video. Demo texts wait for
  // their tap, so none flashes before it can be read; each demo ends 4 s
  // after its last tap.
  story: [
    { type: 'cover' },
    { type: 'chart' },
    { type: 'focus', country: 'EE' },
    { type: 'focus', country: 'ES', fromCountry: 'EE', release: true },
    {
      type: 'change',
      text: '',
      steps: [{ at: 2, filter: 'reference:extreme', text: '{resumenEncima}' }],
      duration: 6,
    },
    {
      type: 'change',
      title: '{hogar}',
      text: '',
      fromHousehold: 'single',
      fromReference: 'extreme',
      steps: [
        { at: 2, filter: 'household:family' },
        { at: 3, filter: 'reference:poverty', text: '{resumenEncima} {sinDatos}' },
      ],
      duration: 7,
    },
    {
      type: 'tooltip',
      household: 'family',
      reference: 'poverty',
      close: false,
      duration: 6.2,
    },
    {
      type: 'card',
      cardTitle: 'Explora el gráfico interactivo',
      logo: true,
      background: 'previous',
      exit: 'none',
      duration: 5,
    },
  ],
};
