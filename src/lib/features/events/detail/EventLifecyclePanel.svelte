<script lang="ts">
  import { browser } from '$app/environment';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import { tick } from 'svelte';
  import EventLifecycleMechanicsCard from './components/EventLifecycleMechanicsCard.svelte';
  import EventLifecyclePhaseTabs from './components/EventLifecyclePhaseTabs.svelte';
  import EventPhaseChangeSection from './components/EventPhaseChangeSection.svelte';
  import EventLifecycleContent from './lifecycle/EventLifecycleContent.svelte';
  import {
    createEventActivityForm,
    createEventPlanForm,
    eventPlanDefaultActivityWindow,
    eventPlanDefaultLocationLabel,
    eventPlanScheduleFromForm,
    eventPlanScheduledDayIsos,
    eventPlanSuggestedDayIso,
    importanceOptions,
    minimumParticipantsFromRoles,
    type EventActivityForm,
    type EventLifecycleTabItem,
    type EventPlanForm
  } from './lifecycle/eventLifecycleShared';
  import {
    eventActivityFitsSchedule,
    eventScheduleBounds,
    eventScheduleIsValid,
    eventScheduleStartsInFuture
  } from '$lib/utils/eventSchedule';
  import {
    addEventActivity,
    addEventPlan,
    addEventValue,
    requestEventPhaseChange,
    setEventActivityCommitment,
    setEventPhaseChangeVote,
    setEventPlanOverallVote,
    setEventPlanValueVote,
    setEventValueImportance
  } from '$lib/services/queries/details';
  import type {
    EventLifecyclePhase,
    EventLifecyclePhaseId,
    EventPageData,
    ProjectApprovalVote,
    ProjectImportanceVoteValue
  } from '$lib/types/detail';

  export let data: EventPageData;
  export let autoExpandVoteCards = false;
  export let autoExpandVoteKind: string | null = null;
  export let autoExpandVoteTarget: string | null = null;

  function currentWinningPlan() {
    return data.lifecycle.phaseTwo.plans.find((plan) => plan.id === data.lifecycle.phaseTwo.winningPlanId) ?? null;
  }

  function defaultActivityDayIso(isoDay = '') {
    return isoDay || eventPlanSuggestedDayIso(currentWinningPlan());
  }

  function createDefaultActivityForm(isoDay = '') {
    const winningPlan = currentWinningPlan();
    const defaultDayIso = defaultActivityDayIso(isoDay);
    const baseForm = createEventActivityForm(
      eventPlanDefaultLocationLabel(winningPlan) || data.locationLabel,
      data.lifecycle.activity.selectablePlanPhases[0]?.id ?? null
    );
    const defaultWindow = eventPlanDefaultActivityWindow(winningPlan, defaultDayIso);

    return defaultDayIso
      ? {
          ...baseForm,
          scheduledAt: defaultWindow.scheduledAt,
          endsAt: defaultWindow.endsAt
        }
      : baseForm;
  }

  let activePhaseId: EventLifecyclePhaseId = data.lifecycle.currentPhaseId;
  let lastCurrentPhaseId = data.lifecycle.currentPhaseId;
  let showHowItWorks = false;
  let lastHowItWorksPhaseId = data.lifecycle.currentPhaseId;
  let showValueComposer = false;
  let showPlanComposer = false;
  let showActivityComposer = false;
  let draftValue = '';
  let phaseChangeReason = '';
  let selectedDayIso = '';
  let highlightedActivityId: string | null = null;
  let planForm: EventPlanForm = createEventPlanForm();
  let activityForm: EventActivityForm = createDefaultActivityForm();
  let activityHighlightResetHandle: ReturnType<typeof setTimeout> | null = null;
  let lastActivityTargetId: string | null = null;
  let lastVoteTargetSignature = '';

  function readActivityTarget(url: URL): string | null {
    if (url.hash.startsWith('#event-activity-')) {
      return url.hash.slice('#event-activity-'.length) || null;
    }
    return url.searchParams.get('activity');
  }

  function scrollActivityCardIntoView(activityId: string) {
    if (!browser) return;
    document.getElementById(`event-activity-${activityId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function openActivityDetails(activityId: string) {
    if (!browser) return;
    const details = document.getElementById(`activity-${activityId}`);
    if (details instanceof HTMLDetailsElement) {
      details.open = true;
    }
  }

  async function focusActivityCard(activityId: string) {
    if (activityHighlightResetHandle) {
      clearTimeout(activityHighlightResetHandle);
    }
    highlightedActivityId = activityId;
    await tick();
    openActivityDetails(activityId);
    scrollActivityCardIntoView(activityId);

    if (browser) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          openActivityDetails(activityId);
          scrollActivityCardIntoView(activityId);
        });
      });
    }

    activityHighlightResetHandle = setTimeout(() => {
      if (highlightedActivityId === activityId) {
        highlightedActivityId = null;
      }
      activityHighlightResetHandle = null;
    }, 1800);
  }

  function phaseChangeVoteGroup(requestId: string): 'return' | 'advance' | 'close' | null {
    return data.lifecycle.phaseChangeRequests.find((request) => request.id === requestId)?.kind ?? null;
  }

  function scrollVoteCardIntoView(voteKind: string, voteTarget: string) {
    if (!browser) return;
    document.getElementById(`vote-card-${voteKind}-${voteTarget}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }

  async function focusVoteCard(voteKind: string, voteTarget: string) {
    if (voteKind === 'plan') {
      activePhaseId = 'event-plan';
    } else if (voteKind === 'phase_change') {
      activePhaseId = data.lifecycle.currentPhaseId;
    }

    await tick();
    scrollVoteCardIntoView(voteKind, voteTarget);

    if (browser) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollVoteCardIntoView(voteKind, voteTarget);
        });
      });
    }
  }

  // Watch for activity target in URL and scroll/expand like projects do
  $: {
    const activityTargetId = readActivityTarget($page.url);

    if (!activityTargetId) {
      lastActivityTargetId = null;
    } else if (activityTargetId !== lastActivityTargetId) {
      lastActivityTargetId = activityTargetId;
      activePhaseId = 'activity';
      void focusActivityCard(activityTargetId);
    }
  }

  $: {
    const voteSignature = autoExpandVoteCards && autoExpandVoteKind && autoExpandVoteTarget
      ? `${autoExpandVoteKind}:${autoExpandVoteTarget}`
      : '';

    if (voteSignature && voteSignature !== lastVoteTargetSignature) {
      lastVoteTargetSignature = voteSignature;
      void focusVoteCard(autoExpandVoteKind as string, autoExpandVoteTarget as string);
    } else if (!voteSignature) {
      lastVoteTargetSignature = '';
    }
  }

  $: if (lastCurrentPhaseId !== data.lifecycle.currentPhaseId) {
    lastCurrentPhaseId = data.lifecycle.currentPhaseId;
    activePhaseId = data.lifecycle.currentPhaseId;
    showValueComposer = false;
    showPlanComposer = false;
    showActivityComposer = false;
    phaseChangeReason = '';
    highlightedActivityId = null;
  }

  $: if (
    !data.lifecycle.activity.selectablePlanPhases.some(
      (option) => option.id === activityForm.linkedPlanPhaseId
    )
  ) {
    activityForm = {
      ...activityForm,
      linkedPlanPhaseId: data.lifecycle.activity.selectablePlanPhases[0]?.id ?? null
    };
  }

  $: activePhase =
    data.lifecycle.phases.find((phase) => phase.id === activePhaseId) ??
    data.lifecycle.phases.find((phase) => phase.id === data.lifecycle.currentPhaseId) ??
    data.lifecycle.phases[0];
  $: targetedPhaseChangeGroup =
    autoExpandVoteCards && autoExpandVoteKind === 'phase_change' && autoExpandVoteTarget
      ? phaseChangeVoteGroup(autoExpandVoteTarget)
      : null;
  $: targetedPlanId =
    autoExpandVoteCards && autoExpandVoteKind === 'plan'
      ? autoExpandVoteTarget
      : null;
  $: signalSummary = data.lifecycle.phaseOne.signalSummary;
  $: selectedPlan =
    data.lifecycle.phaseTwo.plans.find((plan) => plan.id === data.lifecycle.phaseTwo.winningPlanId) ??
    null;
  $: plannedDayIsos = eventPlanScheduledDayIsos(selectedPlan);
  $: canAdvanceCurrentPhase =
    data.lifecycle.currentPhaseId === 'proposal'
      ? (signalSummary?.advancementUnlocked ?? false)
      : data.lifecycle.currentPhaseId === 'event-plan'
        ? !!data.lifecycle.phaseTwo.winningPlanId
        : data.lifecycle.currentPhaseId === 'activity';
  $: if (activePhaseId === 'activity' && plannedDayIsos.length > 0 && !plannedDayIsos.includes(selectedDayIso)) {
    selectedDayIso = plannedDayIsos[0];
  }
  $: minimumParticipants = minimumParticipantsFromRoles(activityForm.roleRequirements);
  $: phaseTabs = data.lifecycle.phases.map(
    (phase): EventLifecycleTabItem => ({
      phase,
      title: phase.title,
      progressLabel: phaseProgressLabel(phase),
      isFuture: phase.progressState === 'upcoming'
    })
  );
  $: activePhaseProgressLabel = phaseProgressLabel(activePhase);

  $: if (lastHowItWorksPhaseId !== activePhaseId) {
    lastHowItWorksPhaseId = activePhaseId;
    showHowItWorks = false;
  }

  $: if (!showPlanComposer && (planForm.validationMessages?.length ?? 0) > 0) {
    planForm = {
      ...planForm,
      validationMessages: []
    };
  }

  function phaseProgressLabel(phase: EventLifecyclePhase) {
    if (phase.id === data.lifecycle.currentPhaseId) {
      return 'Current';
    }

    return phase.progressState === 'complete' ? 'Complete' : phase.progressState === 'locked' ? 'Locked' : 'Upcoming';
  }

  function eventPlanPhaseHasAnyInput(phase: EventPlanForm['planPhases'][number]) {
    return !!phase.title.trim() || !!phase.details.trim();
  }

  function eventPlanPhaseIsComplete(phase: EventPlanForm['planPhases'][number]) {
    return !!phase.title.trim() && !!phase.details.trim();
  }

  function validateEventPlanForm(form: EventPlanForm) {
    const schedule = eventPlanScheduleFromForm(form);
    const scheduleBounds = eventScheduleBounds(schedule);
    const validationMessages: string[] = [];
    const hasStartTime = !!form.startTimeLabel.trim();
    const hasFinishTime = !!form.finishTimeLabel.trim();
    const hasRequiredScheduleDates =
      schedule.mode === 'date'
        ? !!schedule.startDate
        : schedule.mode === 'range'
          ? !!schedule.startDate && !!schedule.endDate
          : false;
    const hasAnyCompleteStage = form.planPhases.some(eventPlanPhaseIsComplete);
    const hasPartialStage = form.planPhases.some(
      (phase) => eventPlanPhaseHasAnyInput(phase) && !eventPlanPhaseIsComplete(phase)
    );

    if (!form.title.trim()) {
      validationMessages.push('Add a plan title.');
    }

    if (!form.description.trim()) {
      validationMessages.push('Add a plan description.');
    }

    if (!form.locationLabel.trim()) {
      validationMessages.push('Add a location for the event plan.');
    }

    if (!form.demandConsiderationNote.trim()) {
      validationMessages.push('Explain how this plan responds to the current demand signal.');
    }

    if (form.scheduleMode === 'date' && !schedule.startDate) {
      validationMessages.push('Choose the event date.');
    }

    if (form.scheduleMode === 'range' && (!schedule.startDate || !schedule.endDate)) {
      validationMessages.push('Choose both the start date and end date for the event range.');
    }

    if (!hasStartTime) {
      validationMessages.push('Choose a start time.');
    }

    if (!hasFinishTime) {
      validationMessages.push('Choose a finish time.');
    }

    if (hasRequiredScheduleDates && hasStartTime && hasFinishTime) {
      if (!eventScheduleIsValid(schedule) || !scheduleBounds.start || !scheduleBounds.end) {
        validationMessages.push('Finish must be after the event start.');
      } else if (!eventScheduleStartsInFuture(schedule)) {
        validationMessages.push('Event plans cannot start in the past.');
      }
    }

    if (!hasAnyCompleteStage) {
      validationMessages.push('Add at least one stage with both a title and details.');
    } else if (hasPartialStage) {
      validationMessages.push('Finish every stage you start. Each stage needs both a title and details.');
    }

    return {
      schedule,
      validationMessages
    };
  }

  function resetPlanForm() {
    planForm = createEventPlanForm();
  }

  function resetActivityForm() {
    activityForm = createDefaultActivityForm(selectedDayIso);
  }

  async function submitValue() {
    if (!draftValue.trim()) {
      return;
    }

    await addEventValue(data.slug, draftValue);
    draftValue = '';
    showValueComposer = false;
    await invalidateAll();
  }

  async function voteOnValue(valueId: string, vote: ProjectImportanceVoteValue) {
    await setEventValueImportance(data.slug, valueId, vote);
    await invalidateAll();
  }

  function addPlanPhase() {
    planForm = {
      ...planForm,
      planPhases: [...planForm.planPhases, { title: '', details: '' }]
    };
  }

  function removePlanPhase(index: number) {
    planForm = {
      ...planForm,
      planPhases:
        planForm.planPhases.length === 1
          ? [{ title: '', details: '' }]
          : planForm.planPhases.filter((_, phaseIndex) => phaseIndex !== index)
    };
  }

  async function submitPlan() {
    const { schedule, validationMessages } = validateEventPlanForm(planForm);
    const locationLabel = planForm.locationLabel.trim();

    if (validationMessages.length > 0) {
      planForm = {
        ...planForm,
        validationMessages
      };
      return;
    }

    const created = await addEventPlan(data.slug, {
      title: planForm.title,
      description: planForm.description,
      demandConsiderationNote: planForm.demandConsiderationNote,
      locationLabel,
      schedule,
      planPhases: planForm.planPhases
    });

    if (!created) {
      planForm = {
        ...planForm,
        validationMessages: ['This event plan could not be submitted from the current state. Reload and try again.']
      };
      return;
    }

    resetPlanForm();
    showPlanComposer = false;
    await invalidateAll();
  }

  async function voteOnPlanValue(planId: string, valueId: string, vote: ProjectApprovalVote | null) {
    await setEventPlanValueVote(data.slug, planId, valueId, vote);
    await invalidateAll();
  }

  async function voteOnPlanOverall(planId: string, vote: ProjectApprovalVote | null) {
    await setEventPlanOverallVote(data.slug, planId, vote);
    await invalidateAll();
  }

  function openActivityComposerForDay(isoDay = selectedDayIso) {
    const targetDayIso = isoDay || selectedDayIso || defaultActivityDayIso();

    if (showActivityComposer && (!targetDayIso || targetDayIso === selectedDayIso)) {
      showActivityComposer = false;
      return;
    }

    if (targetDayIso) {
      selectedDayIso = targetDayIso;
    }

    showActivityComposer = true;

    const winningPlan = currentWinningPlan();
    const defaultDayIso = defaultActivityDayIso(targetDayIso);
    const defaultWindow = eventPlanDefaultActivityWindow(winningPlan, defaultDayIso);
    const defaultLocationLabel = eventPlanDefaultLocationLabel(winningPlan) || data.locationLabel;
    const shouldRefreshWindow = !!targetDayIso || !activityForm.scheduledAt || !activityForm.endsAt;

    activityForm = {
      ...activityForm,
      locationLabel: activityForm.locationLabel || defaultLocationLabel,
      scheduledAt:
        shouldRefreshWindow && defaultWindow.scheduledAt
          ? defaultWindow.scheduledAt
          : activityForm.scheduledAt,
      endsAt:
        shouldRefreshWindow && defaultWindow.endsAt
          ? defaultWindow.endsAt
          : activityForm.endsAt
    };
  }

  async function submitActivity() {
    if (
      !activityForm.title.trim() ||
      !activityForm.scheduledAt.trim() ||
      !activityForm.endsAt.trim() ||
      !activityForm.locationLabel.trim() ||
      !activityForm.note.trim() ||
      !selectedPlan ||
      !eventActivityFitsSchedule(
        selectedPlan.schedule,
        activityForm.scheduledAt,
        activityForm.endsAt
      )
    ) {
      return;
    }

    await addEventActivity(data.slug, activityForm);
    resetActivityForm();
    showActivityComposer = false;
    await invalidateAll();
  }

  async function changeCommitment(activityId: string, roleLabel: string | null) {
    await setEventActivityCommitment(data.slug, activityId, roleLabel);
    await invalidateAll();
  }

  async function requestPhaseChange(targetPhaseId: EventLifecyclePhaseId, reason: string) {
    if (!targetPhaseId || !reason.trim()) {
      return;
    }

    if (targetPhaseId === data.lifecycle.nextPhaseId && !canAdvanceCurrentPhase) {
      return;
    }

    try {
      await requestEventPhaseChange(data.slug, targetPhaseId, reason);
      phaseChangeReason = '';
      await invalidateAll();
    } catch {
      // Phase change failed — demand threshold may not be met
    }
  }

  async function voteOnPhaseChange(requestId: string, vote: ProjectApprovalVote | null) {
    await setEventPhaseChangeVote(data.slug, requestId, vote);
    await invalidateAll();
  }
</script>

<section class="lifecycle-shell">
  <EventLifecyclePhaseTabs
    tabs={phaseTabs}
    {activePhaseId}
    selectPhase={(phase) => {
      activePhaseId = phase.id;
    }}
  />

  <section class="phase-panel">
    <EventLifecycleMechanicsCard
      phase={activePhase}
      progressLabel={activePhaseProgressLabel}
      bind:showHowItWorks
    />

    <EventLifecycleContent
      {data}
      {activePhaseId}
      {signalSummary}
      {selectedPlan}
      {importanceOptions}
      bind:draftValue
      bind:showValueComposer
      bind:showPlanComposer
      bind:showActivityComposer
      bind:selectedDayIso
      bind:highlightedActivityId
      {targetedPlanId}
      bind:planForm
      bind:activityForm
      {minimumParticipants}
      {submitValue}
      {voteOnValue}
      {addPlanPhase}
      {removePlanPhase}
      {submitPlan}
      {voteOnPlanValue}
      {voteOnPlanOverall}
      {openActivityComposerForDay}
      {submitActivity}
      changeCommitment={changeCommitment}
    />

    <EventPhaseChangeSection
      {data}
      {activePhaseId}
      {canAdvanceCurrentPhase}
      bind:phaseChangeReason
      {requestPhaseChange}
      {voteOnPhaseChange}
      autoExpandVoteGroup={targetedPhaseChangeGroup}
    />
  </section>
</section>

<style>
  .lifecycle-shell,
  .phase-panel {
    display: grid;
    gap: 12px;
  }

  .lifecycle-shell {
    margin-top: 16px;
  }

  .phase-panel {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }
</style>