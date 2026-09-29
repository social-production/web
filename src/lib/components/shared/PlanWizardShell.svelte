<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  export let open = false;
  export let title = 'Plan wizard';
  export let stepIndex = 0;
  export let stepCount = 1;
  export let nextLabel = 'Next';
  export let canGoBack = true;
  export let canGoNext = true;
  export let showFooter = true;

  const dispatch = createEventDispatcher<{
    close: void;
    dismiss: void;
    back: void;
    next: void;
  }>();

  let compact = false;
  let bodyEl: HTMLDivElement | null = null;

  onMount(() => {
    const media = window.matchMedia('(max-width: 760px)');

    const sync = () => {
      compact = media.matches;
    };

    sync();
    media.addEventListener('change', sync);

    return () => media.removeEventListener('change', sync);
  });

  $: progressPercent = stepCount > 0 ? Math.round(((stepIndex + 1) / stepCount) * 100) : 0;

  $: if (open && bodyEl) {
    // Reset scroll whenever the active step changes so location/search opens at top.
    void stepIndex;
    bodyEl.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }

  export function scrollBodyToTop() {
    bodyEl?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }

  function handleBackdropKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      dispatch('dismiss');
    }
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="wizard-backdrop"
    class:compact
    role="presentation"
    on:click|self={() => dispatch('dismiss')}
    on:keydown={handleBackdropKeydown}
  >
    <div
      class="wizard-shell"
      class:compact
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabindex="-1"
      on:click|stopPropagation
      on:keydown|stopPropagation
    >
      <header class="wizard-header" class:compact>
        <div class="wizard-header-main">
          <span class="wizard-step-number">{stepIndex + 1}/{stepCount}</span>
          <span class="wizard-title">{title}</span>
        </div>
        {#if !compact}
          <button class="cancel-button" type="button" on:click={() => dispatch('close')}>Cancel</button>
        {/if}
        <div class="progress-track" aria-hidden="true">
          <span class="progress-fill" style={`width: ${progressPercent}%`}></span>
        </div>
      </header>

      <div class="wizard-body" bind:this={bodyEl}>
        <slot />
      </div>

      {#if showFooter || compact}
        <footer class="wizard-footer">
          {#if compact}
            <button class="secondary-button" type="button" on:click={() => dispatch('close')}>Cancel</button>
          {/if}
          {#if showFooter && canGoBack}
            <button class="secondary-button" type="button" on:click={() => dispatch('back')}>Back</button>
          {/if}
          {#if showFooter}
            <button class="primary-button" disabled={!canGoNext} type="button" on:click={() => dispatch('next')}>
              {nextLabel}
            </button>
          {/if}
        </footer>
      {/if}
    </div>
  </div>
{/if}

<style>
  .wizard-backdrop {
    position: fixed;
    inset: 0;
    z-index: 90;
    display: grid;
    place-items: center;
    padding: 24px;
    background: color-mix(in srgb, var(--backdrop, #0f172a) 48%, transparent);
    isolation: isolate;
  }

  .wizard-backdrop.compact {
    z-index: 100;
    padding: 0;
    place-items: stretch;
    background: var(--panel);
  }

  .wizard-shell {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    width: min(760px, 100%);
    max-height: min(88dvh, 920px);
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-md);
    background: var(--panel);
    box-shadow: 0 24px 80px color-mix(in srgb, #000 24%, transparent);
    overflow: hidden;
    position: relative;
    z-index: 1;
  }

  .wizard-shell.compact {
    width: 100%;
    max-height: none;
    height: 100dvh;
    border: none;
    border-radius: 0;
    box-shadow: none;
    position: fixed;
    inset: 0;
  }

  .wizard-header {
    display: grid;
    gap: 8px;
    padding: 14px 16px 10px;
    border-bottom: 1px solid var(--panel-border);
    background: color-mix(in srgb, var(--panel-strong) 72%, var(--panel));
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      'title cancel'
      'progress progress';
  }

  .wizard-header.compact {
    padding: 12px 16px 8px;
    gap: 8px;
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      'title'
      'progress';
  }

  .wizard-header-main {
    grid-area: title;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    container-type: inline-size;
  }

  .cancel-button {
    grid-area: cancel;
    align-self: start;
    min-height: 32px;
    padding: 4px 8px;
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-soft);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
  }

  .wizard-header.compact .cancel-button {
    display: none;
  }

  .wizard-step-number {
    flex: 0 0 auto;
    min-width: 2.25rem;
    padding: 2px 6px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--brand-soft) 70%, var(--panel));
    color: var(--brand-strong);
    font-size: 11px;
    font-weight: 800;
    line-height: 1.3;
    text-align: center;
  }

  .wizard-title {
    flex: 1 1 auto;
    min-width: 0;
    font-size: 14px;
    font-weight: 700;
    color: var(--text-main);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .wizard-header.compact .wizard-title {
    font-size: 13px;
  }

  @container (max-width: 180px) {
    .wizard-title {
      display: none;
    }
  }

  .progress-track {
    grid-area: progress;
    height: 4px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--panel-border) 80%, transparent);
    overflow: hidden;
  }

  .progress-fill {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--brand), color-mix(in srgb, var(--brand) 70%, #fff));
    transition: width 0.18s ease;
  }

  .wizard-body {
    overflow-y: auto;
    padding: 16px;
    scroll-padding-top: 8px;
  }

  .wizard-shell.compact .wizard-body {
    padding: 12px;
  }

  @media (min-width: 900px) {
    .wizard-body {
      max-height: min(70dvh, 640px);
    }
  }

  .wizard-footer {
    display: flex;
    align-items: stretch;
    gap: 0;
    padding: 0;
    padding-bottom: env(safe-area-inset-bottom);
    border-top: 1px solid var(--panel-border);
    background: var(--panel);
  }

  .secondary-button,
  .primary-button {
    flex: 1 1 0;
    min-height: 56px;
    margin: 0;
    padding: 8px 12px;
    border: 0;
    border-radius: 0;
    font-size: 16px;
    font-weight: 800;
    cursor: pointer;
  }

  .secondary-button {
    background: var(--panel-strong);
    color: var(--text-main);
    box-shadow: inset -1px 0 0 var(--panel-border);
  }

  .primary-button {
    background: var(--brand);
    color: var(--page-bg);
  }

  .secondary-button:disabled,
  .primary-button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
</style>
