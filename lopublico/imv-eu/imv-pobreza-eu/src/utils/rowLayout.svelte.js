import { data } from '../states/data.svelte';

/**
 * Row geometry for the dot chart: one row per country, for the household selected in the
 * filter, and the hovered country resolved from the pointer position.
 *
 * What is not geometry lives in the component: the x scale, the axis, the marks and the
 * tooltip contents.
 */

const ROW_HEIGHT = 16;
const COUNTRY_GAP = 4; // breathing room between countries
export const MARGIN = { top: 10, right: 18, bottom: 40 };

const TOOLTIP_INSET = 160; // half the tooltip width, so it never hangs off an edge
const TOOLTIP_GAP = 8;

const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max));

export class RowLayout {
  /**
   * Measured in CSS pixels rather than scaled through a viewBox, so labels keep
   * their size on narrow screens instead of shrinking with the chart.
   */
  containerWidth = $state(0);

  /**
   * Replaced whole on every pointer move, never mutated, so no deep proxy is needed.
   * @type {{ row: object, x: number, y: number } | null}
   */
  hovered = $state.raw(null);

  /**
   * The chart box, used to turn pointer coordinates into chart coordinates.
   * Measured from this reference rather than `event.currentTarget`: Svelte
   * delegates `pointermove` and `pointerdown` to the app root, so inside those
   * handlers `currentTarget` is not the element the handler was written on.
   * It is also the offset parent the tooltip is positioned against.
   * @type {HTMLElement | undefined}
   */
  #element = $state();

  #getTooltipHeight;

  /** Row spacing, exposed for what hangs off the block in the chart: the hover band. */
  countryGap = COUNTRY_GAP;

  /**
   * @param {() => number} getTooltipHeight - Current tooltip height, used only to
   *   decide whether the popover fits above the hovered country or must flip below.
   */
  constructor(getTooltipHeight) {
    this.#getTooltipHeight = getTooltipHeight;
  }

  /** @type {import('svelte/attachments').Attachment} */
  track = (node) => {
    this.#element = node;
    return () => (this.#element = undefined);
  };

  // Country names need room, but not a third of a phone screen. The floor is the
  // width of the longest name in the set ("North Macedonia", ~95px at 0.75rem):
  // below that the label spills out of its gutter and over the plot.
  labelWidth = $derived(Math.max(108, Math.min(140, this.containerWidth * 0.26)));
  innerWidth = $derived(Math.max(10, this.containerWidth - this.labelWidth - MARGIN.right));

  blockHeight = ROW_HEIGHT + COUNTRY_GAP;

  /**
   * The rows in ranking order: first in the list is the country drawn at the top.
   * Only the hit-testing reads this — see `rows` for what the charts render.
   */
  #rankedRows = $derived.by(() => {
    const types = data.activeHouseholdTypes;

    return data.sortedCountries.map((entry, index) => {
      const top = index * this.blockHeight;

      const segments = types.map((type) => {
        const row = entry.rows[type.key];
        const threshold = row?.threshold ?? null;
        const amount = row?.amount ?? null;
        const adequacy = row?.adequacy ?? null;
        const scheme = row?.scheme ?? null;

        return {
          key: type.key,
          threshold,
          amount,
          adequacy,
          scheme,
          // Percentage points away from the country's own poverty threshold.
          deviation: adequacy == null ? null : adequacy - 100,
        };
      });

      return {
        iso: entry.iso,
        country: entry.country,
        top,
        segments,
        hasDeviation: segments.some((segment) => segment.deviation != null),
      };
    });
  });

  /**
   * The same rows in a fixed order, which is the order the charts render them in.
   *
   * Re-sorting the markup instead would look right and animate wrong: Svelte moves the
   * keyed nodes to match the new order, and moving a node in the DOM discards the CSS
   * transition running on it, so a re-sorted row jumps to its new place instead of
   * sliding there — and takes the marks inside it along. Keeping the DOM order stable
   * and letting `top` carry the ranking is what makes the reordering animate.
   */
  rows = $derived(this.#rankedRows.toSorted((a, b) => a.iso.localeCompare(b.iso)));

  innerHeight = $derived(this.rows.length * this.blockHeight);
  chartHeight = $derived(MARGIN.top + this.innerHeight + MARGIN.bottom);

  /**
   * Resolves the pointer position to a country block.
   *
   * A single handler on the <svg> beats one invisible hit rect per country: the
   * rows are a regular grid, so the index is pure arithmetic, and it keeps the
   * decorative SVG free of the per-element mouse handlers that would otherwise
   * need keyboard equivalents.
   */
  #update(event) {
    if (!this.#element) return;

    const bounds = this.#element.getBoundingClientRect();
    const index = Math.floor((event.clientY - bounds.top - MARGIN.top) / this.blockHeight);

    if (index < 0 || index >= this.#rankedRows.length) {
      this.hovered = null;
      return;
    }

    const row = this.#rankedRows[index];
    const blockTop = MARGIN.top + row.top - this.countryGap / 2;
    const tooltipHeight = this.#getTooltipHeight();

    // The tooltip renders with `translate(-50%, -110%)`, so its bottom edge lands
    // at `y - 0.1 * height` and its top edge at `y - 1.1 * height`. Flip it below
    // the country unless it fits above on both counts: inside the chart box, so it
    // never floats over the controls, and inside the viewport, which the chart —
    // far taller than the screen — would otherwise let it scroll out of.
    const roomAbove = blockTop - tooltipHeight - TOOLTIP_GAP;
    const fitsAbove = roomAbove > 0 && bounds.top + roomAbove > 0;

    this.hovered = {
      row,
      x: clamp(event.clientX - bounds.left, TOOLTIP_INSET, this.containerWidth - TOOLTIP_INSET),
      y: fitsAbove
        ? blockTop - TOOLTIP_GAP + 0.1 * tooltipHeight
        : blockTop + this.blockHeight + TOOLTIP_GAP + 1.1 * tooltipHeight,
    };
  }

  // Mouse and pen hover; touch taps instead, and dismisses via the modal.
  handleMove = (event) => {
    if (event.pointerType !== 'touch') this.#update(event);
  };

  handleDown = (event) => {
    if (event.pointerType === 'touch') this.#update(event);
  };

  clear = () => {
    this.hovered = null;
  };
}
