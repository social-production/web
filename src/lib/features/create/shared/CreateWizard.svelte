<script lang="ts">
  import { createEventDispatcher, getContext, onDestroy } from 'svelte';
  import {
    CREATE_SHEET_CHROME,
    CREATE_SHEET_CLOSE,
    CREATE_SHEET_FOOTER,
    type CreateSheetChromeStore,
    type CreateSheetFooterStore
  } from './createSheetContext';

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

  const footer = getContext<CreateSheetFooterStore | undefined>(CREATE_SHEET_FOOTER);
  const chrome = getContext<CreateSheetChromeStore | undefined>(CREATE_SHEET_CHROME);
  const closeSheet = getContext<(() => void) | undefined>(CREATE_SHEET_CLOSE);

  $: safeIndex = Math.max(0, Math.min(stepIndex, Math.max(steps.length - 1, 0)));
  $: isOverview = safeIndex === steps.length - 1;
  $: currentStep = steps[safeIndex] ?? null;

  function goTo(index: number) {
    const nextIndex = Math.max(0, Math.min(index, steps.length - 1));
    stepIndex = nextIndex;
    const step = steps[nextIndex];
    if (step) {
      dispatch('stepchange', { index: nextIndex, id: step.id });
    }
    if (typeof document !== 'undefined') {
      document.querySelector('.overlay-sheet .overlay-body')?.scrollTo({ top: 0 });
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

  $: footer?.set({
    leftLabel: safeIndex === 0 ? 'Cancel' : 'Back',
    rightLabel: isOverview ? (isSubmitting ? submittingLabel : submitLabel) : 'Continue',
    rightDisabled: isOverview ? !canSubmit || isSubmitting : !canContinue,
    onLeft: () => {
      if (safeIndex === 0) {
        closeSheet?.();
        return;
      }
      back();
    },
    onRight: () => {
      if (isOverview) {
        dispatch('submit');
        return;
      }
      next();
    }
  });

  $: chrome?.set({
    steps,
    stepIndex: safeIndex,
    goTo
  });

  onDestroy(() => {
    footer?.set(null);
    chrome?.set(null);
  });
</script>

<div class="wizard">
  <div class="step-body">
    <slot name="step" {safeIndex} {currentStep} {isOverview} />
  </div>
</div>

<style>
  .wizard,
  .step-body {
    min-width: 0;
  }
</style>
