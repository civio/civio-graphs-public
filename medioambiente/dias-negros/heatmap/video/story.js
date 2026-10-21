// Video module of the días negros heatmap, loaded by the "Vídeos para
// historias" editor of civio-toolkit from
// https://graphs.civio.es/medioambiente/dias-negros/heatmap/video/story.js.
// It declares the chart's scene types, their editable fields and a default
// story; the shared layers, transitions and export come from the kit handed
// to every render call. Contract: .claude/skills/video-story/CONTRACT.md.
//
// Text drawn through `kit.text`/`kit.callout` is editorial and disappears in
// the "no text" export; axis labels and the redrawn UI of the demo use the
// canvas directly because they are part of the chart.

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const dataUrl =
  'https://data.civio.es/espanaenllamas/fires-map/dias_negros/incendios_por_dia_provincia.csv';

// Same threshold and palette as the published chart (src/states/data.svelte.js
// and src/utils/colors.svelte.js)
const severeFiresThreshold = 50;
const palette = ['#ffe73a', '#ffb114', '#e8590c', '#7a3305', '#4A2003'];
const severeOutlineColor = '#555';
const ink = '#1a1a1a';
const textGray = '#404040';
const axisGray = '#8c8c8c';
const gridGray = '#e6e6e6';
const stripeGray = '#f2f2f2';
const primary = '#ffb114';
const bw70 = '#ededed';
const bw200 = '#cccccc';
const bw400 = '#999999';
const bw500 = '#808080';
const bw600 = '#666666';
const bw700 = '#4d4d4d';

// Geometry (1080×1920 canvas)
const width = 1080;
const height = 1920;
const sideMargin = 64;
const contentWidth = width - 2 * sideMargin;
const plotX0 = 160;
const plotX1 = width - sideMargin;
const plotY0 = 700;
const rowHeight = 28;
const daysInYear = 366;
const dimmedAlpha = 0.05;
// Days the reveal sweep takes to grow a circle to full size
const popDays = 30;
// Visible span (in days) when zooming into a day
const zoomSpan = 62;

const levels = {
  comunidad: { plural: 'Comunidades', singular: 'Comunidad autónoma' },
  provincia: { plural: 'Provincias', singular: 'Provincia' },
};

const monthNamesShort = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const monthNamesLong = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

// Day-of-year of the first day of each month, in a leap reference year so
// the ticks match the 366-day domain (same as src/utils/calendar.js)
const monthTicks = d3
  .range(12)
  .map((m) => d3.utcDay.count(new Date(Date.UTC(2000, 0, 1)), new Date(Date.UTC(2000, m, 1))));

const dateFormat = (options) => new Intl.DateTimeFormat('es-ES', { ...options, timeZone: 'UTC' }).format;
const formatDate = dateFormat({ day: 'numeric', month: 'long', year: 'numeric' });
const formatDayMonth = dateFormat({ day: 'numeric', month: 'long' });
const formatDayMonthShort = dateFormat({ day: 'numeric', month: 'short' });
const isoDate = d3.utcFormat('%Y-%m-%d');

function dayOfYear(date) {
  return d3.utcDay.count(d3.utcYear(date), date);
}

// ---------------------------------------------------------------------------
// Data

// Level-wide scales, so colors and sizes stay comparable across its regions
function makeLevel(byRegion) {
  const worst = new Map(
    Array.from(byRegion, ([name, rows]) => [name, d3.max(rows, (d) => d.incendios_activos)])
  );
  // Sorted by worst day, like the chart's region selector
  const names = Array.from(byRegion.keys()).toSorted((a, b) =>
    d3.descending(worst.get(a), worst.get(b))
  );
  const maxValue = worst.get(names[0]);
  return {
    byRegion,
    names,
    maxValue,
    radius: d3.scaleSqrt().domain([1, maxValue]).range([2.5, rowHeight * 0.66]),
    color: d3.scaleSequential(d3.piecewise(d3.interpolateHcl, palette)).domain([1, maxValue]),
  };
}

async function load() {
  const rows = await d3.csv(dataUrl, d3.autoType);
  const [minYear, maxYear] = d3.extent(rows, (d) => d.fecha.getUTCFullYear());
  const years = d3.range(minYear, maxYear + 1);

  // Comunidad reading: sum of its provincias day by day (as in data.svelte.js)
  const byComunidad = d3
    .flatRollup(
      rows,
      (days) => d3.sum(days, (d) => d.incendios_activos),
      (d) => d.comunidad,
      (d) => d.fecha
    )
    .map(([comunidad, fecha, incendios_activos]) => ({ fecha, comunidad, incendios_activos }));

  return {
    years,
    yearIndex: new Map(years.map((y, i) => [y, i])),
    levels: {
      comunidad: makeLevel(d3.group(byComunidad, (d) => d.comunidad)),
      provincia: makeLevel(d3.group(rows, (d) => d.provincia)),
    },
    regionCache: new Map(),
    detailCache: new Map(),
  };
}

// Everything the chart needs for one region, built once per region
function getRegion(data, level, name) {
  const key = `${level}-${name}`;
  if (data.regionCache.has(key)) return data.regionCache.get(key);

  const levelData = data.levels[level];
  const rows = levelData.byRegion.get(name) ?? [];
  const worstValue = d3.max(rows, (d) => d.incendios_activos) ?? 0;
  const worstRow = rows.find((d) => d.incendios_activos === worstValue);

  const region = {
    name,
    level,
    radius: levelData.radius,
    color: levelData.color,
    maxValue: levelData.maxValue,
    byDate: new Map(rows.map((d) => [isoDate(d.fecha), d])),
    rowsByYear: d3.group(rows, (d) => d.fecha.getUTCFullYear()),
    cells: rows
      .map((d) => ({
        doy: dayOfYear(d.fecha),
        row: data.yearIndex.get(d.fecha.getUTCFullYear()),
        value: d.incendios_activos,
        radius: levelData.radius(d.incendios_activos),
        fill: levelData.color(d.incendios_activos),
        outlined: d.incendios_activos > severeFiresThreshold || d.incendios_activos === worstValue,
      }))
      // Biggest circles painted last, on top (same order as Heatmap.svelte)
      .toSorted((a, b) => d3.ascending(a.value, b.value)),
    worstYears: new Set(
      rows.filter((d) => d.incendios_activos === worstValue).map((d) => d.fecha.getUTCFullYear())
    ),
    worst: worstRow ? dayInfo(data, levelData, worstRow.fecha, worstValue) : null,
  };
  data.regionCache.set(key, region);
  return region;
}

function dayInfo(data, levelData, date, value) {
  return {
    doy: dayOfYear(date),
    row: data.yearIndex.get(date.getUTCFullYear()),
    year: date.getUTCFullYear(),
    value,
    date: formatDate(date),
    radius: value > 0 ? levelData.radius(value) : 4,
  };
}

// Day picked in the form (YYYY-MM-DD) or, when empty or out of range, the
// region's worst day. A date without fires reads 0.
function focusDay(data, region, dateString) {
  const date = dateString ? new Date(`${dateString}T00:00:00Z`) : null;
  if (!date || Number.isNaN(date.getTime()) || !data.yearIndex.has(date.getUTCFullYear())) {
    return region.worst;
  }
  const value = region.byDate.get(dateString)?.incendios_activos ?? 0;
  return dayInfo(data, data.levels[region.level], date, value);
}

// Placeholders available in every text field of a scene
function regionVars(region, day) {
  return {
    region: region.name,
    nivel: levels[region.level].singular,
    fecha: day?.date ?? '',
    incendios: day?.value ?? '',
    año: day?.year ?? '',
  };
}

// ---------------------------------------------------------------------------
// Heatmap drawing

function xScale([d0, d1]) {
  const pxPerDay = (plotX1 - plotX0) / (d1 - d0);
  return (doy) => plotX0 + (doy - d0) * pxPerDay;
}

function rowCenter(row) {
  return plotY0 + (row + 0.5) * rowHeight;
}

// Domain [d0, d1] a bit before the day, so the build-up is visible,
// clamped to the year
function interpolateDomain(doy, zoom) {
  const z0 = Math.max(0, Math.min(daysInYear - zoomSpan, doy - 40));
  return [z0 * zoom, d3.interpolateNumber(daysInYear, z0 + zoomSpan)(zoom)];
}

// Rows appear one after another, each swept left to right with its circles
// popping in as the sweep passes
function sweepReveal(t, start, stagger, rowDuration) {
  return (row, doy) => {
    const sweep = ((t - start - row * stagger) / rowDuration) * (daysInYear + popDays);
    return d3.easeBackOut(Math.max(0, Math.min(1, (sweep - doy) / popDays)));
  };
}

// 'rows': row by row, fitted to the scene; 'fast': all at once; 'none':
// already drawn (continues the previous scene)
function revealFor(mode, t, duration, rowCount) {
  if (mode === 'rows') {
    const rowDuration = 1.1;
    const available = Math.max(1.5, Math.min(6.2, duration - 2));
    return sweepReveal(t, 0.6, Math.max(0, (available - rowDuration) / (rowCount - 1)), rowDuration);
  }
  if (mode === 'fast') return sweepReveal(t, 0, 0.02, 0.9);
  return () => 1;
}

// One row per year, one circle per day. `reveal(row, doy)` gives the
// circle's scale (0–1); `focus` dims every row but `focusRow`.
function drawChart(
  { ctx },
  data,
  region,
  { alpha = 1, reveal = () => 1, focus = 0, focusRow = region.worst?.row, domain = [0, daysInYear] } = {}
) {
  if (alpha <= 0) return;
  const xAt = xScale(domain);
  const rowsHeight = data.years.length * rowHeight;
  const otherAlpha = 1 - focus * (1 - dimmedAlpha);
  const rowAlpha = (row) => (row === focusRow ? 1 : otherAlpha);
  const visible = (x) => x >= plotX0 - 12 && x <= plotX1 + 12;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Gray stripe behind the worst year(s)
  ctx.fillStyle = stripeGray;
  for (const year of region.worstYears) {
    const row = data.yearIndex.get(year);
    ctx.globalAlpha = alpha * Math.min(1, reveal(row, 0) * 4);
    ctx.fillRect(sideMargin, plotY0 + row * rowHeight, contentWidth, rowHeight);
  }
  ctx.globalAlpha = alpha;

  // Month lines and circles are clipped to the plot, so zooming in doesn't
  // spill circles over the year labels
  ctx.save();
  ctx.beginPath();
  ctx.rect(plotX0 - 12, plotY0 - rowHeight, plotX1 - plotX0 + 36, rowsHeight + 2 * rowHeight);
  ctx.clip();

  ctx.strokeStyle = gridGray;
  ctx.lineWidth = 1.5;
  for (const tick of monthTicks) {
    const x = xAt(tick);
    if (!visible(x)) continue;
    ctx.beginPath();
    ctx.moveTo(x, plotY0);
    ctx.lineTo(x, plotY0 + rowsHeight);
    ctx.stroke();
  }

  ctx.strokeStyle = severeOutlineColor;
  ctx.lineWidth = 1.5;
  for (const cell of region.cells) {
    if (cell.doy < domain[0] - 10 || cell.doy > domain[1] + 10) continue;
    const scale = reveal(cell.row, cell.doy);
    if (scale <= 0) continue;
    ctx.globalAlpha = alpha * rowAlpha(cell.row);
    ctx.fillStyle = cell.fill;
    ctx.beginPath();
    ctx.arc(xAt(cell.doy + 0.5), rowCenter(cell.row), cell.radius * scale, 0, 2 * Math.PI);
    ctx.fill();
    if (cell.outlined) {
      // Outlines on dimmed rows fade out completely: faint rings on faint
      // circles would only add noise around the focused row
      ctx.globalAlpha = alpha * (cell.row === focusRow ? 1 : 1 - focus);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Year labels: every 5 years plus the worst year(s) and the focused one;
  // a regular tick right next to a highlighted year is dropped
  const highlighted = new Set(region.worstYears);
  if (focus > 0 && focusRow != null) highlighted.add(data.years[focusRow]);
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (const year of data.years) {
    const isHighlighted = highlighted.has(year);
    const regular = year % 5 === 0 && !highlighted.has(year - 1) && !highlighted.has(year + 1);
    if (!isHighlighted && !regular) continue;
    const row = data.yearIndex.get(year);
    ctx.globalAlpha = alpha * rowAlpha(row) * Math.min(1, reveal(row, 0) * 4);
    ctx.font = isHighlighted ? '900 24px Lato' : '400 24px Lato';
    ctx.fillStyle = isHighlighted ? ink : axisGray;
    ctx.fillText(String(year), plotX0 - 18, rowCenter(row));
  }

  // Month labels: short names for the full year, long ones once zoomed in
  ctx.globalAlpha = alpha * Math.min(1, reveal(0, 0) * 4);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '400 24px Lato';
  ctx.fillStyle = axisGray;
  const names = domain[1] - domain[0] < 120 ? monthNamesLong : monthNamesShort;
  monthTicks.forEach((tick, month) => {
    const x = xAt(tick);
    if (visible(x)) ctx.fillText(names[month], x, plotY0 + rowsHeight + 36);
  });
  ctx.restore();
}

function drawLegend({ ctx }, region, alpha) {
  if (alpha <= 0) return;
  const values = [1, 50, 200].filter((value) => value < region.maxValue);
  values.push(region.maxValue);
  const y = 640;
  let x = sideMargin;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '400 26px Lato';
  ctx.strokeStyle = severeOutlineColor;
  ctx.lineWidth = 1.5;
  values.forEach((value, i) => {
    const r = region.radius(value);
    ctx.fillStyle = region.color(value);
    ctx.beginPath();
    ctx.arc(x + r, y, r, 0, 2 * Math.PI);
    ctx.fill();
    if (value > severeFiresThreshold) ctx.stroke();
    x += 2 * r + 10;
    const label = i === values.length - 1 ? `${value} incendios activos` : String(value);
    ctx.fillStyle = textGray;
    ctx.fillText(label, x, y + 1);
    x += ctx.measureText(label).width + 32;
  });
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Demo: redrawn UI of the published mobile layout (level pills, region
// select, a year row and its detail bottom sheet)

const appTop = 590;
const controlsY = 608;
const controlsHeight = 64;
const pillPadding = 30;
const pillGap = 6;
const levelOrder = ['comunidad', 'provincia'];

function pillLayout(ctx) {
  ctx.save();
  ctx.font = '700 30px Lato';
  let x = sideMargin + pillGap;
  const pills = levelOrder.map((level) => {
    const label = levels[level].plural;
    const pill = { level, label, x, width: ctx.measureText(label).width + 2 * pillPadding };
    x += pill.width + pillGap;
    return pill;
  });
  ctx.restore();
  return pills;
}

// Highlight slides from `fromLevel` to `toLevel` as `k` goes 0 → 1
function drawControls({ ctx }, alpha, fromLevel, toLevel, k, regionName) {
  if (alpha <= 0) return;
  const pills = pillLayout(ctx);
  const last = pills.at(-1);
  const from = pills.find((pill) => pill.level === fromLevel);
  const to = pills.find((pill) => pill.level === toLevel);
  const midY = controlsY + controlsHeight / 2;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = bw70;
  ctx.beginPath();
  ctx.roundRect(sideMargin, controlsY, last.x + last.width + pillGap - sideMargin, controlsHeight, controlsHeight / 2);
  ctx.fill();

  ctx.fillStyle = primary;
  ctx.beginPath();
  ctx.roundRect(
    d3.interpolateNumber(from.x, to.x)(k),
    controlsY + 5,
    d3.interpolateNumber(from.width, to.width)(k),
    controlsHeight - 10,
    (controlsHeight - 10) / 2
  );
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 30px Lato';
  const activeLevel = k > 0.5 ? toLevel : fromLevel;
  for (const pill of pills) {
    ctx.fillStyle = pill.level === activeLevel ? 'white' : ink;
    ctx.fillText(pill.label, pill.x + pill.width / 2, midY + 1);
  }

  // Region select: pill with a primary border and a chevron
  const selectX = last.x + last.width + pillGap + 28;
  const selectWidth = width - sideMargin - selectX;
  ctx.fillStyle = 'white';
  ctx.strokeStyle = primary;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(selectX, controlsY + 2, selectWidth, controlsHeight - 4, (controlsHeight - 4) / 2);
  ctx.fill();
  ctx.stroke();
  ctx.textAlign = 'left';
  ctx.font = '400 30px Lato';
  ctx.fillStyle = bw700;
  ctx.fillText(regionName, selectX + 28, midY + 1, selectWidth - 90);
  const chevronX = selectX + selectWidth - 40;
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(chevronX - 8, midY - 4);
  ctx.lineTo(chevronX, midY + 4);
  ctx.lineTo(chevronX + 8, midY - 4);
  ctx.stroke();
  ctx.restore();
}

// Bottom sheet geometry; vertical offsets are from the sheet's top edge
const sheetTop = 780;
const sheetPadding = 44;
const sheetHeaderY = 70;
const stripY = 120;
const stripHeight = 80;
const detailGridY = 230;
const detailRowHeight = 44;
const detailFooterY = detailGridY + 12 * detailRowHeight + 50;
const detailGridX0 = sheetPadding + 86;
const detailGridX1 = width - sheetPadding - 12;
const detailCellWidth = (detailGridX1 - detailGridX0) / 31;
const detailDimmedAlpha = 0.25;
const yearNavX = 600;
const yearNavGap = 96;
const closeButtonX = width - sheetPadding - 20;

// Month-grid detail of one year, like YearDetail.svelte: local radius scale
// (the year's own max), level-wide colors, severe days outlined (or the
// year's max on quiet years)
function yearDetail(data, region, year) {
  const key = `${region.level}-${region.name}-${year}`;
  if (data.detailCache.has(key)) return data.detailCache.get(key);

  const rows = region.rowsByYear.get(year) ?? [];
  const maxValue = d3.max(rows, (d) => d.incendios_activos) ?? 0;
  const radius = d3
    .scaleSqrt()
    .domain([1, Math.max(1, maxValue)])
    .range([3, Math.min(detailRowHeight * 0.45, detailCellWidth)]);
  const highlightYearMax = !rows.some((d) => d.incendios_activos > severeFiresThreshold);

  const cellOf = (d) => ({
    day: d,
    x: detailGridX0 + (d.fecha.getUTCDate() - 0.5) * detailCellWidth,
    y: detailGridY + (d.fecha.getUTCMonth() + 0.5) * detailRowHeight,
    radius: radius(d.incendios_activos),
    fill: region.color(d.incendios_activos),
    outlined:
      d.incendios_activos > severeFiresThreshold ||
      (highlightYearMax && d.incendios_activos === maxValue),
  });

  const byValue = rows.toSorted((a, b) => d3.descending(a.incendios_activos, b.incendios_activos));
  const detail = {
    region,
    year,
    maxValue,
    cellOf,
    cells: rows.toSorted((a, b) => d3.ascending(a.incendios_activos, b.incendios_activos)).map(cellOf),
    worstDays: rows.filter((d) => d.incendios_activos === maxValue),
    topDays: byValue.slice(0, 4),
    // Day the finger taps: the biggest one outside the worst day's month,
    // so the focus ring visibly jumps across the grid
    tapDay:
      byValue.find((d) => d.fecha.getUTCMonth() !== byValue[0].fecha.getUTCMonth()) ?? byValue[1] ?? byValue[0],
  };
  data.detailCache.set(key, detail);
  return detail;
}

// Text made of plain and bold runs, drawn left to right
function drawRuns(ctx, runs, x, y, size) {
  for (const { text, bold } of runs) {
    ctx.font = `${bold ? 900 : 400} ${size}px Lato`;
    ctx.fillText(text, x, y);
    x += ctx.measureText(text).width;
  }
}

function drawColorDot(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
}

function firesLabel(value) {
  return value === 1 ? ' incendio registrado' : ' incendios registrados';
}

// Reading strip, grid and footer chips of a year detail
function drawSheetContent(ctx, detail, activeDay, top, alpha) {
  if (alpha <= 0) return;
  const { region } = detail;
  const focusedDay = activeDay ?? detail.worstDays[0];

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  // Reading strip
  const stripMid = top + stripY + stripHeight / 2;
  ctx.fillStyle = ink;
  if (!focusedDay) {
    drawRuns(ctx, [{ text: 'Sin incendios registrados' }], sheetPadding + 28, stripMid + 1, 34);
  } else {
    drawColorDot(ctx, sheetPadding + 34, stripMid, 13, region.color(focusedDay.incendios_activos));
    ctx.fillStyle = ink;
    const runs =
      !activeDay && detail.worstDays.length > 1
        ? [
            { text: `${detail.worstDays.length} días`, bold: true },
            { text: ' con ' },
            { text: String(detail.maxValue), bold: true },
            { text: firesLabel(detail.maxValue) },
          ]
        : [
            { text: formatDayMonth(focusedDay.fecha), bold: true },
            { text: ': ' },
            { text: String(focusedDay.incendios_activos), bold: true },
            { text: firesLabel(focusedDay.incendios_activos) },
          ];
    drawRuns(ctx, runs, sheetPadding + 62, stripMid + 1, 34);
  }

  // Month labels and separators
  ctx.font = '400 26px Lato';
  ctx.fillStyle = '#737373';
  ctx.strokeStyle = gridGray;
  ctx.lineWidth = 1.5;
  for (let month = 0; month < 12; month++) {
    const rowTop = top + detailGridY + month * detailRowHeight;
    if (month > 0) {
      ctx.beginPath();
      ctx.moveTo(detailGridX0, rowTop);
      ctx.lineTo(detailGridX1, rowTop);
      ctx.stroke();
    }
    ctx.fillText(monthNamesShort[month], sheetPadding, rowTop + detailRowHeight / 2);
  }

  // Circles: the rest dim while a day is picked
  ctx.strokeStyle = severeOutlineColor;
  ctx.lineWidth = 1.5;
  for (const cell of detail.cells) {
    const dimmed = activeDay && cell.day !== activeDay;
    ctx.globalAlpha = alpha * (dimmed ? detailDimmedAlpha : 1);
    ctx.fillStyle = cell.fill;
    ctx.beginPath();
    ctx.arc(cell.x, top + cell.y, cell.radius, 0, 2 * Math.PI);
    ctx.fill();
    if (cell.outlined || cell.day === activeDay) ctx.stroke();
  }

  // Focus ring: the picked day or, by default, every day tied at the max
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3;
  for (const day of activeDay ? [activeDay] : detail.worstDays) {
    const cell = detail.cellOf(day);
    ctx.beginPath();
    ctx.arc(cell.x, top + cell.y, cell.radius + 7, 0, 2 * Math.PI);
    ctx.stroke();
  }

  // Footer: the year's top days as chips, wrapping to a second line
  const chipHeight = 56;
  let x = sheetPadding;
  let y = top + detailFooterY;
  ctx.font = '400 28px Lato';
  ctx.fillStyle = bw500;
  ctx.fillText('Peores días', x, y);
  x += ctx.measureText('Peores días').width + 18;
  for (const day of detail.topDays) {
    const date = `${formatDayMonthShort(day.fecha)}: `;
    const value = String(day.incendios_activos);
    ctx.font = '400 26px Lato';
    const dateWidth = ctx.measureText(date).width;
    ctx.font = '900 26px Lato';
    const chipWidth = 24 + 16 + 12 + dateWidth + ctx.measureText(value).width + 24;
    if (x + chipWidth > width - sheetPadding) {
      x = sheetPadding;
      y += chipHeight + 14;
    }
    const active = day === activeDay;
    ctx.fillStyle = active ? bw70 : 'white';
    ctx.strokeStyle = active ? bw400 : bw200;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y - chipHeight / 2, chipWidth, chipHeight, chipHeight / 2);
    ctx.fill();
    ctx.stroke();
    drawColorDot(ctx, x + 32, y, 8, region.color(day.incendios_activos));
    ctx.fillStyle = ink;
    drawRuns(ctx, [{ text: date }, { text: value, bold: true }], x + 52, y + 1, 26);
    x += chipWidth + 12;
  }
  ctx.restore();
}

function drawNavButton(ctx, x, y, glyph) {
  ctx.fillStyle = 'white';
  ctx.strokeStyle = bw200;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 26, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = bw600;
  ctx.font = '400 40px Lato';
  ctx.fillText(glyph, x, y - 2);
}

// Bottom sheet (Tooltip on mobile): region, year stepper and close button,
// then the year detail. `yearK` cross-fades from `detail` to `next`.
function drawSheet(ctx, top, detail, next, yearK, activeDay) {
  ctx.save();
  ctx.shadowColor = 'rgba(0, 42, 109, 0.18)';
  ctx.shadowBlur = 56;
  ctx.shadowOffsetY = -16;
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.roundRect(0, top, width, height - top + 40, [40, 40, 0, 0]);
  ctx.fill();
  ctx.restore();

  ctx.save();
  const headerMid = top + sheetHeaderY;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = '900 42px Lato';
  ctx.fillStyle = ink;
  ctx.fillText(detail.region.name, sheetPadding, headerMid, yearNavX - yearNavGap - 40 - sheetPadding);

  ctx.textAlign = 'center';
  drawNavButton(ctx, yearNavX - yearNavGap, headerMid, '‹');
  drawNavButton(ctx, yearNavX + yearNavGap, headerMid, '›');
  ctx.font = '900 40px Lato';
  ctx.fillStyle = ink;
  ctx.globalAlpha = 1 - yearK;
  ctx.fillText(String(detail.year), yearNavX, headerMid);
  if (next) {
    ctx.globalAlpha = yearK;
    ctx.fillText(String(next.year), yearNavX, headerMid);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = bw600;
  ctx.font = '400 36px Lato';
  ctx.fillText('✕', closeButtonX, headerMid);

  ctx.fillStyle = bw70;
  ctx.beginPath();
  ctx.roundRect(sheetPadding, top + stripY, width - 2 * sheetPadding, stripHeight, 20);
  ctx.fill();
  ctx.restore();

  drawSheetContent(ctx, detail, activeDay, top, 1 - yearK);
  if (next) drawSheetContent(ctx, next, null, top, yearK);
}

// Step times of the demo, from the steps enabled in the scene. The scene's
// duration follows from them.
function demoSchedule(scene) {
  const s = { controlsIn: [0.3, 0.9], fingerIn: [0.9, 1.2] };
  let cursor = 1.2;
  if (scene.switchLevel) {
    s.levelTap = cursor + 1;
    s.reveal = s.levelTap + 0.3;
    cursor = s.reveal + 1.6;
  } else {
    s.reveal = 0;
  }
  s.rowMove = cursor;
  s.rowTap = cursor + 0.9;
  s.sheetOpen = [s.rowTap + 0.3, s.rowTap + 0.9];
  cursor = s.rowTap + 2.7;
  if (scene.tapDay) {
    s.dayMove = cursor;
    s.dayTap = cursor + 0.9;
    cursor = s.dayTap + 1.4;
  }
  if (scene.nextYear) {
    s.nextMove = cursor;
    s.nextTap = cursor + 0.8;
    cursor = s.nextTap + 1.6;
  }
  if (scene.close) {
    s.closeMove = cursor;
    s.closeTap = cursor + 0.8;
    s.sheetClose = [s.closeTap, s.closeTap + 0.5];
    cursor = s.closeTap + 1;
  }
  s.fingerOut = [cursor, cursor + 0.4];
  s.duration = cursor + 1.2;
  return s;
}

function otherLevel(level) {
  return level === 'comunidad' ? 'provincia' : 'comunidad';
}

function renderDemo(kit, { t, scene, data }) {
  const { ctx, progress } = kit;
  const s = demoSchedule(scene);
  const region = getRegion(data, scene.level, scene.region);
  const fromLevel = scene.switchLevel ? otherLevel(scene.level) : scene.level;
  const fromRegion = scene.switchLevel ? getRegion(data, fromLevel, scene.fromRegion) : region;
  const year = Number(scene.year);
  const detail = yearDetail(data, region, year);
  const next = scene.nextYear && data.yearIndex.has(year + 1) ? yearDetail(data, region, year + 1) : null;
  const closing = s.sheetClose ? progress(t, ...s.sheetClose) : 0;

  // Chart: the starting region fades out when the level switches and the
  // target one sweeps in; the tapped row keeps its color while the rest dims
  const selectedYear = next && t >= s.nextTap ? year + 1 : year;
  if (scene.switchLevel && t < s.reveal) {
    drawChart(kit, data, fromRegion, { alpha: 1 - progress(t, s.levelTap, s.reveal) });
  } else {
    drawChart(kit, data, region, {
      reveal: sweepReveal(t, s.reveal, 0.02, 0.9),
      focus: progress(t, s.rowTap, s.rowTap + 0.3) * (1 - closing),
      focusRow: data.yearIndex.get(selectedYear),
    });
  }

  drawControls(
    kit,
    progress(t, ...s.controlsIn),
    fromLevel,
    scene.level,
    scene.switchLevel ? progress(t, s.levelTap, s.levelTap + 0.3) : 1,
    scene.switchLevel && t < s.levelTap + 0.1 ? fromRegion.name : region.name
  );

  const overlay = progress(t, ...s.sheetOpen) * (1 - closing);
  if (overlay > 0) {
    ctx.fillStyle = `rgba(26, 29, 36, ${0.35 * overlay})`;
    ctx.fillRect(0, appTop, width, height - appTop);
  }

  const open =
    progress(t, ...s.sheetOpen, kit.ease.out) *
    (1 - (s.sheetClose ? progress(t, ...s.sheetClose, kit.ease.in) : 0));
  const top = d3.interpolateNumber(height, sheetTop)(open);
  const activeDay =
    scene.tapDay && t >= s.dayTap && !(next && t >= s.nextTap) ? detail.tapDay : null;
  if (open > 0) {
    drawSheet(ctx, top, detail, next, next ? progress(t, s.nextTap, s.nextTap + 0.35) : 0, activeDay);
  }

  // Finger: from rest to each target in turn, tapping on arrival
  const pills = pillLayout(ctx);
  const targetPill = pills.find((pill) => pill.level === scene.level);
  const keyframes = [{ t: 1, at: [760, 1350] }];
  const taps = [];
  const goTo = (tapTime, moveTime, at) => {
    keyframes.push({ t: tapTime - moveTime, at: keyframes.at(-1).at }, { t: tapTime - 0.1, at });
    taps.push(tapTime);
  };
  if (scene.switchLevel) {
    goTo(s.levelTap, 0.9, [targetPill.x + targetPill.width / 2, controlsY + controlsHeight / 2]);
  }
  goTo(s.rowTap, 0.8, [640, rowCenter(data.yearIndex.get(year))]);
  if (scene.tapDay && detail.tapDay) {
    const cell = detail.cellOf(detail.tapDay);
    goTo(s.dayTap, 0.8, [cell.x, sheetTop + cell.y]);
  }
  if (scene.nextYear) goTo(s.nextTap, 0.7, [yearNavX + yearNavGap, sheetTop + sheetHeaderY]);
  if (scene.close) goTo(s.closeTap, 0.7, [closeButtonX, sheetTop + sheetHeaderY]);
  kit.finger({
    t,
    keyframes,
    taps,
    alpha: progress(t, ...s.fingerIn) * (1 - progress(t, ...s.fingerOut)),
  });
}

// ---------------------------------------------------------------------------
// Scene types

const levelField = {
  key: 'level',
  label: 'Nivel',
  type: 'select',
  options: levelOrder.map((level) => ({ value: level, label: levels[level].plural })),
};

// Regions of the scene's level, sorted by their worst day
const regionField = {
  key: 'region',
  label: 'Región',
  type: 'select',
  options: (data, scene) => data.levels[scene.level].names.map((name) => ({ value: name, label: name })),
};

const drawingField = {
  key: 'drawing',
  label: 'Aparición del gráfico',
  type: 'select',
  options: [
    { value: 'rows', label: 'Fila a fila' },
    { value: 'fast', label: 'Rápida' },
    { value: 'none', label: 'Ya dibujado (sigue la escena anterior)' },
  ],
};

const regionPlaceholders = {
  region: 'Comunidad o provincia («Galicia»)',
  nivel: 'Nivel territorial, en singular («Comunidad autónoma»)',
};

const placeholders = {
  ...regionPlaceholders,
  fecha: 'Día señalado: el elegido o el peor de la región («3 de septiembre de 1995»)',
  incendios: 'Incendios activos ese día',
  año: 'Año de ese día',
};

const cover = {
  label: 'Portada con una fila',
  group: 'Heatmap',
  description: 'Título propio y un año de la región que aparece día a día como una fila del heatmap.',
  header: false,
  source: false,
  duration: 4,
  enter: 'none',
  exit: 'fade',
  placeholders,
  fields: [
    { key: 'coverKicker', label: 'Antetítulo', type: 'text', section: 'Textos' },
    { key: 'coverTitle', label: 'Título', type: 'textarea', section: 'Textos', help: 'Usa saltos de línea para cortar el título donde quieras.' },
    levelField,
    regionField,
    {
      key: 'year',
      label: 'Año de la fila',
      type: 'select',
      options: (data) => [
        { value: '', label: 'Su peor año' },
        ...data.years.map((year) => ({ value: String(year), label: String(year) })),
      ],
    },
    { key: 'logo', label: 'Logo de Civio', type: 'checkbox' },
  ],
  defaults: {
    coverKicker: 'Días negros',
    coverTitle: 'Incendios activos\ncada día entre\n1992 y 2022',
    level: 'comunidad',
    region: 'Galicia',
    year: '',
    logo: true,
  },
  vars: (data, scene) => {
    const region = getRegion(data, scene.level, scene.region);
    return regionVars(region, region.worst);
  },
  render(kit, { t, scene, data, vars }) {
    const { ctx, progress, colors } = kit;
    const titleIn = progress(t, 0.2, 1.1);
    const centerX = width / 2;

    kit.text(kit.fill(scene.coverKicker, vars).toUpperCase(), centerX, 690 + (1 - titleIn) * 30, {
      font: '900 32px Lato',
      color: colors.accent,
      align: 'center',
      letterSpacing: '4px',
      alpha: titleIn,
    });
    const titleFont = '900 88px Merriweather';
    kit.lines(kit.fill(scene.coverTitle, vars), contentWidth, titleFont).forEach((line, i) => {
      kit.text(line, centerX, 810 + i * 108 + (1 - titleIn) * 40, {
        font: titleFont,
        align: 'center',
        alpha: titleIn,
      });
    });

    // Teaser: one year of the region swept across the screen as a row
    const region = getRegion(data, scene.level, scene.region);
    const year = scene.year ? Number(scene.year) : region.worst?.year;
    const row = data.yearIndex.get(year);
    const pxPerDay = contentWidth / daysInYear;
    const sweep = ((t - 0.8) / 2) * (daysInYear + popDays);
    ctx.save();
    ctx.strokeStyle = severeOutlineColor;
    ctx.lineWidth = 1.5;
    for (const cell of region.cells) {
      if (cell.row !== row) continue;
      const scale = d3.easeBackOut(Math.max(0, Math.min(1, (sweep - cell.doy) / popDays)));
      if (scale <= 0) continue;
      ctx.fillStyle = cell.fill;
      ctx.beginPath();
      ctx.arc(sideMargin + (cell.doy + 0.5) * pxPerDay, 1250, cell.radius * 1.6 * scale, 0, 2 * Math.PI);
      ctx.fill();
      if (cell.outlined) ctx.stroke();
    }
    ctx.restore();

    if (scene.logo) kit.logo(centerX - 130, 1480, 260, progress(t, 0.8, 1.6));
  },
};

const reveal = {
  label: 'Heatmap de una región',
  group: 'Heatmap',
  description: 'El heatmap completo de una región, apareciendo fila a fila o ya dibujado.',
  duration: 9,
  enter: 'fade',
  exit: 'none',
  placeholders,
  fields: [
    levelField,
    regionField,
    drawingField,
    { key: 'legend', label: 'Leyenda de tamaños', type: 'checkbox' },
  ],
  defaults: {
    kicker: '{nivel}',
    title: '{region}',
    text: 'Cada fila es un año y cada punto, un día. Cuanto más grande y oscuro, más incendios activos hubo a la vez.',
    level: 'comunidad',
    region: 'Galicia',
    drawing: 'rows',
    legend: true,
  },
  vars: (data, scene) => {
    const region = getRegion(data, scene.level, scene.region);
    return regionVars(region, region.worst);
  },
  render(kit, { t, duration, scene, data }) {
    const region = getRegion(data, scene.level, scene.region);
    drawChart(kit, data, region, { reveal: revealFor(scene.drawing, t, duration, data.years.length) });
    if (scene.legend) drawLegend(kit, region, kit.progress(t, 1.2, 1.8));
  },
};

const focus = {
  label: 'Foco en un día',
  group: 'Heatmap',
  description: 'Atenúa el resto de años, amplía alrededor de un día y lo señala con sus incendios activos.',
  duration: 8,
  enter: 'none',
  exit: 'fade',
  placeholders,
  fields: [
    levelField,
    regionField,
    { key: 'day', label: 'Día destacado', type: 'date', help: 'Vacío: el peor día de la región.' },
    drawingField,
    { key: 'dim', label: 'Atenuar el resto de años', type: 'checkbox' },
    { key: 'zoom', label: 'Ampliar alrededor del día', type: 'checkbox' },
    { key: 'zoomOut', label: 'Volver al año completo al final', type: 'checkbox' },
    { key: 'callout', label: 'Etiqueta sobre el día', type: 'checkbox' },
    { key: 'calloutTitle', label: 'Etiqueta: primera línea', type: 'text', section: 'Textos' },
    { key: 'calloutText', label: 'Etiqueta: segunda línea', type: 'text', section: 'Textos' },
  ],
  defaults: {
    kicker: '{nivel}',
    title: '{region}',
    text: 'Su peor día fue el {fecha}, con {incendios} incendios activos a la vez.',
    level: 'comunidad',
    region: 'Galicia',
    day: '',
    drawing: 'none',
    dim: true,
    zoom: true,
    zoomOut: true,
    callout: true,
    calloutTitle: '{fecha}',
    calloutText: '{incendios} incendios activos a la vez',
  },
  vars: (data, scene) => {
    const region = getRegion(data, scene.level, scene.region);
    return regionVars(region, focusDay(data, region, scene.day));
  },
  render(kit, { t, duration, scene, data, vars }) {
    const { progress } = kit;
    const region = getRegion(data, scene.level, scene.region);
    const day = focusDay(data, region, scene.day);
    if (!day) return;

    // Steps start once the chart is drawn when it has to appear first
    const s0 = scene.drawing === 'none' ? 0 : scene.drawing === 'fast' ? 1.6 : Math.min(6.8, duration - 4);
    const dim = scene.dim ? progress(t, s0 + 0.2, s0 + 1) : 0;
    const zoomIn = scene.zoom ? progress(t, s0 + 1, s0 + 2.2) : 0;
    const zoomOut = scene.zoom && scene.zoomOut ? progress(t, duration - 1.7, duration - 0.7) : 0;
    const calloutStart = scene.zoom ? s0 + 2.2 : s0 + 1;
    const calloutOut = scene.zoomOut ? progress(t, duration - 2, duration - 1.7) : 0;
    const domain = interpolateDomain(day.doy, zoomIn * (1 - zoomOut));

    drawChart(kit, data, region, {
      reveal: revealFor(scene.drawing, t, duration, data.years.length),
      focus: dim,
      focusRow: day.row,
      domain,
    });
    if (scene.callout) {
      kit.callout({
        x: xScale(domain)(day.doy + 0.5),
        y: rowCenter(day.row),
        radius: day.radius,
        lines: [{ text: kit.fill(scene.calloutTitle, vars) }, { text: kit.fill(scene.calloutText, vars) }].filter(
          (line) => line.text.trim() !== ''
        ),
        alpha: progress(t, calloutStart, calloutStart + 0.5) * (1 - calloutOut),
      });
    }
  },
};

const demo = {
  label: 'Demo de uso (tooltip)',
  group: 'Heatmap',
  description: 'Un dedo cambia de nivel, toca un año y abre su detalle, como en el móvil.',
  source: false,
  enter: 'none',
  exit: 'fade',
  placeholders: { ...regionPlaceholders, año: 'Año que se toca' },
  fields: [
    levelField,
    regionField,
    {
      key: 'year',
      label: 'Año que se toca',
      type: 'select',
      options: (data) => data.years.map((year) => ({ value: String(year), label: String(year) })),
    },
    { key: 'switchLevel', label: 'Paso: cambiar de nivel', type: 'checkbox' },
    {
      key: 'fromRegion',
      label: 'Región antes de cambiar de nivel',
      type: 'select',
      options: (data, scene) =>
        data.levels[otherLevel(scene.level)].names.map((name) => ({ value: name, label: name })),
    },
    { key: 'tapDay', label: 'Paso: tocar un día', type: 'checkbox' },
    { key: 'nextYear', label: 'Paso: pasar al año siguiente', type: 'checkbox' },
    { key: 'close', label: 'Paso: cerrar el detalle', type: 'checkbox' },
    { key: 'captionLevel', label: 'Texto al cambiar de nivel', type: 'textarea', section: 'Textos' },
    { key: 'captionYear', label: 'Texto al tocar el año', type: 'textarea', section: 'Textos' },
    { key: 'captionDay', label: 'Texto al tocar el día', type: 'textarea', section: 'Textos' },
    { key: 'captionNext', label: 'Texto al pasar de año', type: 'textarea', section: 'Textos' },
  ],
  defaults: {
    kicker: 'Cómo funciona',
    title: 'Explóralo tú',
    level: 'comunidad',
    region: 'Galicia',
    year: '2005',
    switchLevel: true,
    fromRegion: 'Asturias',
    tapDay: true,
    nextYear: true,
    close: true,
    captionLevel: 'Elige entre comunidades y provincias.',
    captionYear: 'Toca cualquier año para ver su detalle.',
    captionDay: 'Toca un día para ver cuántos incendios hubo.',
    captionNext: 'Y pasa de un año a otro con las flechas.',
  },
  getDuration: (scene) => demoSchedule(scene).duration,
  // The header text follows the steps instead of the scene's single text
  textSegments(scene, duration) {
    const s = demoSchedule(scene);
    const marks = [];
    if (scene.switchLevel) marks.push([0, scene.captionLevel]);
    marks.push([scene.switchLevel ? s.rowMove : 0, scene.captionYear]);
    if (scene.tapDay) marks.push([s.dayMove, scene.captionDay]);
    if (scene.nextYear) marks.push([s.nextMove, scene.captionNext]);
    return marks.map(([start, text], i) => ({ start, end: marks[i + 1]?.[0] ?? duration, text }));
  },
  vars: (data, scene) => ({ ...regionVars(getRegion(data, scene.level, scene.region)), año: scene.year }),
  render: renderDemo,
};

export default {
  id: 'dias-negros-heatmap',
  title: 'Días negros · Incendios activos cada día',
  source: 'Fuente: Estadística General de Incendios Forestales (EGIF)',
  theme: { accent: '#e8590c' },
  load,
  scenes: { cover, reveal, focus, demo },
  // Default story: the video published on Instagram
  story: [
    { type: 'cover' },
    { type: 'reveal' },
    { type: 'focus' },
    {
      type: 'focus',
      level: 'provincia',
      region: 'A Coruña',
      drawing: 'fast',
      zoomOut: false,
      text: 'Ninguna provincia ha tenido tantos incendios activos en un solo día: {incendios}, el {fecha}.',
      duration: 6.5,
    },
    {
      type: 'focus',
      level: 'provincia',
      region: 'Asturias',
      drawing: 'fast',
      text: 'Y no solo en verano: {incendios} incendios activos el {fecha}, en pleno invierno.',
      exit: 'none',
      duration: 6.5,
    },
    { type: 'demo' },
    {
      type: 'card',
      cardTitle: '¿Cómo han sido\nlos días negros en tu\ncomunidad o provincia?',
      cardText: 'Explora el gráfico interactivo',
      background: 'previous',
      exit: 'none',
      duration: 6,
    },
  ],
};
