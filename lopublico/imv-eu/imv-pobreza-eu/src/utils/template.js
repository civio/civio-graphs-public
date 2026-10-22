// Sentences in the language file are whole, with `{key}` placeholders, so a translation can
// move the pieces around. These fill them in.

// A key with no value leaves a gap in the sentence instead of printing "undefined".
export const fill = (template, values) =>
  template.replaceAll(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

/**
 * For sentences that carry their own markup (`<b>…</b>`) and are rendered with `{@html}`.
 * The values are escaped, so data can never add markup of its own.
 */
export const fillHtml = (template, values) =>
  template.replaceAll(/\{(\w+)\}/g, (_, key) => escapeHtml(values[key] ?? ''));

/**
 * A sentence split around one of its placeholders, for when that piece has to be an element
 * of its own (a link) while the sentence stays whole in the language file.
 */
export function splitAt(template, key, values = {}) {
  const [before, after = ''] = template.split(`{${key}}`);
  return { before: fill(before, values), after: fill(after, values) };
}
