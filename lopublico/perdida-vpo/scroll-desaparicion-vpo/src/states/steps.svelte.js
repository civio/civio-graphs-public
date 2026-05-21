// Area composition — which data keys sum into each visual area at each step.
// The last rule whose `from` ≤ current step wins. If no rule matches, area has sum 0.
const areaRules = {
  permanent: [{ from: 1, sum: ['permanent'] }],
  protected: [
    { from: 1, sum: ['protected', 'maybe', 'lost'] },
    { from: 2, sum: ['protected', 'maybe'] },
    { from: 3, sum: ['protected'] },
  ],
  maybe: [{ from: 3, sum: ['maybe'] }],
  // `lost` becomes a visible stacked layer from step 2 — accompanies the
  // narrative "300.000 viviendas pierden protección".
  lost: [{ from: 2, sum: ['lost'] }],
};

// Order of areas, bottom → top.
export const stackOrder = ['permanent', 'protected', 'maybe', 'lost'];

// Alternate groupings for the interactive step.
export const planStackOrder = ['estatal', 'autonomico', 'sinInfo', 'lost'];
export const promotorStackOrder = [
  'publico',
  'privado',
  'autopromotor',
  'sinAnimoLucro',
  'sinInfo',
  'lost',
];
export const tenenciaStackOrder = ['propiedad', 'alquiler', 'mixto', 'sinInfo', 'lost'];

// Simple visibility thresholds.
export const visibility = {
  yAxis: 0,
  builtLine: 0,
  interactive: 5,
};

// First year considered projection. Shared across the chart so the x-axis cut,
// the BuiltLine solid/dashed split and the projection overlay stay in sync.
export const firstProjectionYear = 2026;

// X axis domain rules. `firstYear` is a placeholder resolved by the consumer.
// The consumer extends these bounds by +1 so each year owns a full horizontal
// slot, so the effective last visible year equals `domain[1]` here.
const xDomainRules = [
  { from: 0, domain: ['firstYear', firstProjectionYear - 1] },
  { from: 4, domain: ['firstYear', 2030] },
];

function resolveRule(rules, step) {
  for (let i = rules.length - 1; i >= 0; i--) {
    if (rules[i].from <= step) return rules[i];
  }
  return null;
}

export function areaSum(areaKey, step) {
  return resolveRule(areaRules[areaKey] ?? [], step)?.sum ?? [];
}

export function xDomain(step, firstYear) {
  const rule = resolveRule(xDomainRules, step);
  return rule.domain.map((v) => (v === 'firstYear' ? firstYear : v));
}

// Narrative steps. `text` and `a11y` are functions of the key figures `f`
// (see `getKeyFigures` in data.svelte.js) so headline numbers come from the
// data instead of being hardcoded. Steps that don't reference figures still
// take `f` for API uniformity.
export const texts = [
  {
    text: () =>
      'Entre 1991 y 2025 se han construido más de 1,5 millones de viviendas protegidas en España. El ritmo en los últimos doce años ha disminuido considerablemente.',
    info: 'Parque de viviendas',
    a11y: () =>
      'Gráfico de líneas que crece año a año, con el acumulado de viviendas protegidas construidas en España durante estos años.',
  },
  {
    text: (f) =>
      `De ellas, únicamente ${f.permanent} tienen una protección permanente. El resto, ${f.temporal}, tienen una protección temporal, es decir, pasarán al mercado libre después de un tiempo.`,
    info: 'Tiempos de protección',
    a11y: () =>
      'El gráfico se rellena con dos áreas apiladas: las de protección permanente abajo y las de protección temporal encima.',
  },
  {
    text: () =>
      'Casi 400.000 viviendas de protección oficial construidas en España desde 1991 han ido perdiendo su protección, pasando al mercado libre, según los plazos de descalificación definidos por las normativas estatales y autonómicas vigentes cada año.',
    info: 'Pérdida de VPOs',
    a11y: () =>
      'Aparece una tercera capa apilada encima: las viviendas que han perdido definitivamente su protección. La capa empieza en 2014 a consta de la de protección temporal.',
  },
  {
    text: () =>
      'Hablamos de mínimos. La cifra real podría ser muy superior, ya que hay comunidades que permiten desproteger una VPO antes de que se cumpla, generalmente a cambio de devolver las ayudas públicas recibidas. A cierre de 2025 habría más de medio millón de viviendas que podrían haber pasado al mercado libre bajo esta opción.',
    info: 'Descalificación voluntaria',
    a11y: () =>
      'Aparece una cuarta capa apilada: descalificación voluntaria anticipada. El área de protección temporal disminuye drásticamente y queda por debajo de la nueva capa.',
  },
  {
    text: (f) =>
      `En los próximos cinco años esta cifra podría incrementarse de forma significativa. Para finales de 2030, ${f.lost} viviendas habrán pasado al mercado libre y otras ${f.maybe} podrían descalificarse anticipadamente si no lo han hecho ya.`,
    info: 'Proyección a 2030',
    a11y: () =>
      'El eje horizontal se extiende ahora hasta 2030 con la proyección. Las capas de descalificación voluntaria y pérdidas crecen considerablemente; la de protección temporal queda como la más reducida.',
  },
  {
    text: () =>
      'Ahora puedes explorar cómo ha variado el parque de vivienda protegida en España entre 1991 y 2025, con las proyecciones de pérdida de protección a 2030 según la normativa estatal y regional.',
    info: 'Exploración libre',
    a11y: () =>
      'Se inicia la vista interactiva de exploración libre. Con los controles anteriores se permite alternar entre cuatro dimensiones de análisis: protección, plan, promoción o uso. La tabla muestra todos los datos disponibles según la dimensión seleccionada.',
  },
];
