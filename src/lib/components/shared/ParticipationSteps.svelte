<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { getParticipationStepAnchor } from '$lib/utils/participationSteps';
  import { scrollToPageAnchor } from '$lib/utils/scrollAnchors';

  export let steps: { id: string; label: string; done: boolean; helper?: string }[] = [];
  export let currentStepId: string | null = null;
  export let placement: 'inline' | 'lead' = 'inline';

  const dispatch = createEventDispatcher<{ dismiss: void }>();

  let dismissed = false;
  let lastStepSignature = '';

  $: visibleSteps = steps.filter((step) => step.label);
  $: currentStep = visibleSteps.find((step) => step.id === currentStepId) ?? null;
  $: stepSignature = visibleSteps.map((step) => `${step.id}:${step.helper ?? ''}`).join('|');

  $: if (stepSignature !== lastStepSignature) {
    lastStepSignature = stepSignature;
    dismissed = false;
  }

  function scrollToStep(stepId: string) {
    const anchorId = getParticipationStepAnchor(stepId);

    if (!anchorId) {
      return;
    }

    scrollToPageAnchor(anchorId);
  }

  function dismiss() {
    dismissed = true;
    dispatch('dismiss');
  }
</script>

{#if visibleSteps.length > 0 && !dismissed}
  <section class="participation-steps" class:lead={placement === 'lead'} aria-label="Participation steps">
    <div class="steps-toolbar">
      <ol class="step-list">
        {#each visibleSteps as step, index}
          <li class:current={step.id === currentStepId} class="step-item">
            <button class="step-button" type="button" on:click={() => scrollToStep(step.id)}>
              <span class="step-marker">{index + 1}</span>
              <span class="step-label">{step.label}</span>
            </button>
          </li>
        {/each}
      </ol>
      <button
        aria-label="Dismiss participation steps"
        class="dismiss-button"
        type="button"
        on:click={dismiss}
      >
        ×
      </button>
    </div>
    {#if currentStep?.helper}
      <p class="step-helper">{currentStep.helper}</p>
    {/if}
  </section>
{/if}

<style>
  .participation-steps {
    position: sticky;
    top: var(--topbar-height);
    z-index: 2;
    display: grid;
    gap: 8px;
    margin: 0 0 16px;
    padding: 12px 14px;
    border: 1px solid color-mix(in srgb, var(--brand) 42%, var(--panel-border));
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--brand-soft) 58%, var(--panel));
  }

  .participation-steps.lead {
    margin: 0 0 20px;
  }

  .steps-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .dismiss-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-soft);
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
  }

  .dismiss-button:hover {
    color: var(--text-main);
    border-color: color-mix(in srgb, var(--brand) 35%, var(--panel-border));
  }

  .step-list {
    display: flex;
    gap: 8px;
    flex: 1 1 auto;
    flex-wrap: nowrap;
    overflow-x: auto;
    min-width: 0;
    margin: 0;
    padding: 0;
    list-style: none;
    scrollbar-width: none;
  }

  .step-list::-webkit-scrollbar {
    display: none;
  }

  .step-item {
    min-width: 0;
    flex: 0 0 auto;
  }

  .step-button {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    min-height: 32px;
    padding: 6px 10px;
    border: 1px solid color-mix(in srgb, var(--brand) 16%, var(--panel-border));
    border-radius: 999px;
    background: color-mix(in srgb, var(--panel) 82%, var(--panel-strong));
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
  }

  .step-button:hover {
    border-color: color-mix(in srgb, var(--brand) 45%, var(--panel-border));
    color: var(--text-main);
  }

  .step-item.current .step-button {
    border-color: color-mix(in srgb, var(--brand) 55%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 50%, var(--panel));
    color: var(--text-main);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--brand) 20%, transparent);
  }

  .step-marker {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--panel-border) 70%, transparent);
    font-size: 11px;
  }

  .step-helper {
    margin: 0;
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.45;
  }
</style>
