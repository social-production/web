<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { invalidateAll } from '$app/navigation';
  import { tick } from 'svelte';
  import ProductiveLifecycleContent from './lifecycle/productive/ProductiveLifecycleContent.svelte';
  import CollectiveServiceLifecycleContent from './lifecycle/collective-service/CollectiveServiceLifecycleContent.svelte';
  import IndividualServiceLifecycleContent from './lifecycle/individual-service/IndividualServiceLifecycleContent.svelte';
  import {
    isCollectiveServiceProject,
    isPersonalServiceProject
  } from '$lib/features/projects/projectMode';
  import {
    addProjectActivity,
    addProjectDistributionPlan,
    addProjectProductionPlan,
    addProjectServiceRequest,
    addProjectValue,
    advanceProjectPhase,
    revertProjectPhase,
    setProjectActivityCommitment,
    setProjectPlanOverallVote,
    setProjectPlanValueVote,
    setProjectServiceRequestStatus,
    setProjectValueImportance
  } from '$lib/services/queries/details';
  import type {
    ProjectActivityRoleInput,
    ProjectApprovalVote,
    ProjectImportanceVoteValue,
    ProjectLifecyclePhase,
    ProjectLifecyclePhaseId,
    ProjectPageData,
    ProjectServiceRequestStatus
  } from '$lib/types/detail';
  import { formatRelativeTime } from '$lib/utils/time';

  const importanceOptions: Array<{ value: ProjectImportanceVoteValue; label: string }> = Array.from(
    { length: 10 },
    (_, index) => {
      const value = (index + 1) as ProjectImportanceVoteValue;

      return {
        value,
        label: value === 1 ? 'Unnecessary' : value === 10 ? 'Required' : `Importance ${value} of 10`
      };
    }
  );

  export let data: ProjectPageData;

  type DraftPlanPhase = {
    title: string;
    details: string;
    materialsLabel: string;
    costLabel: string;
  };

  const fundingPhaseCopy = 'Funding opens in a later platform phase';

  function createDraftPlanPhase(): DraftPlanPhase {
    return {
      title: '',
      details: '',
      materialsLabel: '',
      costLabel: fundingPhaseCopy
    };
  }

  function createDraftActivityRole(): ProjectActivityRoleInput {
    return {
      label: '',
      requiredCount: 1
    };
  }

  function minimumParticipantsFromRoles(roleRequirements: ProjectActivityRoleInput[]) {
    return roleRequirements.reduce(
      (total, role) => total + Math.max(1, Number(role.requiredCount) || 1),
      0
    );
  }

  let activePhaseId: ProjectLifecyclePhaseId = data.lifecycle.currentPhaseId;
  let lastCurrentPhaseId = data.lifecycle.currentPhaseId;
  let draftValue = '';
  let productionForm = {
    title: '',
    description: '',
    totalCostLabel: fundingPhaseCopy,
    planPhases: [createDraftPlanPhase()]
  };
  let distributionForm = {
    title: '',
    description: '',
    totalCostLabel: fundingPhaseCopy,
    planPhases: [createDraftPlanPhase()],
    requestSystemEnabled: false,
    requestMode: 'both' as const,
    allowOffScheduleRequests: false
  };
  let activityForm = {
    title: '',
    scheduledAt: '',
    endsAt: '',
    locationLabel: '',
    roleRequirements: [createDraftActivityRole()],
    linkedPlanPhaseId: null as string | null,
    note: ''
  };
  let serviceRequestForm = {
    title: '',
    body: '',
    scheduledAt: '',
    endsAt: ''
  };
  let showPhaseTwoComposer = false;
  let showPhaseThreeComposer = false;
  let showPhaseOneComposer = false;
  let showPersonalActivityComposer = false;
  let showPersonalServiceRequestComposer = false;
  let showPhaseFiveComposer = false;
  let showRevertComposer = false;
  let showCloseComposer = false;
  let expandedPhaseTwoPlanIds: string[] = [];
  let expandedPhaseThreePlanIds: string[] = [];
  let expandedActivityIds: string[] = [];
  let highlightedActivityId: string | null = null;
  let activityHighlightResetHandle: ReturnType<typeof setTimeout> | null = null;
  let lastActivityTargetId: string | null = null;
  let activityComposerElement: HTMLElement | null = null;
  let serviceRequestComposerElement: HTMLElement | null = null;
  let activityStartInputElement: HTMLInputElement | null = null;
  let activityEndInputElement: HTMLInputElement | null = null;
  let revertTargetPhaseId: Extract<ProjectLifecyclePhaseId, 'phase-2' | 'phase-3'> = 'phase-2';
  let revertReason = '';
  let closeReason = '';
  let showHowItWorks = false;
  let lastHowItWorksPhaseId = activePhaseId;

  function phaseOrder(phaseId: ProjectLifecyclePhaseId) {
    return data.lifecycle.phases.find((phase) => phase.id === phaseId)?.order ?? 1;
  }

  function readActivityTarget(url: URL) {
    if (url.hash.startsWith('#activity-card-')) {
      return url.hash.slice('#activity-card-'.length) || null;
    }

    if (url.hash.startsWith('#activity-')) {
      return url.hash.slice('#activity-'.length) || null;
    }

    return url.searchParams.get('activity');
  }

  $: currentPhaseOrder = phaseOrder(data.lifecycle.currentPhaseId);

  $: if (lastCurrentPhaseId !== data.lifecycle.currentPhaseId) {
    lastCurrentPhaseId = data.lifecycle.currentPhaseId;
    activePhaseId = data.lifecycle.currentPhaseId;
    showPhaseOneComposer = false;
    showPersonalActivityComposer = false;
    showPersonalServiceRequestComposer = false;
    showPhaseTwoComposer = false;
    showPhaseThreeComposer = false;
    showPhaseFiveComposer = false;
    showCloseComposer = false;
    closeReason = '';
    expandedPhaseTwoPlanIds = [];
    expandedPhaseThreePlanIds = [];
    expandedActivityIds = [];
    if (activityHighlightResetHandle) {
      clearTimeout(activityHighlightResetHandle);
      activityHighlightResetHandle = null;
    }
    highlightedActivityId = null;
  }

  $: activePhase =
    data.lifecycle.phases.find((phase) => phase.id === activePhaseId) ??
    data.lifecycle.phases.find((phase) => phase.id === data.lifecycle.currentPhaseId) ??
    data.lifecycle.phases[0];

  $: if (lastHowItWorksPhaseId !== activePhaseId) {
    lastHowItWorksPhaseId = activePhaseId;
    showHowItWorks = false;
  }

  $: if (!data.lifecycle.revertablePhaseIds.includes(revertTargetPhaseId)) {
    revertTargetPhaseId = data.lifecycle.revertablePhaseIds[0] ?? 'phase-2';
  }

  $: {
    const activityTargetId = readActivityTarget($page.url);

    if (!activityTargetId) {
      lastActivityTargetId = null;
    } else if (activityTargetId !== lastActivityTargetId) {
      lastActivityTargetId = activityTargetId;
      activePhaseId = isPersonalServiceProject(data.projectMode) ? 'phase-1' : 'phase-5';
      if (!expandedActivityIds.includes(activityTargetId)) {
        expandedActivityIds = [...expandedActivityIds, activityTargetId];
      }
      void focusActivityCard(activityTargetId);
    }
  }

  function isFuturePhase(phase: ProjectLifecyclePhase) {
    return phase.order > currentPhaseOrder;
  }

  function selectPhase(phase: ProjectLifecyclePhase) {
    activePhaseId = phase.id;
  }

  function phaseProgressLabel(phase: ProjectLifecyclePhase) {
    if (phase.progressState === 'current') {
      return 'Current phase';
    }

    if (phase.progressState === 'complete') {
      return 'Complete';
    }

    if (phase.progressState === 'locked') {
      return 'Unavailable in beta';
    }

    return 'Not unlocked yet';
  }

  function phaseTabTitle(phase: ProjectLifecyclePhase) {
    if (isPersonalServiceProject(data.projectMode)) {
      switch (phase.id) {
        case 'phase-1':
          return 'Activity';
        case 'phase-2':
          return 'Closed';
        default:
          return phase.shortLabel;
      }
    }

    if (isCollectiveServiceProject(data.projectMode)) {
      switch (phase.id) {
        case 'phase-2':
          return 'Operations';
        case 'phase-3':
          return 'Access';
        case 'phase-6':
          return 'Closed';
      }
    }

    switch (phase.id) {
      case 'phase-1':
        return 'Proposal';
      case 'phase-2':
        return 'Production';
      case 'phase-3':
        return 'Distribution';
      case 'phase-4':
        return 'Acquisition';
      case 'phase-5':
        return 'Activity';
      case 'phase-6':
        return 'Closed';
    }
  }

  function closePhaseId() {
    return isPersonalServiceProject(data.projectMode) ? 'phase-2' : 'phase-6';
  }

  function isClosingTransition() {
    return data.lifecycle.nextPhaseId === closePhaseId();
  }

  function revertTargetLabel(phaseId: Extract<ProjectLifecyclePhaseId, 'phase-2' | 'phase-3'>) {
    if (phaseId === 'phase-2') {
      return isCollectiveServiceProject(data.projectMode)
        ? 'Phase 2 / Operations Plan'
        : 'Phase 2 / Production Plan';
    }

    return isCollectiveServiceProject(data.projectMode)
      ? 'Phase 3 / Access Plan'
      : 'Phase 3 / Distribution Plan';
  }

  function advanceLabel() {
    if (!data.lifecycle.nextPhaseId || !data.lifecycle.nextPhaseLabel) {
      return null;
    }

    if (isClosingTransition()) {
      return 'Close with note';
    }

    if (data.lifecycle.currentPhaseId === 'phase-3') {
      return `Skip locked acquisition and move to ${data.lifecycle.nextPhaseLabel}`;
    }

    return `Move to ${data.lifecycle.nextPhaseLabel}`;
  }

  async function refreshAfter(action: () => Promise<void>) {
    await action();
    await invalidateAll();
  }

  function handleProjectValueVote(valueId: string, voteValue: ProjectImportanceVoteValue) {
    return refreshAfter(() => setProjectValueImportance(data.slug, valueId, voteValue));
  }

  function handlePhaseTwoPlanValueVote(
    planId: string,
    valueId: string,
    vote: ProjectApprovalVote | null
  ) {
    return refreshAfter(() => setProjectPlanValueVote(data.slug, 'phase-2', planId, valueId, vote));
  }

  function handlePhaseTwoPlanOverallVote(planId: string, vote: ProjectApprovalVote | null) {
    return refreshAfter(() => setProjectPlanOverallVote(data.slug, 'phase-2', planId, vote));
  }

  function handlePhaseThreePlanValueVote(
    planId: string,
    valueId: string,
    vote: ProjectApprovalVote | null
  ) {
    return refreshAfter(() => setProjectPlanValueVote(data.slug, 'phase-3', planId, valueId, vote));
  }

  function handlePhaseThreePlanOverallVote(planId: string, vote: ProjectApprovalVote | null) {
    return refreshAfter(() => setProjectPlanOverallVote(data.slug, 'phase-3', planId, vote));
  }

  async function submitValue() {
    if (!draftValue.trim()) {
      return;
    }

    await refreshAfter(() => addProjectValue(data.slug, draftValue));
    draftValue = '';
    showPhaseOneComposer = false;
  }

  async function submitProductionPlan() {
    const planPhases = productionForm.planPhases.filter(
      (phase) => phase.title.trim() && phase.details.trim() && phase.materialsLabel.trim() && phase.costLabel.trim()
    );

    if (
      !productionForm.title.trim() ||
      !productionForm.description.trim() ||
      !productionForm.totalCostLabel.trim() ||
      planPhases.length === 0
    ) {
      return;
    }

    await refreshAfter(() =>
      addProjectProductionPlan(data.slug, {
        title: productionForm.title,
        description: productionForm.description,
        totalCostLabel: productionForm.totalCostLabel,
        planPhases
      })
    );
    productionForm = {
      title: '',
      description: '',
      totalCostLabel: fundingPhaseCopy,
      planPhases: [createDraftPlanPhase()]
    };
    showPhaseTwoComposer = false;
  }

  async function submitDistributionPlan() {
    const planPhases = distributionForm.planPhases.filter(
      (phase) => phase.title.trim() && phase.details.trim() && phase.materialsLabel.trim() && phase.costLabel.trim()
    );

    if (
      !distributionForm.title.trim() ||
      !distributionForm.description.trim() ||
      !distributionForm.totalCostLabel.trim() ||
      planPhases.length === 0
    ) {
      return;
    }

    await refreshAfter(() =>
      addProjectDistributionPlan(data.slug, {
        title: distributionForm.title,
        description: distributionForm.description,
        totalCostLabel: distributionForm.totalCostLabel,
        planPhases,
        requestSystemEnabled: distributionForm.requestSystemEnabled,
        requestMode: distributionForm.requestMode,
        allowOffScheduleRequests: distributionForm.allowOffScheduleRequests
      })
    );
    distributionForm = {
      title: '',
      description: '',
      totalCostLabel: fundingPhaseCopy,
      planPhases: [createDraftPlanPhase()],
      requestSystemEnabled: false,
      requestMode: 'both',
      allowOffScheduleRequests: false
    };
    showPhaseThreeComposer = false;
  }

  async function submitActivity() {
    const scheduledAtValue = activityStartInputElement?.value || activityForm.scheduledAt;
    const endsAtValue = activityEndInputElement?.value || activityForm.endsAt;

    if (isPersonalServiceProject(data.projectMode)) {
      if (!scheduledAtValue || !endsAtValue || new Date(endsAtValue).getTime() <= new Date(scheduledAtValue).getTime()) {
        return;
      }

      activityForm.scheduledAt = scheduledAtValue;
      activityForm.endsAt = endsAtValue;

      await refreshAfter(() =>
        addProjectActivity(data.slug, {
          title: 'Available',
          scheduledAt: new Date(scheduledAtValue).toISOString(),
          endsAt: new Date(endsAtValue).toISOString(),
          locationLabel: data.locationLabel,
          roleRequirements: [{ label: 'Service lead', requiredCount: 1 }],
          linkedPlanPhaseId: null,
          note: 'Availability shared by the service creator.'
        })
      );
      activityForm = {
        title: '',
        scheduledAt: '',
        endsAt: '',
        locationLabel: '',
        roleRequirements: [createDraftActivityRole()],
        linkedPlanPhaseId: null,
        note: ''
      };
      showPersonalActivityComposer = false;
      return;
    }

    const roleRequirements = activityForm.roleRequirements
      .map((role) => {
        const requiredCount = Math.max(1, Number(role.requiredCount) || 1);
        const parsedMaximumCount = Number(role.maximumCount);

        return {
          label: role.label.trim(),
          requiredCount,
          maximumCount: Number.isFinite(parsedMaximumCount)
            ? Math.max(requiredCount, Math.floor(parsedMaximumCount))
            : undefined
        };
      })
      .filter((role) => role.label);

    if (
      !activityForm.title.trim() ||
      !scheduledAtValue ||
      !endsAtValue ||
      !activityForm.locationLabel.trim() ||
      !activityForm.note.trim() ||
      roleRequirements.length === 0 ||
      new Date(endsAtValue).getTime() <= new Date(scheduledAtValue).getTime()
    ) {
      return;
    }

    activityForm.scheduledAt = scheduledAtValue;
    activityForm.endsAt = endsAtValue;

    await refreshAfter(() =>
      addProjectActivity(data.slug, {
        title: activityForm.title,
        scheduledAt: new Date(scheduledAtValue).toISOString(),
        endsAt: new Date(endsAtValue).toISOString(),
        locationLabel: activityForm.locationLabel,
        roleRequirements,
        linkedPlanPhaseId: activityForm.linkedPlanPhaseId || null,
        note: activityForm.note
      })
    );
    activityForm = {
      title: '',
      scheduledAt: '',
      endsAt: '',
      locationLabel: '',
      roleRequirements: [createDraftActivityRole()],
      linkedPlanPhaseId: null,
      note: ''
    };
    showPersonalActivityComposer = false;
    showPhaseFiveComposer = false;
  }

  async function submitServiceRequest() {
    const scheduledAtValue = serviceRequestForm.scheduledAt;
    const endsAtValue = serviceRequestForm.endsAt;
    const requiresSchedule = data.lifecycle.requestSystem?.requiresSchedule ?? false;

    if (!serviceRequestForm.title.trim() || !serviceRequestForm.body.trim()) {
      return;
    }

    if (requiresSchedule && (!scheduledAtValue || !endsAtValue || new Date(endsAtValue).getTime() <= new Date(scheduledAtValue).getTime())) {
      return;
    }

    await refreshAfter(() =>
      addProjectServiceRequest(data.slug, {
        title: serviceRequestForm.title,
        body: serviceRequestForm.body,
        scheduledAt: scheduledAtValue ? new Date(scheduledAtValue).toISOString() : undefined,
        endsAt: endsAtValue ? new Date(endsAtValue).toISOString() : undefined
      })
    );
    serviceRequestForm = {
      title: '',
      body: '',
      scheduledAt: '',
      endsAt: ''
    };
    showPersonalServiceRequestComposer = false;
  }

  async function updateRequestStatus(requestId: string, status: ProjectServiceRequestStatus) {
    await refreshAfter(() => setProjectServiceRequestStatus(data.slug, requestId, status));
  }

  function addProductionPlanPhase() {
    productionForm.planPhases = [...productionForm.planPhases, createDraftPlanPhase()];
  }

  function removeProductionPlanPhase(index: number) {
    productionForm.planPhases = productionForm.planPhases.filter((_, phaseIndex) => phaseIndex !== index);
  }

  function addDistributionPlanPhase() {
    distributionForm.planPhases = [...distributionForm.planPhases, createDraftPlanPhase()];
  }

  function removeDistributionPlanPhase(index: number) {
    distributionForm.planPhases = distributionForm.planPhases.filter((_, phaseIndex) => phaseIndex !== index);
  }

  function toggleExpandedPlan(list: 'phase-2' | 'phase-3', planId: string) {
    const expanded = list === 'phase-2' ? expandedPhaseTwoPlanIds : expandedPhaseThreePlanIds;
    const nextExpanded = expanded.includes(planId)
      ? expanded.filter((item) => item !== planId)
      : [...expanded, planId];

    if (list === 'phase-2') {
      expandedPhaseTwoPlanIds = nextExpanded;
      return;
    }

    expandedPhaseThreePlanIds = nextExpanded;
  }

  function isExpandedPlan(list: 'phase-2' | 'phase-3', planId: string) {
    return (list === 'phase-2' ? expandedPhaseTwoPlanIds : expandedPhaseThreePlanIds).includes(planId);
  }

  async function updateActivityCommitment(activityId: string, roleLabel: string | null) {
    await refreshAfter(() => setProjectActivityCommitment(data.slug, activityId, roleLabel));
  }

  function setDefaultActivityTimes(isoDay?: string) {
    if (isoDay) {
      activityForm.scheduledAt = `${isoDay}T18:00`;
      activityForm.endsAt = `${isoDay}T19:00`;
      return;
    }

    if (!activityForm.scheduledAt || !activityForm.endsAt) {
      const now = new Date();
      now.setMinutes(0, 0, 0);
      now.setHours(now.getHours() + 1);
      const end = new Date(now.getTime() + 60 * 60 * 1000);
      const localValue = (date: Date) => {
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, '0');
        const day = `${date.getDate()}`.padStart(2, '0');
        const hours = `${date.getHours()}`.padStart(2, '0');
        const minutes = `${date.getMinutes()}`.padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      activityForm.scheduledAt = localValue(now);
      activityForm.endsAt = localValue(end);
    }
  }

  function setDefaultServiceRequestTimes(isoDay?: string) {
    if (!(data.lifecycle.requestSystem?.requiresSchedule ?? false)) {
      serviceRequestForm.scheduledAt = '';
      serviceRequestForm.endsAt = '';
      return;
    }

    if (isoDay) {
      serviceRequestForm.scheduledAt = `${isoDay}T18:00`;
      serviceRequestForm.endsAt = `${isoDay}T19:00`;
      return;
    }

    if (!serviceRequestForm.scheduledAt || !serviceRequestForm.endsAt) {
      const now = new Date();
      now.setMinutes(0, 0, 0);
      now.setHours(now.getHours() + 1);
      const end = new Date(now.getTime() + 60 * 60 * 1000);
      const localValue = (date: Date) => {
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, '0');
        const day = `${date.getDate()}`.padStart(2, '0');
        const hours = `${date.getHours()}`.padStart(2, '0');
        const minutes = `${date.getMinutes()}`.padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      serviceRequestForm.scheduledAt = localValue(now);
      serviceRequestForm.endsAt = localValue(end);
    }
  }

  function selectCalendarDay(isoDay: string) {
    setDefaultActivityTimes(isoDay);
  }

  async function openActivityComposerForDay(isoDay: string) {
    selectCalendarDay(isoDay);
    showPhaseFiveComposer = true;
    await tick();
    activityComposerElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function openActivityComposer() {
    setDefaultActivityTimes();
    showPhaseFiveComposer = true;
    await tick();
    activityComposerElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function openPersonalActivityComposer() {
    setDefaultActivityTimes();
    showPersonalActivityComposer = true;
    await tick();
    activityComposerElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function openPersonalServiceRequestComposerForDay(isoDay: string) {
    setDefaultServiceRequestTimes(isoDay);
    showPersonalServiceRequestComposer = true;
    await tick();
    serviceRequestComposerElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function openPersonalServiceRequestComposer() {
    setDefaultServiceRequestTimes();
    showPersonalServiceRequestComposer = true;
    await tick();
    serviceRequestComposerElement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function toggleExpandedActivity(activityId: string) {
    expandedActivityIds = expandedActivityIds.includes(activityId)
      ? expandedActivityIds.filter((id) => id !== activityId)
      : [...expandedActivityIds, activityId];
  }

  function isExpandedActivity(activityId: string) {
    return expandedActivityIds.includes(activityId);
  }

  function scrollActivityCardIntoView(activityId: string) {
    if (!browser) {
      return;
    }

    document.getElementById(`activity-card-${activityId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  async function focusActivityCard(activityId: string) {
    if (activityHighlightResetHandle) {
      clearTimeout(activityHighlightResetHandle);
    }
    highlightedActivityId = activityId;
    await tick();
    scrollActivityCardIntoView(activityId);

    if (browser) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
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

  async function submitRevert() {
    if (!revertReason.trim()) {
      return;
    }

    await refreshAfter(() => revertProjectPhase(data.slug, revertTargetPhaseId, revertReason));
    showRevertComposer = false;
    revertReason = '';
  }

  async function submitClose() {
    if (!closeReason.trim()) {
      return;
    }

    await refreshAfter(() => advanceProjectPhase(data.slug, closeReason));
    showCloseComposer = false;
    closeReason = '';
  }
</script>

<section class="lifecycle-shell">
  <section class="phase-tab-row" style={`grid-template-columns: repeat(${data.lifecycle.phases.length}, minmax(0, 1fr))`}>
    {#each data.lifecycle.phases as phase}
      <button
        class:active={activePhaseId === phase.id}
        class:current-phase={phase.progressState === 'current'}
        class:future-phase={isFuturePhase(phase) && phase.progressState !== 'locked'}
        class:locked-phase={phase.progressState === 'locked'}
        class="phase-tab"
        type="button"
        on:click={() => selectPhase(phase)}
      >
        <span class="phase-tab-number">{phase.shortLabel}</span>
        <span class="phase-tab-title">{phaseTabTitle(phase)}</span>
        <small class:current-label={phase.progressState === 'current'}>{phaseProgressLabel(phase)}</small>
      </button>
    {/each}
  </section>

  <section class="phase-panel">
    <div class="phase-header">
      <div class="phase-line">
        <span class="phase-kicker">{activePhase.shortLabel}</span>
        <div class="phase-badges">
          <span class={`phase-badge ${activePhase.progressState}`}>{phaseProgressLabel(activePhase)}</span>
          {#if activePhase.betaLocked}
            <span class="phase-badge locked">Coming later</span>
          {/if}
        </div>
      </div>

      <div class="phase-copy">
        <div class="phase-title-row">
          <h2>{activePhase.title}</h2>
          <button
            class="phase-help-button"
            type="button"
            aria-label={showHowItWorks ? 'Hide how it works' : 'Show how it works'}
            aria-expanded={showHowItWorks}
            on:click={() => (showHowItWorks = !showHowItWorks)}
          >
            ?
          </button>
        </div>
      </div>
    </div>

    <div class="mechanics-card">
      {#if showHowItWorks}
        <div class="mechanics-body">
          <p>{activePhase.summary}</p>
          {#if activePhase.note}
            <p class:locked-copy={activePhase.progressState === 'locked'} class="phase-note">{activePhase.note}</p>
          {/if}
          <ul class="phase-list">
            {#each activePhase.mechanics as mechanic}
              <li>{mechanic}</li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>

    {#if isPersonalServiceProject(data.projectMode)}
      <IndividualServiceLifecycleContent
        data={data}
        activePhaseId={activePhase.id}
        activityForm={activityForm}
        serviceRequestForm={serviceRequestForm}
        bind:showPersonalActivityComposer
        bind:showPersonalServiceRequestComposer
        bind:activityComposerElement
        bind:serviceRequestComposerElement
        bind:activityStartInputElement
        bind:activityEndInputElement
        openPersonalActivityComposer={openPersonalActivityComposer}
        openPersonalServiceRequestComposer={openPersonalServiceRequestComposer}
        openPersonalServiceRequestComposerForDay={openPersonalServiceRequestComposerForDay}
        submitActivity={submitActivity}
        submitServiceRequest={submitServiceRequest}
        updateRequestStatus={updateRequestStatus}
      />
    {:else if isCollectiveServiceProject(data.projectMode)}
      <CollectiveServiceLifecycleContent
        data={data}
        activePhaseId={activePhase.id}
        {importanceOptions}
        bind:draftValue
        bind:showPhaseOneComposer
        bind:showPhaseTwoComposer
        bind:showPhaseThreeComposer
        bind:showPhaseFiveComposer
        productionForm={productionForm}
        distributionForm={distributionForm}
        activityForm={activityForm}
        serviceRequestForm={serviceRequestForm}
        {highlightedActivityId}
        bind:activityComposerElement
        bind:activityStartInputElement
        bind:activityEndInputElement
        submitValue={submitValue}
        setProjectValueVote={handleProjectValueVote}
        addProductionPlanPhase={addProductionPlanPhase}
        removeProductionPlanPhase={removeProductionPlanPhase}
        submitProductionPlan={submitProductionPlan}
        setPhaseTwoPlanValueVote={handlePhaseTwoPlanValueVote}
        setPhaseTwoPlanOverallVote={handlePhaseTwoPlanOverallVote}
        addDistributionPlanPhase={addDistributionPlanPhase}
        removeDistributionPlanPhase={removeDistributionPlanPhase}
        submitDistributionPlan={submitDistributionPlan}
        setPhaseThreePlanValueVote={handlePhaseThreePlanValueVote}
        setPhaseThreePlanOverallVote={handlePhaseThreePlanOverallVote}
        isExpandedPlan={isExpandedPlan}
        openActivityComposer={openActivityComposer}
        openActivityComposerForDay={openActivityComposerForDay}
        focusActivityCard={focusActivityCard}
        submitActivity={submitActivity}
        submitServiceRequest={submitServiceRequest}
        updateActivityCommitment={updateActivityCommitment}
      />
    {:else}
      <ProductiveLifecycleContent
        data={data}
        activePhaseId={activePhase.id}
        {importanceOptions}
        bind:draftValue
        bind:showPhaseOneComposer
        bind:showPhaseTwoComposer
        bind:showPhaseThreeComposer
        bind:showPhaseFiveComposer
        productionForm={productionForm}
        distributionForm={distributionForm}
        activityForm={activityForm}
        serviceRequestForm={serviceRequestForm}
        {highlightedActivityId}
        bind:activityComposerElement
        bind:activityStartInputElement
        bind:activityEndInputElement
        submitValue={submitValue}
        setProjectValueVote={handleProjectValueVote}
        addProductionPlanPhase={addProductionPlanPhase}
        removeProductionPlanPhase={removeProductionPlanPhase}
        submitProductionPlan={submitProductionPlan}
        setPhaseTwoPlanValueVote={handlePhaseTwoPlanValueVote}
        setPhaseTwoPlanOverallVote={handlePhaseTwoPlanOverallVote}
        addDistributionPlanPhase={addDistributionPlanPhase}
        removeDistributionPlanPhase={removeDistributionPlanPhase}
        submitDistributionPlan={submitDistributionPlan}
        setPhaseThreePlanValueVote={handlePhaseThreePlanValueVote}
        setPhaseThreePlanOverallVote={handlePhaseThreePlanOverallVote}
        isExpandedPlan={isExpandedPlan}
        openActivityComposer={openActivityComposer}
        openActivityComposerForDay={openActivityComposerForDay}
        focusActivityCard={focusActivityCard}
        submitActivity={submitActivity}
        submitServiceRequest={submitServiceRequest}
        updateActivityCommitment={updateActivityCommitment}
      />
    {/if}

    {#if data.lifecycle.viewerCanRevertPhase && activePhase.id === data.lifecycle.currentPhaseId}
      <div class="mechanics-card revert-card-shell">
        <div class="request-header-row">
          <div>
            <h3>Return to planning</h3>
            <p>Managers can send the current project back to an earlier plan phase, but a reason is required.</p>
          </div>
          <button class="secondary-button" type="button" on:click={() => (showRevertComposer = !showRevertComposer)}>
            {showRevertComposer ? 'Hide revert form' : 'Revert with reason'}
          </button>
        </div>

        {#if showRevertComposer}
          <div class="composer-card">
            <label>
              <span class="field-inline-label">Return to</span>
              <select bind:value={revertTargetPhaseId}>
                {#each data.lifecycle.revertablePhaseIds as phaseId}
                  <option value={phaseId}>{revertTargetLabel(phaseId)}</option>
                {/each}
              </select>
            </label>
            <label>
              <span class="field-inline-label">Reason</span>
              <textarea bind:value={revertReason} rows="3" placeholder="State clearly why the current plan should return to an earlier phase."></textarea>
            </label>
            <div class="composer-actions">
              <button class="primary-button" type="button" on:click={submitRevert}>Submit revert</button>
            </div>
          </div>
        {/if}

        {#if data.lifecycle.revertHistory.length > 0}
          <div class="surface-stack">
            {#each data.lifecycle.revertHistory as entry}
              <article class="surface-card request-card">
                <div class="request-header-row">
                  <div>
                    <strong>{revertTargetLabel(entry.targetPhaseId)}</strong>
                    <span>{entry.authorUsername} · {formatRelativeTime(entry.createdAt)}</span>
                  </div>
                </div>
                <p>{entry.reason}</p>
              </article>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    {#if data.lifecycle.viewerCanAdvancePhase && activePhase.id === data.lifecycle.currentPhaseId && advanceLabel()}
      {#if isClosingTransition()}
        <div class="mechanics-card close-card-shell">
          <div class="request-header-row">
            <div>
              <h3>Close project</h3>
              <p>Managers must leave a short note explaining why this is closing or where the work moved.</p>
            </div>
            <button class="secondary-button" type="button" on:click={() => (showCloseComposer = !showCloseComposer)}>
              {showCloseComposer ? 'Hide close form' : 'Close with note'}
            </button>
          </div>

          {#if showCloseComposer}
            <div class="composer-card">
              <label>
                <span class="field-inline-label">Closure note</span>
                <textarea bind:value={closeReason} rows="3" placeholder="State why the project is closing or where the work is continuing."></textarea>
              </label>
              <div class="composer-actions">
                <button class="primary-button" type="button" on:click={submitClose}>Close project</button>
              </div>
            </div>
          {/if}
        </div>
      {:else}
        <div class="advance-row">
          <button class="primary-button" type="button" on:click={() => refreshAfter(() => advanceProjectPhase(data.slug))}>
            {advanceLabel()}
          </button>
        </div>
      {/if}
    {/if}
  </section>
</section>

<style>
  .lifecycle-shell,
  .phase-copy,
  .phase-panel,
  .phase-surface,
  .surface-header,
  .surface-stack,
  .composer-card,
  .plan-card,
  .assessment-stack,
  .value-card,
  .mechanics-card,
  .activity-card,
  .phase-header,
  .request-card-shell,
  .revert-card-shell {
    display: grid;
    gap: 12px;
  }

  .phase-line,
  .phase-badges,
  .request-header-row,
  .value-header,
  .importance-row,
  .binary-row,
  .overall-row,
  .composer-actions,
  .plan-header,
  .activity-meta,
  .advance-row {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .phase-tab-row,
  .phase-panel,
  .composer-card,
  .surface-card,
  .empty-card,
  .mechanics-card,
  .meta-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .phase-line,
  .request-header-row,
  .value-header,
  .overall-row,
  .phase-title-row,
  .plan-header {
    justify-content: space-between;
  }

  .phase-tab-row {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 10px;
  }

  .phase-tab {
    min-width: 0;
    display: grid;
    justify-items: start;
    gap: 3px;
    align-content: start;
    min-height: 82px;
    padding: 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-soft);
    text-align: left;
    font-size: 12px;
    font-weight: 700;
  }

  .phase-tab.future-phase {
    border-color: color-mix(in srgb, var(--accent-warm) 35%, var(--panel-border));
    color: var(--accent-warm-strong);
  }

  .phase-tab.locked-phase {
    border-color: color-mix(in srgb, var(--tablet-community-bg) 60%, var(--panel-border));
    background: color-mix(in srgb, var(--tablet-community-bg) 16%, var(--panel));
    color: var(--tablet-community-text);
  }

  .phase-tab small {
    color: inherit;
    font-size: 10px;
    opacity: 0.82;
  }

  .phase-tab.active {
    border-color: var(--brand);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--brand) 30%, transparent);
  }

  .phase-tab-number,
  .phase-tab-title {
    color: var(--text-main);
  }

  .phase-tab-title {
    font-size: 13px;
    font-weight: 700;
  }

  .phase-tab small.current-label {
    color: var(--brand-strong);
    opacity: 1;
  }

  .phase-kicker {
    color: var(--brand-strong);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .phase-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .phase-help-button {
    width: 26px;
    height: 26px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel);
    color: var(--text-main);
    font-size: 14px;
    font-weight: 700;
    line-height: 1;
    display: grid;
    place-items: center;
  }

  h2,
  h3,
  strong {
    color: var(--text-main);
  }

  h2 {
    font-size: 16px;
  }

  h3 {
    font-size: 14px;
  }

  p,
  span,
  li {
    color: var(--text-soft);
    line-height: 1.5;
  }

  .phase-badge {
    padding: 6px 10px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel-strong);
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
  }

  .phase-badge.current,
  .phase-badge.complete {
    border-color: color-mix(in srgb, var(--brand) 40%, var(--panel-border));
    background: color-mix(in srgb, var(--brand-soft) 75%, var(--panel));
    color: var(--brand-strong);
  }

  .phase-badge.locked {
    border-color: var(--tablet-community-bg);
    background: color-mix(in srgb, var(--tablet-community-bg) 16%, var(--panel));
    color: var(--tablet-community-text);
  }

  .phase-badge.upcoming {
    border-color: color-mix(in srgb, var(--accent-warm) 40%, var(--panel-border));
    color: var(--accent-warm-strong);
  }

  .role-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .mechanics-card,
  .meta-card,
  .surface-card,
  .composer-card {
    background: var(--panel-strong);
  }

  .phase-list {
    margin: 0;
    padding-left: 18px;
    display: grid;
    gap: 10px;
  }

  .mechanics-body {
    display: grid;
    gap: 12px;
  }

  .composer-toggle-row {
    display: flex;
    justify-content: center;
  }

  .plus-button {
    width: 34px;
    height: 34px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel);
    color: var(--text-main);
    font-size: 20px;
    line-height: 1;
    display: grid;
    place-items: center;
  }

  .plus-button.active-plus {
    border-color: var(--brand);
    color: var(--brand-strong);
    background: var(--brand-soft);
  }

  .primary-button,
  .secondary-button,
  .vote-chip {
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 700;
  }

  .primary-button {
    background: var(--brand);
    color: var(--page-bg);
  }

  .secondary-button,
  .vote-chip {
    border: 1px solid var(--panel-border);
    background: var(--panel);
    color: var(--text-soft);
  }

  .vote-chip.selected {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .vote-chip.negative.selected {
    border-color: var(--tablet-community-bg);
    background: color-mix(in srgb, var(--tablet-community-bg) 16%, var(--panel));
    color: var(--tablet-community-text);
  }

  .plan-grid,
  .single-column {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .single-column {
    grid-template-columns: 1fr;
  }

  .assessment-row {
    display: grid;
    gap: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--panel-border);
  }

  .surface-card p,
  .phase-note {
    margin-top: 4px;
  }

  .reduced-activity-card,
  .activity-expanded {
    display: grid;
    gap: 10px;
  }

  .reduced-activity-card {
    transition: border-color 0.12s ease, box-shadow 0.12s ease;
  }

  .reduced-activity-card:hover,
  .activity-highlight {
    border-color: color-mix(in srgb, var(--brand) 40%, var(--panel-border));
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--brand) 25%, transparent);
  }

  .collapsible-card,
  .step-stack,
  .step-card,
  .plan-phase-stack,
  .plan-card-copy,
  .calendar-shell,
  .calendar-activity-stack,
  .number-grid {
    display: grid;
    gap: 12px;
  }

  .collapse-toggle {
    padding: 0;
    border: 0;
    background: transparent;
    text-align: left;
  }

  .step-header-row,
  .plan-footer-meta,
  .calendar-header-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }

  .plan-footer-meta {
    font-size: 12px;
  }

  .total-cost-row {
    padding-top: 8px;
    border-top: 1px solid var(--panel-border);
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 10px;
  }

  .calendar-cell {
    min-height: 112px;
    padding: 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    display: grid;
    align-content: start;
    gap: 8px;
    text-align: left;
  }

  .calendar-day-number {
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
  }

  .calendar-chip {
    display: block;
    padding: 5px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tone-red {
    background: color-mix(in srgb, var(--tablet-community-bg) 18%, var(--panel));
    color: var(--tablet-community-text);
  }

  .tone-yellow {
    background: color-mix(in srgb, var(--accent-warm) 18%, var(--panel));
    color: var(--accent-warm-strong);
  }

  .tone-green {
    background: color-mix(in srgb, var(--brand-soft) 80%, var(--panel));
    color: var(--brand-strong);
  }

  .muted-day {
    opacity: 0.45;
  }

  .selected-day {
    border-color: var(--brand);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--brand) 35%, transparent);
  }

  .number-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .locked-copy {
    color: var(--tablet-community-text);
  }

  textarea,
  select {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-main);
  }

  textarea {
    min-height: 110px;
    resize: vertical;
  }

  .empty-card.locked-card {
    border-color: var(--tablet-community-bg);
    color: var(--tablet-community-text);
    background: color-mix(in srgb, var(--tablet-community-bg) 14%, var(--panel));
  }

  .advance-row {
    justify-content: flex-end;
  }

  .checkbox-row {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .field-inline-label {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 700;
    color: var(--text-main);
  }

  @media (max-width: 760px) {
    .plan-grid,
    .role-grid,
    .number-grid,
    .calendar-grid {
      grid-template-columns: 1fr;
    }

    .phase-tab-row {
      gap: 8px;
    }

    .phase-tab {
      min-height: 52px;
      padding: 8px 6px;
    }

    .phase-tab-title,
    .phase-tab small {
      display: none;
    }
  }
</style>
