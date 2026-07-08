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

  export function scrollBodyToTop() {
    bodyEl?.scrollTo({ top: 0, behavior: 'instant' });
  }

  function handleBackdropKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      dispatch('close');
    }
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="wizard-backdrop"
    class:compact
    role="presentation"
    on:click|self={() => dispatch('close')}
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
          <span class="wizard-title">{title}</span>
          {#if !compact}
            <span class="wizard-step-label">Step {stepIndex + 1} of {stepCount}</span>
          {/if}
        </div>
        <button class="cancel-button" type="button" on:click={() => dispatch('close')}>Cancel</button>
        <div class="progress-track" aria-hidden="true">
          <span class="progress-fill" style={`width: ${progressPercent}%`}></span>
        </div>
        {#if !compact}
          <span class="wizard-step-label">Step {stepIndex + 1} of {stepCount}</span>
        {/if}
      </header>

      <div class="wizard-body" bind:this={bodyEl}>
        <slot />
      </div>

      {#if showFooter}
        <footer class="wizard-footer" class:compact>
          {#if canGoBack}
            <button class="secondary-button" type="button" on:click={() => dispatch('back')}>Back</button>
          {:else}
            <span class="footer-spacer"></span>
          {/if}
          <button class="primary-button" disabled={!canGoNext} type="button" on:click={() => dispatch('next')}>
            {nextLabel}
          </button>
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
      'progress progress'
      'step step';
  }

  .wizard-header.compact {
    padding: 6px 10px 4px;
    gap: 4px;
    grid-template-areas:
      'title cancel'
      'progress progress';
  }

  .wizard-header-main {
    grid-area: title;
    display: grid;
    gap: 2px;
    min-width: 0;
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
    min-height: 28px;
    font-size: 12px;
  }

  .wizard-title {
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

  .wizard-step-label {
    font-size: 11px;
    color: var(--text-soft);
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
  }

  .wizard-shell.compact .wizard-body {
    padding: 12px;
  }

  .wizard-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
    border-top: 1px solid var(--panel-border);
    background: var(--panel);
  }

  .wizard-footer.compact {
    padding: 6px 10px calc(6px + env(safe-area-inset-bottom));
  }

  .footer-spacer {
    flex: 1;
  }

  .secondary-button,
  .primary-button {
    min-height: 40px;
    padding: 8px 14px;
    border-radius: var(--radius-sm);
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }

  .wizard-footer.compact .secondary-button,
  .wizard-footer.compact .primary-button {
    min-height: 36px;
    padding: 6px 12px;
    font-size: 13px;
  }

  .secondary-button {
    border: 1px solid var(--panel-border);
    background: var(--panel-strong);
    color: var(--text-main);
  }

  .primary-button {
    border: 1px solid color-mix(in srgb, var(--brand) 55%, var(--panel-border));
    background: var(--brand);
    color: var(--brand-contrast, #fff);
  }

  .secondary-button:disabled,
  .primary-button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
</style>
