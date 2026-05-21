<script>
  import { scale } from 'svelte/transition';
  import { texts } from '../states/steps.svelte';

  const { step, scrollThreshold = 0.6, onSelectStep = () => {} } = $props();

  function scrollToSection(i) {
    const el = document.getElementById(`step-${i}`);
    if (!el) return;
    // Match Scrolly's detection band so the resting position lands exactly on
    // the section the IntersectionObserver treats as active.
    const offset = window.innerHeight * scrollThreshold;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  // Report the explicit intent upward before scrolling, so the freeze captures
  // the clicked step regardless of the smooth scroll + observer round-trip.
  function selectStep(i) {
    onSelectStep(i);
    scrollToSection(i);
  }
</script>

<div class="step-container">
  {#each texts as text, i}
    <button
      class={['step-indicator', step === i && 'active']}
      aria-hidden="true"
      tabindex="-1"
      onclick={() => selectStep(i)}
    >
      <p transition:scale={{ duration: 300 }} aria-hidden="true">{text.info}</p>
    </button>
  {/each}
</div>

<style>
  .step-container {
    --max-height: calc(0.85rem + 6px);
    display: flex;
    gap: 5px;
    justify-content: center;
    align-items: center;
    margin-top: 1.5rem;
    height: var(--max-height);
  }

  .step-indicator {
    interpolate-size: allow-keywords;
    display: block;
    position: relative;
    border-radius: 50px;
    background: var(--bw200);
    height: 0.7lh;
    width: 0.7lh;
    overflow: hidden;
    transition: all 0.3s;
    cursor: pointer;

    /* Expand the tap target to ~24×24 without altering the visual size. */
    &::before {
      content: '';
      position: absolute;
      inset: -8px;
    }

    p {
      display: inline-block;
      padding: 0;
      font-size: 0;
      white-space: nowrap;
      transition: all 0.3s;
    }

    &.active {
      background: var(--bw700);
      color: var(--bw100);
      width: fit-content;
      height: var(--max-height);

      p {
        padding: 2px 10px;
        font-size: 0.85rem;
      }
    }
  }

  @media (hover: hover) {
    .step-indicator:hover {
      width: fit-content;
      height: var(--max-height);

      p {
        padding: 2px 10px;
        font-size: 0.85rem;
      }
    }
  }
</style>
