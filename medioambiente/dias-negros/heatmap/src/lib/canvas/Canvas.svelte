<script>
  // from https://github.com/spiegelgraphics/svelte-5-component-templates/blob/main/Canvas.svelte

  /**
   * @component
   * Shared-canvas context provider: children register draw functions via
   * `CanvasLayer` and this component batches them into one rAF redraw.
   *
   * @prop {number} width - The width of the canvas.
   * @prop {number} height - The height of the canvas.
   * @prop {boolean} alpha - Indicates if the canvas should support transparency. Default is true.
   * @prop {boolean} hide - Indicates if the canvas should be hidden. Default is false.
   * @prop {string} contextName - The context name for the canvas. Default is 'civio-canvas'.
   * @prop {import('svelte').Snippet} children - Snippet with the `CanvasLayer` children.
   *
   * @css [--position=relative] - The position of the canvas.
   * @css [--pointer-events=all] - The pointer events of the canvas.
   */

  import { setContext } from 'svelte';

  let {
    width,
    height,
    alpha = true,
    hide = false,
    contextName = 'civio-canvas',
    children,
  } = $props();

  // Set instead of array: O(1) deregister when many features unmount at once
  const drawFunctions = new Set();
  const devicePixelRatio = window.devicePixelRatio || 1;

  let canvas;
  let ctx;
  let frameId;
  let pendingInvalidation = false;

  let isHovered = $state(false);

  function scaleCanvas(canvas, ctx, width, height) {
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.scale(devicePixelRatio, devicePixelRatio);
  }

  function invalidate() {
    if (pendingInvalidation) return;
    pendingInvalidation = true;
    frameId = requestAnimationFrame(update);
  }

  function update() {
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    drawFunctions.forEach((fn) => {
      ctx.save();
      fn(ctx);
      ctx.restore();
    });

    pendingInvalidation = false;
  }

  setContext(contextName, {
    register(fn) {
      drawFunctions.add(fn);
    },
    deregister(fn) {
      drawFunctions.delete(fn);
    },
    invalidate,
  });

  $effect(() => {
    // No willReadFrequently: it forces software (CPU) rendering and we never read pixels back
    ctx = canvas.getContext('2d', { alpha });

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  });

  $effect(() => {
    if (canvas && ctx) scaleCanvas(canvas, ctx, width, height);
  });
</script>

<canvas class:hide class:is-hovered={isHovered} bind:this={canvas}>
  {@render children()}
</canvas>

<style>
  canvas {
    position: var(--position, relative);
    top: 0;
    left: 0;
    pointer-events: var(--pointer-events, all);
  }

  canvas.hide {
    opacity: 0;
  }

  canvas.is-hovered {
    cursor: pointer;
  }
</style>
