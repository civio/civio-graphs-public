<script>
  import { circleColor, circleTextColor, severeOutlineColor } from '../../utils/colors.svelte';

  /**
   * Circular badge showing a fire count, shared by the intro text and the
   * year tooltip. Default: filled with the chart-wide color scale for that
   * count, plus the same outline as the highlighted days in the chart.
   * `outlined`: neutral bordered variant, used for day counts.
   */
  let { value, outlined = false } = $props();
</script>

<b
  class="fire-badge"
  style="--badge-border: solid 1px {severeOutlineColor};{outlined
    ? ''
    : ` --badge-bg: ${circleColor(value)}; color: ${circleTextColor(value)};`}"
>
  {value}
</b>

<style>
  /* The inline box only reserves horizontal space, so the badge never grows
     the line height; the circle is painted by ::before and overflows the
     line, behind the surrounding text */
  .fire-badge {
    display: inline-block;
    min-width: 3cap;
    text-align: center;
    position: relative;
  }

  /* The circle grows with four-digit counts, keeping some breathing room
     around the text */
  .fire-badge::before {
    content: '';
    position: absolute;
    z-index: -1;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    width: max(3cap, calc(100% + 0.5cap));
    aspect-ratio: 1;
    border-radius: 50%;
    background-color: var(--badge-bg, transparent);
    border: var(--badge-border, none);
  }
</style>
