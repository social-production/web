<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let steps: Array<{ id: string; title: string }> = [];
  export let stepIndex = 0;
  export let canContinue = true;
  export let canSubmit = false;
  export let isSubmitting = false;
  export let submitLabel = 'Create';
  export let submittingLabel = 'Creating...';

  const dispatch = createEventDispatcher<{
    submit: void;
    stepchange: { index: number; id: string };
  }>();

  $: safeIndex = Math.max(0, Math.min(stepIndex, Math.max(steps.length - 1, 0)));
  $: isOverview = safeIndex === steps.length - 1;
  $: currentStep = steps[safeIndex] ?? null;

  function goTo(index: number) {
    const next = Math.max(0, Math.min(index, steps.length - 1));
    stepIndex = next;
    const step = steps[next];
    if (step) {
      dispatch('stepchange', { index: next, id: step.id });
    }
  }

  function next() {
    if (safeIndex < steps.length - 1) {
      goTo(safeIndex + 1);
    }
  }

  function back() {
    if (safeIndex > 0) {
      goTo(safeIndex - 1);
    }
  }
</script>

<div class="wizard">
  <nav class="step-rail" aria-label="Create steps">
    {#each steps as step, index}
      <button
        class="step-chip"
        class:active={index === safeIndex}
        class:complete={index < safeIndex}
        type="button"
        on:click={() => goTo(index)}
      >
        <span class="step-index">{index + 1}</span>
        <span class="step-title">{step.title}</span>
      </button>
    {/each}
  </nav>

  <div class="step-body">
    <slot name="step" {safeIndex} {currentStep} {isOverview} />
  </div>

  <div class="wizard-actions">
    <button class="button-ghost" type="button" disabled={safeIndex === 0} on:click={back}>
      Back
    </button>
    {#if isOverview}
      <button
        class="button-primary"
        type="button"
        disabled={!canSubmit || isSubmitting}
        on:click={() => dispatch('submit')}
      >
        {isSubmitting ? submittingLabel : submitLabel}
      </button>
    {:else}
      <button class="button-primary" type="button" disabled={!canContinue} on:click={next}>
        Continue
      </button>
    {/if}
  </div>
</div>

<style>
  .wizard {
    display: grid;
    gap: 14px;
  }

  .step-rail {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .step-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: color-mix(in srgb, var(--panel) 92%, transparent);
    color: var(--text-muted);
    cursor: pointer;
    font: inherit;
  }

  .step-chip.active {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
    font-weight: 700;
  }

  .step-chip.complete {
    color: var(--text-main);
  }

  .step-index {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 999px;
    background: color-mix(in srgb, currentColor 12%, transparent);
    font-size: 11px;
    font-weight: 700;
  }

  .step-title {
    font-size: 12px;
  }

  .step-body {
    min-width: 0;
  }

  .wizard-actions {
    display: flex;
    justify-content: space-between;
    gap: 8px;
  }
</style>
