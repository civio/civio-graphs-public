<script>
  import { vizLang } from '../../states/language.svelte';

  let { texts, chartID } = $props();

  let displayCopyCode = $state(false);
  let statusMessage = $state('');
  let statusTimeout;

  // Centralized status message handler to avoid race conditions
  function setTemporaryStatus(message, duration = 1500) {
    clearTimeout(statusTimeout);
    statusMessage = message;
    statusTimeout = setTimeout(() => {
      statusMessage = '';
    }, duration);
  }

  // Class to handle iframe code loading reactively
  class IframeLoader {
    code = $state('');

    url = $derived(
      `https://graphs.civio.es/${__PROJECT_PATH__}/dist/iframes/${chartID}-${vizLang.value}-responsive.md`
    );

    async load() {
      try {
        const res = await fetch(this.url);
        this.code = await res.text();
      } catch {
        this.code = '';
      }
    }
  }

  const iframeLoader = new IframeLoader();

  // Load when URL changes (language or chartID changes)
  $effect(() => {
    iframeLoader.url; // track dependency
    iframeLoader.load();
  });

  // Modern clipboard API with fallback for older browsers
  async function copyToClipboard(text) {
    // Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Fall through to legacy method
      }
    }

    // Fallback to execCommand for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      return document.execCommand('copy');
    } catch {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }

  async function copyIframeCode() {
    if (!iframeLoader.code) {
      setTemporaryStatus('Loading code...');
      return;
    }

    const copied = await copyToClipboard(iframeLoader.code);

    if (copied) {
      displayCopyCode = true;
      setTemporaryStatus('Code copied to clipboard');
      statusTimeout = setTimeout(() => {
        displayCopyCode = false;
      }, 1500);
    } else {
      setTemporaryStatus('Error copying code', 2000);
    }
  }

  // Custom transition: combines fly and scale
  function flyScale(node, { y = 10, duration = 200, baseScale = 0.8 } = {}) {
    return {
      duration,
      css: (t) => {
        const eased = t;
        const translateY = y * (1 - eased);
        const scale = baseScale + (1 - baseScale) * eased;
        return `
          transform: translateY(${translateY}px) scale(${scale});
          opacity: ${eased};
        `;
      },
    };
  }
</script>

<!-- Live region for screen reader announcements -->
<div role="status" class="sr-only" aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

<ul style="list-style: none;" role="list">
  <li style="background-color: white;">
    <button
      onclick={copyIframeCode}
      class={['copyEmbedCode', displayCopyCode && 'copied']}
      style="z-index: 0"
      aria-label={displayCopyCode ? 'Código copiado' : 'Copiar código para incrustar visualización'}
    >
      {#if displayCopyCode}
        <span
          in:flyScale={{ y: 10, duration: 200, baseScale: 0.8 }}
          out:flyScale={{ y: -10, duration: 200, baseScale: 0.8 }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 640 640"
            aria-hidden="true"
            focusable="false"
            ><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path
              d="M384 64C407.7 64 428.4 76.9 439.4 96L448 96C483.3 96 512 124.7 512 160L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 160C128 124.7 156.7 96 192 96L200.6 96C211.6 76.9 232.3 64 256 64L384 64zM410.9 276.6C400.2 268.8 385.2 271.2 377.4 281.9L291.8 399.6L265.3 372.2C256.1 362.7 240.9 362.4 231.4 371.6C221.9 380.8 221.6 396 230.8 405.5L277.2 453.5C282.1 458.6 289 461.3 296.1 460.8C303.2 460.3 309.7 456.7 313.9 451L416.2 310.1C424 299.4 421.6 284.4 410.9 276.6zM264 128C250.7 128 240 138.7 240 152C240 165.3 250.7 176 264 176L376 176C389.3 176 400 165.3 400 152C400 138.7 389.3 128 376 128L264 128z"
            />
          </svg>
          <span aria-hidden="true">{texts.copiedCode}</span>
        </span>
      {:else}
        <span
          in:flyScale={{ y: 10, duration: 200, baseScale: 0.8 }}
          out:flyScale={{ y: -10, duration: 200, baseScale: 0.8 }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 640 640"
            aria-hidden="true"
            focusable="false"
            ><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path
              d="M352 512L128 512L128 288L176 288L176 224L128 224C92.7 224 64 252.7 64 288L64 512C64 547.3 92.7 576 128 576L352 576C387.3 576 416 547.3 416 512L416 464L352 464L352 512zM288 416L512 416C547.3 416 576 387.3 576 352L576 128C576 92.7 547.3 64 512 64L288 64C252.7 64 224 92.7 224 128L224 352C224 387.3 252.7 416 288 416z"
            />
          </svg>
          <span aria-hidden="true">{texts.embedViz}</span>
        </span>
      {/if}
    </button>
  </li>
</ul>

<style>
  .copyEmbedCode {
    color: var(--bw600);
    font-size: 0.75rem;
    margin: 0;
    height: calc(0.75rem + 12px);
    overflow: hidden;
    box-shadow: 0 0 3px 0 var(--bw800);
    background-color: transparent;
    border: solid 1px var(--bw800);
    border-radius: 5px;
    padding: 2px 5px;
    width: max-content;
    cursor: pointer;

    span {
      display: flex;
      align-items: center;
      fill: var(--bw800);
    }

    svg {
      height: 1lh;
      stroke-width: 1px;
      fill: inherit;
    }
  }

  .copyEmbedCode:focus-visible {
    outline: 2px solid var(--bw800);
    outline-offset: 2px;
  }

  .copyEmbedCode.copied {
    border-color: #13b180;
    background-color: #faffe0;
    box-shadow: 0 0 3px 0 #13b180;

    span {
      fill: #13b180;
      color: #13b180;
    }
  }
</style>
