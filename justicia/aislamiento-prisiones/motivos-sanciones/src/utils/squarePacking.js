// Best-fit square packing
// Inspired by https://observablehq.com/@esperanc/square-packing
// Places squares one at a time (largest first), each as close
// to center as possible, anchored to corners of already-placed squares.

export function packSquaresBestFit(values, maxValue, gap = 0) {
  if (!values.length) return { squares: [], extent: { x: 0, y: 0, width: 0, height: 0 } };

  const max = Math.sqrt(maxValue);
  const sides = values.map((v) => Math.sqrt(v) / max);
  // Inflate sides for collision detection; visual side is computed by the caller
  const effectiveSides = sides.map((s) => s * (1 + gap));
  const EPS = 1e-9;
  const placed = []; // { x, y, side }

  function overlaps(a, b) {
    return (
      a.x < b.x + b.side - EPS &&
      a.x + a.side > b.x + EPS &&
      a.y < b.y + b.side - EPS &&
      a.y + a.side > b.y + EPS
    );
  }

  function anyOverlap(cand) {
    for (const sq of placed) {
      if (overlaps(cand, sq)) return true;
    }
    return false;
  }

  // Place first square centered at origin
  const s0 = effectiveSides[0];
  placed.push({ x: -s0 / 2, y: -s0 / 2, side: s0 });

  for (let i = 1; i < effectiveSides.length; i++) {
    const side = effectiveSides[i];
    let best = null;
    let bestDist = Infinity;

    // Try all corners of all placed squares as anchor points
    for (const sq of placed) {
      const anchors = [
        [sq.x, sq.y],
        [sq.x + sq.side, sq.y],
        [sq.x, sq.y + sq.side],
        [sq.x + sq.side, sq.y + sq.side],
      ];

      for (const [ax, ay] of anchors) {
        // 4 placements: new square's corner aligned to anchor
        for (const [dx, dy] of [
          [0, 0],
          [-side, 0],
          [0, -side],
          [-side, -side],
        ]) {
          const cand = { x: ax + dx, y: ay + dy, side };
          if (!anyOverlap(cand)) {
            // Squared distance from candidate center to origin
            const cx = cand.x + side / 2;
            const cy = cand.y + side / 2;
            const d = cx * cx + cy * cy;
            if (d < bestDist) {
              bestDist = d;
              best = cand;
            }
          }
        }
      }
    }

    if (best) placed.push(best);
  }

  // Compute extent
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const sq of placed) {
    minX = Math.min(minX, sq.x);
    minY = Math.min(minY, sq.y);
    maxX = Math.max(maxX, sq.x + sq.side);
    maxY = Math.max(maxY, sq.y + sq.side);
  }

  return {
    squares: placed.map((sq) => ({ x: sq.x, y: sq.y, width: sq.side, height: sq.side })),
    extent: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
  };
}
