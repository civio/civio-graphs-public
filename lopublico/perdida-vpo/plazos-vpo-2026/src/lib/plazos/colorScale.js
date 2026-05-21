export const thresholds = [
  { max: 15, color: '#f85f96', label: '≤ 15' },
  { max: 30, color: '#ae82a2', label: '16–30' },
  { max: 90, color: '#8b7ca2', label: '31–90' },
];

export const permanentColor = '#405dbb';

const bandSeparatorColor = 'var(--bw100)';
const bandSeparatorWidth = 1;

export const isFullyPermanent = (sub) => sub.isPermanent && sub.years == null;

export const getCurrentSubs = (row) => row.subs ?? [];

function colorForValue(value) {
  if (value === null || value === undefined) return 'var(--bw200)';
  for (const t of thresholds) {
    if (value <= t.max) return t.color;
  }
  return thresholds.at(-1).color;
}

export function effectiveYears(sub) {
  if (isFullyPermanent(sub)) return null;
  if (sub.years != null) return sub.years;
  if (sub.minYears != null && sub.maxYears != null) {
    return Math.round((sub.minYears + sub.maxYears) / 2);
  }
  return sub.maxYears ?? sub.minYears ?? null;
}

export function subColor(sub) {
  if (isFullyPermanent(sub)) return permanentColor;
  const v = effectiveYears(sub);
  if (v == null) return 'var(--bw200)';
  return colorForValue(v);
}

export function subBackground(sub) {
  if (isFullyPermanent(sub)) return permanentColor;
  if (sub.years != null) return colorForValue(sub.years);
  if (sub.minYears != null && sub.maxYears != null) {
    const cMin = colorForValue(sub.minYears);
    const cMax = colorForValue(sub.maxYears);
    return `linear-gradient(to right, ${cMin} 0%, ${cMax} 100%)`;
  }
  return subColor(sub);
}

export function subLabel(sub) {
  if (isFullyPermanent(sub)) return 'Permanente';
  if (sub.years != null) return `${sub.years}`;
  if (sub.minYears != null && sub.maxYears != null) return `${sub.minYears}–${sub.maxYears}`;
  return '?';
}

function stripeColors(sub) {
  if (isFullyPermanent(sub)) return [permanentColor, permanentColor];
  if (sub.years != null) {
    const c = colorForValue(sub.years);
    return [c, c];
  }
  if (sub.minYears != null && sub.maxYears != null) {
    return [colorForValue(sub.minYears), colorForValue(sub.maxYears)];
  }
  const c = subColor(sub);
  return [c, c];
}

export function diagonalGradient(subs) {
  if (subs.length === 0) return 'var(--bw200)';
  if (subs.length === 1) return subBackground(subs[0]);
  const n = subs.length;
  const sepPx = bandSeparatorWidth;
  const totalSepPx = (n - 1) * sepPx;
  const separator = bandSeparatorColor;
  const stops = [];
  for (let i = 0; i < n; i++) {
    const [startColor, endColor] = stripeColors(subs[i]);
    if (i > 0) {
      stops.push(
        `${separator} calc(${(i / n) * 100}% + ${Math.round((i * totalSepPx) / n) - sepPx}px)`
      );
      stops.push(`${startColor} calc(${(i / n) * 100}% + ${Math.round((i * totalSepPx) / n)}px)`);
    } else {
      stops.push(`${startColor} 0%`);
    }
    if (i < n - 1) {
      stops.push(
        `${endColor} calc(${((i + 1) / n) * 100}% + ${Math.round(((i + 1) * totalSepPx) / n) - sepPx}px)`
      );
      stops.push(
        `${separator} calc(${((i + 1) / n) * 100}% + ${Math.round(((i + 1) * totalSepPx) / n) - sepPx}px)`
      );
    } else {
      stops.push(`${endColor} 100%`);
    }
  }
  return `linear-gradient(135deg, ${stops.join(', ')})`;
}
