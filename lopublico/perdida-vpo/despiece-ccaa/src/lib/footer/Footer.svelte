<script>
  import { vizLang } from '../../states/language.svelte';
  import { urlInfo } from '../../states/utils.svelte';
  import logo from '../../assets/civio-dots.svg'; // 2 options: civio.svg (complete) or civio-dots.svg (minimal)
  import fullLogo from '../../assets/civio.svg'; // 2 options: civio.svg (complete) or civio-dots.svg (minimal)
  import { clickOutside } from '../../utils/clickOutside.svelte';
  import ShareContainer from './ShareContainer.svelte';
  import { fly } from 'svelte/transition';

  let { embedID, source = '', note = '' } = $props();

  let investigationLink = __INVESTIGATION_URL__;

  let showShareModal = $state(false);

  // Generate unique IDs using embedID to avoid conflicts when multiple graphs are on the same page
  const shareModalId = $derived(`share-modal-${embedID}`);

  function toggleShareModal() {
    showShareModal = !showShareModal;
  }

  function handleKeydown(event) {
    if (event.key === 'Escape' && showShareModal) {
      showShareModal = false;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<footer class="chart-footer">
  {#if note}
    <p class="chart-note">{vizLang.texts.noteLabel} {note}</p>
  {/if}

  <div class="pie-container">
    <!-- sources and authorship -->
    <div>
      <p>
        {@html source}.

        <!-- Methodology note -->
        {vizLang.texts.methodology}
        <a
          href={urlInfo.isCivio ? '#metodologia' : investigationLink}
          target={urlInfo.isCivio ? '_self' : '_blank'}
          rel={urlInfo.isCivio ? undefined : 'noopener noreferrer'}
        >
          {vizLang.texts.methodologyLink}
        </a>.
      </p>
    </div>

    <!-- Logo and share -->
    <div style="display: flex; gap: .5rem;align-items: center">
      <button
        class="shareModalButton"
        onclick={toggleShareModal}
        style="z-index: 1; anchor-name: --{shareModalId};"
        aria-expanded={showShareModal}
        aria-controls={shareModalId}
        aria-label={showShareModal ? vizLang.texts.closeShare : vizLang.texts.shareButton}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 640 640"
          aria-hidden="true"
          focusable="false"
          ><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path
            d="M384 64C366.3 64 352 78.3 352 96C352 113.7 366.3 128 384 128L466.7 128L265.3 329.4C252.8 341.9 252.8 362.2 265.3 374.7C277.8 387.2 298.1 387.2 310.6 374.7L512 173.3L512 256C512 273.7 526.3 288 544 288C561.7 288 576 273.7 576 256L576 96C576 78.3 561.7 64 544 64L384 64zM144 160C99.8 160 64 195.8 64 240L64 496C64 540.2 99.8 576 144 576L400 576C444.2 576 480 540.2 480 496L480 416C480 398.3 465.7 384 448 384C430.3 384 416 398.3 416 416L416 496C416 504.8 408.8 512 400 512L144 512C135.2 512 128 504.8 128 496L128 240C128 231.2 135.2 224 144 224L224 224C241.7 224 256 209.7 256 192C256 174.3 241.7 160 224 160L144 160z"
          /></svg
        >
      </button>
      {#if showShareModal}
        <div
          id={shareModalId}
          class="shareModal"
          style="position-anchor: --{shareModalId};"
          transition:fly={{ y: 20 }}
          role="dialog"
          aria-label={vizLang.texts.shareButton}
          {@attach clickOutside({
            exclude: '.shareModalButton',
            onClickOutside: () => (showShareModal = false),
          })}
        >
          <ShareContainer texts={vizLang.texts} {embedID} />
        </div>
      {/if}
      <a
        href="https://civio.es"
        target="_blank"
        rel="noopener noreferrer"
        class={['civio-link', urlInfo.isCivio && 'civio-link--embedded']}
        aria-label="Civio{urlInfo.isCivio ? '' : ` ${vizLang.texts.opensInNewWindow}`}"
      >
        <img
          src={urlInfo.isCivio ? logo : fullLogo}
          alt={vizLang.texts.logoAlt}
          class="civio-logo"
        />
      </a>
    </div>
  </div>
</footer>

<style>
  .chart-footer {
    margin: 1.5rem 5px 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .pie-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-direction: column-reverse;
  }

  p {
    color: var(--bw500);
    font-family: Lato, sans-serif;
    font-weight: 400;
    font-size: 0.75rem;
    margin: 0;
    line-height: 1.5;
  }

  @media (width > 550px) {
    .pie-container {
      flex-direction: row;
      gap: 2rem;
    }

    p,
    button {
      font-size: 0.7rem;
    }
  }

  .shareModalButton {
    height: 1.25lh !important;
    aspect-ratio: 1;
    background-color: transparent;
    border-radius: 50px;
    padding: 0.12lh;
    border: none;
    background-color: var(--civio-blue);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    svg {
      fill: white;
      height: 80%;
      width: 80%;
    }
  }

  .shareModal {
    position-area: top center;
    position: absolute;
    position-try-fallbacks: flip-inline;
  }

  .civio-link {
    z-index: 1;
    background-color: white;
    display: inline-block;
    border: none;
  }

  .civio-link--embedded {
    pointer-events: none;
  }

  .civio-logo {
    height: 15px !important;
    vertical-align: baseline;
  }
</style>
