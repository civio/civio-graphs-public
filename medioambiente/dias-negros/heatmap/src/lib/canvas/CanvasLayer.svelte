<script>
  /**
   * @component
   * CanvasLayer registers a single draw function on a Canvas.svelte component.
   * Use this component as children for Canvas.svelte. One layer painting many
   * marks in a single pass is much cheaper than one component per mark.
   *
   * The layer repaints when the `draw` function identity changes, so build it
   * with `$derived.by` reading every reactive value it paints from.
   *
   * @prop {Function} draw - Receives the 2D context and paints the layer.
   * @prop {string} contextName - The context name for the canvas. Default is 'civio-canvas'.
   */

  import { getContext } from 'svelte';

  let { draw, contextName = 'civio-canvas' } = $props();

  const { register, deregister, invalidate } = getContext(contextName);

  $effect(() => {
    // Capture the current value: props are live getters, so by the time the
    // cleanup runs `draw` already points to the next function and we would
    // deregister the wrong one, leaving the old layer painting forever.
    const currentDraw = draw;
    register(currentDraw);
    invalidate();
    return () => {
      deregister(currentDraw);
      invalidate();
    };
  });
</script>
