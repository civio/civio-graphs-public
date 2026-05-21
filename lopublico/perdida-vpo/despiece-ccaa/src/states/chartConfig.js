// Stack configuration for the accumulated chart.
// Order bottom → top.
export const stackOrder = ['permanent', 'protected', 'maybe', 'lost'];

// Alternate grouping split by `plan` (estatal/autonomico).
export const planStackOrder = ['estatal', 'autonomico', 'sinInfo', 'lost'];

// Alternate grouping split by `promotor`.
export const promotorStackOrder = ['publico', 'privado', 'autopromotor', 'sinAnimoLucro', 'sinInfo', 'lost'];

// Alternate grouping split by `tenencia`.
export const tenenciaStackOrder = ['propiedad', 'alquiler', 'mixto', 'sinInfo', 'lost'];

// First year considered projection. Shared across the chart so the x-axis cut,
// the BuiltLine solid/dashed split and the projection overlay stay in sync.
export const firstProjectionYear = 2026;
