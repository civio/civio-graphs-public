// Scales shared across all parliament cards, so a mark means the same thing in
// every card. Domains come from the loaded dataset, so the scales are derived
// and update once the CSV arrives.
import { scaleLinear } from 'd3';
import { data } from './data.svelte.js';

// 2026 minimum wage (SMI) per month, with the extra payments prorated over 12
// like `monthlySalary`. Single source for the meter's reference line, the
// below-SMI threshold and the figure quoted in the card's note.
export const referenceSalary = 1424.5;

// Max signed vertical offset (px) of a salary from the reference line.
const offsetMax = 20;

class Scales {
  // Same figures the card shows, as they come in the source.
  #salaryValues = $derived(data.parliaments.map((p) => p.monthlySalary).filter((v) => v != null));

  // Signed vertical offset (px) of a salary from the reference line in the meter:
  // positive = above (earns more), 0 = exactly the reference. The domain is the
  // reference ± the furthest salary gap, so the reference sits at the centre and
  // the extreme salary reaches the half-height; clamped so it never overflows.
  salaryOffset = $derived.by(() => {
    const maxAbsDiff = Math.max(0, ...this.#salaryValues.map((v) => Math.abs(v - referenceSalary)));
    return scaleLinear()
      .domain([referenceSalary - maxAbsDiff, referenceSalary + maxAbsDiff])
      .range([-offsetMax, offsetMax])
      .clamp(true);
  });
}

export const scales = new Scales();
