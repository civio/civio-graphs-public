<script>
  import { isTouchDevice } from '../states/utils.svelte.js';

  /** @type {'primary' | 'light'} */
  let { variant = 'primary' } = $props();
</script>

{#if isTouchDevice.current}
  <svg
    class="mode-icon mode-touch {variant}"
    viewBox="0 0 20 20"
    aria-hidden="true"
    focusable="false"
  >
    <circle class="click-ripple" cx="10" cy="10" r="3" />
    <path
      class="cursor"
      d="M8.6 3.2 C8.6 2.4 9.2 1.8 10 1.8 C10.8 1.8 11.4 2.4 11.4 3.2 L11.4 8.4 C11.7 8.1 12.1 8 12.5 8 C13.2 8 13.8 8.4 14 9 C14.3 8.7 14.7 8.5 15.2 8.5 C16.1 8.5 16.8 9.2 16.9 10 C17.2 9.7 17.6 9.6 18 9.6 C18.9 9.6 19.6 10.3 19.6 11.2 L19.6 13 C19.6 15.5 17.6 17.5 15.1 17.5 L13 17.5 C11.1 17.5 9.3 16.5 8.2 14.9 L6.5 12.6 C6.1 12 6.2 11.2 6.8 10.8 C7.4 10.4 8.2 10.5 8.6 11.1 L8.6 3.2 Z"
    />
  </svg>
{:else}
  <svg
    class="mode-icon mode-manual {variant}"
    viewBox="0 0 20 20"
    aria-hidden="true"
    focusable="false"
  >
    <circle class="click-ripple" cx="13.5" cy="13.5" r="3" />
    <path class="cursor" d="M4 3 L4 15 L7.2 11.8 L9.3 16 L11.3 15 L9.1 10.8 L13.5 10.8 Z" />
  </svg>
{/if}

<style>
  .mode-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    color: var(--primary);
    overflow: visible;
    position: relative;
    bottom: 2px;

    &.mode-manual {
      margin-right: -3px;
    }
  }

  .mode-icon .cursor {
    fill: var(--primary, #007bff);
    stroke: #fff;
    stroke-width: 0.6;
    stroke-linejoin: round;
  }

  .mode-icon .click-ripple {
    fill: none;
    stroke: var(--primary, #007bff);
    stroke-width: 1.2;
  }

  .mode-icon.light .cursor {
    fill: var(--bw300, #999);
  }

  .mode-icon.light .click-ripple {
    stroke: var(--bw300, #999);
  }

  .mode-manual .cursor {
    transform-origin: 4px 3px;
    animation: manual-tap 2s ease-in-out infinite;
  }

  .mode-manual .click-ripple {
    transform-origin: 13.5px 13.5px;
    animation: manual-ripple 2s ease-out infinite;
  }

  .mode-touch .cursor {
    transform-origin: 10px 10px;
    animation: touch-tap 2s ease-in-out infinite;
  }

  .mode-touch .click-ripple {
    transform-origin: 10px 10px;
    animation: touch-ripple 2s ease-out infinite;
  }

  @keyframes manual-tap {
    0%,
    100% {
      transform: translate(0, 0);
    }
    45%,
    55% {
      transform: translate(1.2px, 1.2px);
    }
  }

  @keyframes manual-ripple {
    0%,
    40% {
      transform: scale(0.2);
      opacity: 0;
    }
    55% {
      transform: scale(0.4);
      opacity: 0.8;
    }
    100% {
      transform: scale(1.4);
      opacity: 0;
    }
  }

  @keyframes touch-tap {
    0%,
    100% {
      transform: scale(1);
    }
    45%,
    55% {
      transform: scale(0.92);
    }
  }

  @keyframes touch-ripple {
    0%,
    40% {
      transform: scale(0.2);
      opacity: 0;
    }
    55% {
      transform: scale(0.6);
      opacity: 0.8;
    }
    100% {
      transform: scale(1.8);
      opacity: 0;
    }
  }
</style>
