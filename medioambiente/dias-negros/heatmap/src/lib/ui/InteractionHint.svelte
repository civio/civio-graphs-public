<script>
  import { isTouchDevice } from '../../states/utils.svelte';
  import TouchIcon from './TouchIcon.svelte';

  /**
   * Pointer-affordance hint: animated touch/cursor icon plus a text that
   * matches the device — `touchText` on touch devices, `mouseText` with a
   * mouse. Shared by the main heatmap and the tooltip's year detail.
   */
  let { touchText, mouseText } = $props();
</script>

<span class="interaction-hint">
  <TouchIcon variant="light" />
  {isTouchDevice.current ? touchText : mouseText}
</span>

<style>
  .interaction-hint {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: 0.75rem;
    color: var(--bw500);
    width: 100%;
  }
</style>
