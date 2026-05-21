<script>
  import { vizLang } from '../../states/language.svelte.js';
  import {
    diagonalGradient,
    subBackground,
    subLabel,
    getCurrentSubs,
    isFullyPermanent,
  } from './colorScale.js';

  const { rows, expandedName, activeSub, onToggle, onSubHover, onLeave } = $props();

  const rowsView = $derived(
    rows.map((row) => {
      const subs = getCurrentSubs(row);
      return { row, subs, gradient: subs.length ? diagonalGradient(subs) : null };
    })
  );

  // Hover handlers ignore touch; sub-enter does fire on touch so the tooltip can pin.
  const skipTouch =
    (handler) =>
    (event, ...args) => {
      if (event.pointerType !== 'touch') handler(event, ...args);
    };
</script>

<div class="wrapper" aria-hidden="true">
  <div class="grid" role="table" aria-label={vizLang.texts.chart.ariaLabel}>
    {#each rowsView as { row, subs, gradient } (row.name)}
      {@const isExpanded = expandedName === row.name}
      <div class={['plazos-grid-row', isExpanded && 'expanded']} data-scope={row.scope}>
        <button
          class={['label', row.scope === 'estatal' && 'estatal']}
          onclick={() => onToggle(row.name)}
          aria-expanded={isExpanded}
        >
          <span class="chevron">▸</span>
          {vizLang.ccaaLabel(row.name)}
        </button>

        {#if subs.length}
          <button
            type="button"
            class="bar band"
            style:background={gradient}
            role="gridcell"
            tabindex="0"
            aria-expanded={isExpanded}
            onclick={() => onToggle(row.name)}
          >
            {#each subs as sub}
              <!-- band hides "Permanente" labels; the per-sub bar shows them when expanded -->
              <span class="bar-value">{isFullyPermanent(sub) ? '' : subLabel(sub)}</span>
            {/each}
          </button>
        {:else}
          <div class="bar band empty">
            <span class="empty-text">{vizLang.texts.chart.noData}</span>
          </div>
        {/if}

        <div class="subs" inert={!isExpanded}>
          {#each subs as sub (sub.label)}
            {@const isActive = activeSub?.label === sub.label && activeSub?.ccaa === row.name}
            <div
              class={['sub-row', isActive && 'active']}
              role="group"
              onpointerenter={(e) => {
                const bar = e.currentTarget.querySelector('.bar');
                onSubHover({ currentTarget: bar ?? e.currentTarget }, sub, sub.label, row.name);
              }}
              onpointerleave={skipTouch(onLeave)}
            >
              <div class="sub-label">
                <span class="sub-text" title={sub.label}>{sub.label}</span>
              </div>
              <div
                class="bar sub"
                style:background={subBackground(sub)}
                role="gridcell"
                tabindex="0"
              >
                <span class="bar-text"
                  >{isFullyPermanent(sub) ? vizLang.texts.legend.permanent : subLabel(sub)}</span
                >
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .wrapper {
    width: 100%;

    .grid {
      display: grid;
      grid-template-columns: 160px 1fr;
      border-bottom: 1px solid color-mix(in srgb, var(--bw400) 12%, transparent);
      transition: border-color 320ms cubic-bezier(0.22, 1, 0.36, 1);

      &:has(.plazos-grid-row:last-child.expanded) {
        border-bottom-color: color-mix(in srgb, var(--bw400) 90%, transparent);
      }

      &:has(.plazos-grid-row.expanded) .plazos-grid-row:not(.expanded) .label {
        opacity: 0.32;
      }

      &:has(.plazos-grid-row.expanded) .plazos-grid-row:not(.expanded) .bar.band {
        opacity: 0.15;
      }
    }

    .plazos-grid-row {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: subgrid;
      grid-template-rows: auto 0fr;
      border-top: 1px solid color-mix(in srgb, var(--bw400) 12%, transparent);
      transition:
        grid-template-rows 320ms cubic-bezier(0.22, 1, 0.36, 1),
        border-color 320ms cubic-bezier(0.22, 1, 0.36, 1);

      &.expanded {
        grid-template-rows: auto 1fr;
      }

      &.expanded,
      &.expanded + .plazos-grid-row {
        border-top-color: color-mix(in srgb, var(--bw400) 90%, transparent);
      }

      &[data-scope='estatal'] + .plazos-grid-row:not([data-scope='estatal']) {
        margin-top: 10px;
      }

      &.expanded {
        .label {
          font-weight: 600;
          color: var(--bw900);
          background: var(--bw100);
        }

        .chevron {
          transform: rotate(90deg);
          color: var(--bw900);
        }

        .bar.band {
          opacity: 1;
          background: var(--bw100) !important;
          margin: 0;
          border-radius: 0;
          height: 22px;
          /*transition: color 0.3s;*/

          & .bar-value {
            color: transparent !important;
            text-shadow: none;
          }
        }

        .subs {
          opacity: 1;
          padding-block: 6px;
        }
      }
    }

    .label {
      grid-column: 1;
      grid-row: 1;
      background: transparent;
      padding: 0 6px;
      min-height: 22px;
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.7rem;
      font-weight: 500;
      color: var(--bw800);
      white-space: nowrap;
      position: sticky;
      left: 0;
      z-index: 2;
      border: none;
      text-align: left;
      font-family: inherit;
      cursor: pointer;
      transition:
        opacity 320ms cubic-bezier(0.22, 1, 0.36, 1),
        background-color 320ms cubic-bezier(0.22, 1, 0.36, 1),
        color 320ms cubic-bezier(0.22, 1, 0.36, 1);

      &.estatal {
        font-weight: 600;
      }
    }

    .chevron {
      font-size: 0.95rem;
      color: var(--bw800);
      flex-shrink: 0;
      display: inline-block;
      margin-bottom: 0.1rem;
      transform: rotate(0deg);
      transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
    }

    .bar {
      border: none;
      padding: 0;
      font: inherit;
      color: inherit;
      border-radius: 3px;
      margin: 1px 4px;
      height: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      transition:
        opacity 320ms cubic-bezier(0.22, 1, 0.36, 1),
        background 320ms cubic-bezier(0.22, 1, 0.36, 1);

      &.band {
        grid-column: 2;
        grid-row: 1;
      }

      &.sub {
        grid-column: 2;
      }

      &.empty {
        background: var(--bw100);
        cursor: default;
      }
    }

    .empty-text {
      font-size: 0.65rem;
      color: var(--bw400);
      padding: 0 8px;
    }

    .bar-value {
      flex: 1;
      text-align: center;
      font-size: 0.55rem;
      font-weight: 600;
      color: white;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
      white-space: nowrap;
      transition: background 320ms cubic-bezier(0.22, 1, 0.36, 1);
      user-select: none;
    }

    .bar-text {
      font-size: 0.6rem;
      font-weight: 600;
      color: white;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      white-space: nowrap;
      user-select: none;
    }

    .subs {
      grid-column: 1 / -1;
      grid-row: 2;
      display: grid;
      grid-template-columns: subgrid;
      grid-auto-rows: auto;
      align-items: center;
      overflow: hidden;
      min-height: 0;
      opacity: 0;
      transition: opacity 320ms cubic-bezier(0.22, 1, 0.36, 1);
    }

    .sub-row {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: subgrid;
      align-items: center;
      cursor: pointer;
      transition: opacity 320ms cubic-bezier(0.22, 1, 0.36, 1);
    }

    .sub-label {
      grid-column: 1;
      background: transparent;
      padding: 0 6px 0 18px;
      min-height: 20px;
      display: flex;
      align-items: center;
      position: sticky;
      left: 0;
      z-index: 2;
    }

    .subs:has(.sub-row.active) .sub-row:not(.active) {
      opacity: 0.35;
    }

    .sub-row.active .bar.sub {
      outline: 2px solid var(--bw800);
      outline-offset: -1px;
      z-index: 10;
    }

    .sub-text {
      font-size: 0.64rem;
      color: var(--bw600);
      line-height: 1.15;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    }

    @media (hover: hover) {
      .label:hover {
        background: var(--bw50);
        color: var(--bw900);
      }

      .grid:not(:has(.plazos-grid-row.expanded)):has(.plazos-grid-row:hover)
        .plazos-grid-row:not(:hover)
        .label {
        opacity: 0.25;
        transition: opacity 320ms cubic-bezier(0.22, 1, 0.36, 1);
      }

      .grid:not(:has(.plazos-grid-row.expanded)):has(.plazos-grid-row:hover)
        .plazos-grid-row:not(:hover)
        .bar.band {
        opacity: 0.3;
        transition: opacity 320ms cubic-bezier(0.22, 1, 0.36, 1);
      }
    }

    @media (max-width: 640px) {
      .grid {
        grid-template-columns: 120px 1fr;
      }

      .label {
        font-size: 0.6rem;
        padding: 0 4px;
      }

      .sub-label {
        padding: 0 4px 0 12px;
      }
    }
  }
</style>
