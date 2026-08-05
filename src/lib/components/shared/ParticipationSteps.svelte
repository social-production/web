<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount, tick } from 'svelte';
  import { page } from '$app/stores';
  import {
    activateParticipationActivityPhase,
    focusActivitySignupTargets,
    focusHistoryFollowUpTargets,
    getParticipationStepActionTarget,
    getParticipationStepAnchor
  } from '$lib/utils/participationSteps';
  import { focusParticipationActionTarget, focusPhaseHelpThenAction, highlightParticipationTarget } from '$lib/utils/participationHighlight';
  import { scrollToPageAnchor } from '$lib/utils/scrollAnchors';
  import { requireViewer } from '$lib/utils/requireViewer';
  import type { PendingVoteItem } from '$lib/utils/pendingVotes';
  import type { EventPageData, ProjectPageData } from '$lib/types/detail';

  export let steps: { id: string; label: string; done: boolean; helper?: string }[] = [];
  export let currentStepId: string | null = null;
  export let placement: 'inline' | 'lead' = 'inline';
  export let pendingVotes: PendingVoteItem[] = [];
  export let pageData: ProjectPageData | EventPageData | null = null;

  const dispatch = createEventDispatcher<{ dismiss: void; stepAction: { stepId: string } }>();

  const plusActionSteps = new Set([
    'rate',
    'plan',
    'propose-activity',
    'make-pull-request',
    'propose-advance'
  ]);
  const phaseHelpFirstSteps = new Set(['rate', 'plan', 'propose-activity', 'make-pull-request']);
  const authGatedSteps = new Set([
    'signal',
    'join',
    'rate',
    'plan',
    'propose-activity',
    'make-pull-request',
    'activity',
    'history-follow-up',
    'vote',
    'assess-plans'
  ]);

  let dismissed = false;
  let lastStepSignature = '';
  let selectedStepId: string | null = null;
  let hasManualSelection = false;
  let stepListEl: HTMLOListElement | null = null;
  let compactLabels = false;
  let resizeObserver: ResizeObserver | null = null;
  let measureQueued = false;

  $: visibleSteps = steps.filter((step) => step.label);
  $: stepSignature = visibleSteps.map((step) => `${step.id}:${step.helper ?? ''}`).join('|');
  $: visibleStepIds = new Set(visibleSteps.map((step) => step.id));

  $: if (stepSignature !== lastStepSignature) {
    lastStepSignature = stepSignature;
    dismissed = false;
  }

  // Follow the auto-resolved current step until the user clicks a different one.
  $: if (!hasManualSelection) {
    selectedStepId = currentStepId;
  }

  // If the manually selected step disappears, fall back to the auto-resolved step.
  $: if (selectedStepId && !visibleStepIds.has(selectedStepId)) {
    hasManualSelection = false;
    selectedStepId = currentStepId && visibleStepIds.has(currentStepId) ? currentStepId : null;
  }

  $: currentStep =
    visibleSteps.find((step) => step.id === selectedStepId) ??
    visibleSteps.find((step) => step.id === currentStepId) ??
    null;

  $: if (stepListEl && visibleSteps.length > 0) {
    queueCompactLabelMeasure();
  }

  function queueCompactLabelMeasure() {
    if (measureQueued || typeof window === 'undefined') return;
    measureQueued = true;
    void tick().then(() => {
      measureQueued = false;
      void updateCompactLabels();
    });
  }

  async function updateCompactLabels() {
    if (!stepListEl) return;

    // Measure with full labels first so we can restore them when space returns.
    if (compactLabels) {
      compactLabels = false;
      await tick();
      if (!stepListEl) return;
    }

    const overflow = stepListEl.scrollWidth - stepListEl.clientWidth;
    // Require meaningful overflow before collapsing so labels stay readable longer.
    compactLabels = overflow > 12;
  }

  function activateStep(stepId: string) {
    if (authGatedSteps.has(stepId) && !requireViewer($page.data.bootstrap?.viewer)) {
      return;
    }

    selectedStepId = stepId;
    hasManualSelection = true;

    if (stepId === 'activity' && pageData) {
      focusActivitySignupTargets(pageData);
      dispatch('stepAction', { stepId });
      return;
    }

    if (stepId === 'history-follow-up' && pageData) {
      focusHistoryFollowUpTargets(pageData);
      dispatch('stepAction', { stepId });
      return;
    }

    const anchorId = getParticipationStepAnchor(stepId);
    const actionTarget = getParticipationStepActionTarget(stepId, pendingVotes, pageData);

    if (phaseHelpFirstSteps.has(stepId) && actionTarget) {
      focusPhaseHelpThenAction(actionTarget);
      dispatch('stepAction', { stepId });
      return;
    }

    if (plusActionSteps.has(stepId) && actionTarget) {
      focusParticipationActionTarget(actionTarget);
      dispatch('stepAction', { stepId });
      return;
    }

    const isHeaderAction = stepId === 'signal' || stepId === 'join';

    if (isHeaderAction && actionTarget) {
      highlightParticipationTarget(actionTarget);
    }

    if (anchorId === 'participation-activities') {
      activateParticipationActivityPhase();
    }

    if (anchorId) {
      window.setTimeout(
        () => {
          scrollToPageAnchor(anchorId);
        },
        anchorId === 'participation-activities' ? 120 : 0
      );
    }

    window.setTimeout(() => {
      highlightParticipationTarget(actionTarget);
    }, isHeaderAction ? 700 : anchorId === 'participation-activities' ? 620 : 450);

    dispatch('stepAction', { stepId });
  }

  function dismiss() {
    dismissed = true;
    dispatch('dismiss');
  }

  onMount(() => {
    if (!stepListEl || typeof ResizeObserver === 'undefined') {
      void updateCompactLabels();
      return;
    }

    resizeObserver = new ResizeObserver(() => {
      queueCompactLabelMeasure();
    });
    resizeObserver.observe(stepListEl);
    void updateCompactLabels();
  });

  onDestroy(() => {
    resizeObserver?.disconnect();
    resizeObserver = null;
  });
</script>

{#if visibleSteps.length > 0 && !dismissed}
  <section class="participation-steps" class:lead={placement === 'lead'} aria-label="Participation steps">
    <div class="steps-toolbar">
      <ol class="step-list" class:compact-labels={compactLabels} bind:this={stepListEl}>
        {#each visibleSteps as step, index}
          <li class:current={step.id === (selectedStepId ?? currentStepId)} class="step-item">
            <button
              class="step-button"
              type="button"
              aria-label={`Step ${index + 1}: ${step.label}`}
              on:click={() => activateStep(step.id)}
            >
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
    top: calc(var(--topbar-height) + 8px);
    z-index: 3;
    align-self: start;
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
    gap: 6px;
    flex: 1 1 auto;
    flex-wrap: nowrap;
    overflow-x: hidden;
    min-width: 0;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .step-item {
    min-width: 0;
    flex: 0 0 auto;
  }

  .step-button {
    display: inline-flex;
    gap: 5px;
    align-items: center;
    min-height: 32px;
    padding: 5px 9px;
    border: 1px solid color-mix(in srgb, var(--brand) 16%, var(--panel-border));
    border-radius: 999px;
    background: color-mix(in srgb, var(--panel) 82%, var(--panel-strong));
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
  }

  .step-list.compact-labels .step-button {
    gap: 0;
    padding: 6px 8px;
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

  .step-label {
    min-width: 0;
  }

  .step-list.compact-labels .step-label {
    display: none;
  }

  .step-helper {
    margin: 0;
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.45;
  }

  @media (max-width: 420px) {
    .step-list:not(.compact-labels) .step-button {
      padding: 5px 7px;
      font-size: 11px;
      gap: 4px;
    }
  }
</style>
