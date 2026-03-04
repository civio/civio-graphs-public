<script>
  import { data } from '../states/data.svelte';
  import { isMobile } from '../states/utils.svelte';
  import { vizLang } from '../states/language.svelte';
  import { fly } from 'svelte/transition';
  import ScreenReaderDescription from './ScreenReaderDescription.svelte';
  import { getMainChartA11y } from '../a11y/mainChart';

  // --- Layout constants ---
  const COLS = Math.ceil(Math.sqrt(7800));
  const TEXT_H = 48; // space for text above grid (mobile)
  const GROUP_GAP = 20;
  let ANNOTATION_GAP = $derived(isMobile.current ? 60 : 20); // extra space after 1st group for annotation
  const TEXT_AREA_MIN = 200; // min width for text column (desktop)
  const GRID_MAX = 400; // max width for waffle grid (desktop)
  const TRANSITION_MS = 500;

  const COLORS = ['#bbbbbb', '#AF96DA', '#875CC3', '#5E398D', '#170A27'];

  const groupLabels = vizLang.texts.groupLabels;

  // --- Group data ---
  const countsFull = data.map((d) => d[1].count);
  const collapsedCount = countsFull.slice(1).reduce((a, b) => a + b, 0);
  const countsMin = [countsFull[0], collapsedCount];

  const meta1Offsets = [0];
  let acc = 0;
  for (let g = 1; g < data.length; g++) {
    meta1Offsets[g] = acc;
    acc += data[g][1].count;
  }

  // Labels
  function fmtPerc(p) {
    return p < 1 ? vizLang.formatDecimals(p) : vizLang.formatIntegers(p);
  }

  const collapsedPerc = data.slice(1).reduce((a, d) => a + d[1].perc, 0);

  const labels = [
    {
      type: 'always',
      title: '15 días o menos',
      detail: `${vizLang.formatIntegers(countsMin[0])} aislamientos <div class="square" style="background-color:#bbbbbb"></div> (${fmtPerc(data[0][1].perc)}%)`,
      groupIndex2: 0,
    },
    {
      type: 'collapsed',
      title: 'Más de 15 días',
      detail: `${vizLang.formatIntegers(countsMin[1])} aislamientos <div class="square" style="background-color:#875CC3"></div> (${fmtPerc(collapsedPerc)}%)`,
      groupIndex2: 1,
    },
    ...data.slice(1).map((d, i) => ({
      type: 'expanded',
      title: groupLabels[d[0]],
      detail: `${vizLang.formatIntegers(d[1].count)} aislamientos <div class="square" style="background-color:${COLORS[i + 1]}"></div> (${fmtPerc(d[1].perc)}%)`,
      groupIndex6: i + 1,
    })),
  ];

  // --- Color helpers ---
  function lighten(hex, amount = 0.3) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.round(r + (255 - r) * amount)},${Math.round(g + (255 - g) * amount)},${Math.round(b + (255 - b) * amount)})`;
  }

  const STROKES = COLORS.map((c) => lighten(c, 0.25));

  // --- Layout computation ---
  // Returns { totalHeight, groups[], annotationY }
  // annotationY = top of the extra gap after the 1st group (for placing an annotation)
  function computeLayout(counts, step, mobile, textBlockH) {
    let y = 0;
    let annotationY = 0;
    const groups = [];
    for (let i = 0; i < counts.length; i++) {
      const gridRows = Math.ceil(counts[i] / COLS);
      const gridH = gridRows * step;

      if (mobile) {
        groups.push({ textY: y, gridY: y + TEXT_H });
        y += TEXT_H + gridH + GROUP_GAP;
      } else {
        const rowH = Math.max(gridH, textBlockH);
        const textY = y + rowH / 2 - textBlockH / 2;
        const gridY = y + rowH / 2 - gridH / 2;
        groups.push({ textY, gridY });
        y += rowH + GROUP_GAP;
      }

      // After the 1st group, record annotation position and add extra space
      if (i === 0) {
        annotationY = y - GROUP_GAP; // right after the grid ends
        y += ANNOTATION_GAP;
      }
    }
    return { totalHeight: y - GROUP_GAP, groups, annotationY };
  }

  // --- Props ---
  let { expanded = false, visible = false } = $props();

  // --- Accessibility ---
  let a11yData = $derived(getMainChartA11y(vizLang, data));

  // --- State ---
  let containerWidth = $state(300);
  let canvasEl = $state(null);
  let animT = $state(1);
  let animFrameId = 0;
  let textBlockH = $state(40); // measured from DOM

  // --- Derived layout (shared between canvas + HTML labels) ---
  let mobile = $derived(isMobile.current);
  let gridWidth = $derived(
    mobile ? containerWidth : Math.min(GRID_MAX, containerWidth - TEXT_AREA_MIN)
  );
  let gridOffsetX = $derived(mobile ? 0 : containerWidth - gridWidth);
  let textMaxW = $derived(mobile ? containerWidth : gridOffsetX - 16);
  let step = $derived(gridWidth / COLS);

  let layout2 = $derived(computeLayout(countsMin, step, mobile, textBlockH));
  let layout6 = $derived(computeLayout(countsFull, step, mobile, textBlockH));

  // t: 0 = 2-group, 1 = 6-group
  let t = $derived(expanded ? animT : 1 - animT);
  let totalH = $derived(layout2.totalHeight + (layout6.totalHeight - layout2.totalHeight) * t);

  // Interpolated annotation Y position (between the two layouts)
  let annotationY = $derived(layout2.annotationY + (layout6.annotationY - layout2.annotationY) * t);

  // --- Label position helper ---
  function labelTop(label) {
    if (label.type === 'expanded') return layout6.groups[label.groupIndex6].textY;
    return layout2.groups[label.groupIndex2].textY;
  }

  // --- Main draw (canvas: only squares) ---
  function draw() {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const sz = step;

    canvasEl.width = containerWidth * dpr;
    canvasEl.height = totalH * dpr;
    canvasEl.style.width = `${containerWidth}px`;
    canvasEl.style.height = `${totalH}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, containerWidth, totalH);

    ctx.lineWidth = 1;
    for (let g = 0; g < data.length; g++) {
      const count = data[g][1].count;
      const metaGroup = g === 0 ? 0 : 1;
      const localStart2 = g === 0 ? 0 : meta1Offsets[g];

      const gridY6 = layout6.groups[g].gridY;
      const gridY2 = layout2.groups[metaGroup].gridY;

      ctx.fillStyle = COLORS[g];
      ctx.strokeStyle = STROKES[g];

      for (let j = 0; j < count; j++) {
        const x6 = (j % COLS) * step;
        const y6 = gridY6 + Math.floor(j / COLS) * step;

        const idx2 = localStart2 + j;
        const x2 = (idx2 % COLS) * step;
        const y2 = gridY2 + Math.floor(idx2 / COLS) * step;

        const px = gridOffsetX + x2 + (x6 - x2) * t;
        const py = y2 + (y6 - y2) * t;
        ctx.fillRect(px, py, sz, sz);
        ctx.strokeRect(px, py, sz, sz);
      }
    }
  }

  // --- Redraw on mount, resize, and reactive changes ---
  $effect(() => {
    containerWidth;
    canvasEl;
    step;
    gridOffsetX;
    totalH;
    if (canvasEl) draw();
  });

  // --- Animation ---
  function startTransition() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animT = 0;
    const start = performance.now();

    function tick(now) {
      const raw = Math.min(1, (now - start) / TRANSITION_MS);
      animT = 1 - (1 - raw) * (1 - raw);
      draw();
      if (raw < 1) {
        animFrameId = requestAnimationFrame(tick);
      } else {
        animFrameId = 0;
      }
    }
    animFrameId = requestAnimationFrame(tick);
  }

  // Animate when expanded prop changes (skip initial run)
  let mounted = false;
  $effect(() => {
    expanded; // track the prop
    if (mounted) startTransition();
    mounted = true;
  });
</script>

<ScreenReaderDescription
  description={a11yData.description}
  title={a11yData.title}
  columns={a11yData.columns}
  items={a11yData.items}
  {visible}
/>

<div class="chart-container" bind:clientWidth={containerWidth} aria-hidden="true">
  <div class="chart-wrapper" style:height="{totalH}px">
    <!-- Squares -->
    <canvas bind:this={canvasEl} style="display: block;"></canvas>

    <!-- Annotation between 1st and 2nd group -->
    <div
      class="annotation"
      style="position: absolute"
      style:top="{annotationY}px"
      style:height="{ANNOTATION_GAP + GROUP_GAP}px"
    >
      <p>15 días es el máximo recomendado por la ONU</p>
      <svg style="width:{containerWidth}px" aria-hidden="true">
        <line
          x1="0"
          x2={containerWidth}
          y1="0"
          y2="0"
          stroke="var(--bw300)"
          stroke-width="3"
          stroke-dasharray="16"
        />
      </svg>
    </div>

    <!-- Text labels -->
    {#each labels as label (label.title)}
      {@const visible =
        label.type === 'always' || (label.type === 'collapsed' ? !expanded : expanded)}
      {#if visible}
        <div
          class="label"
          bind:clientHeight={textBlockH}
          transition:fly={{ y: labelTop(labels[1]) - labelTop(label), duration: TRANSITION_MS }}
          style:top="{labelTop(label)}px"
          style:max-width="{textMaxW}px"
          style={isMobile.current
            ? 'text-align:left;left:0'
            : `text-align:right;left:${containerWidth - GRID_MAX - GROUP_GAP}px; transform:translate(-100%)`}
        >
          {label.title}<br />
          <strong>{@html label.detail}</strong>
        </div>
      {/if}
    {/each}
  </div>
</div>

<style>
  .chart-container {
    max-width: 800px;
    margin: 1.5rem auto;
    position: relative;
  }

  .chart-wrapper {
    position: relative;
  }

  canvas {
    position: absolute;
    top: 0;
    left: 0;
  }

  .label {
    position: absolute;
    font-size: 1rem;
    line-height: 1.4;

    :global .square {
      height: 0.7lh;
      width: 0.7lh;
      display: inline-block;
      position: relative;
      top: 0.1lh;
    }
  }

  .annotation {
    width: 100%;
    display: flex;
    align-items: center;
    position: relative;
    justify-content: center;
    color: var(--bw500);
    fill: var(--bw500);

    p {
      max-width: 200px;
      margin: 0;
      text-align: center;
      background: white;
      z-index: 1;
      padding: 0 5px;
      font-size: 0.9rem;
    }

    svg {
      height: 2px;
      position: absolute;
      left: 0;
      top: 50%;
    }
  }

  @media (width > 550px) {
    .annotation {
      justify-content: left;

      p {
        text-align: right;
        padding: 0 15px 0 0;
      }
    }
  }
</style>
