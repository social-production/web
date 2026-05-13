<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { invalidateAll } from '$app/navigation';
  import { tick } from 'svelte';
  import ProductiveLifecycleContent from './lifecycle/productive/ProductiveLifecycleContent.svelte';
  import CollectiveServiceLifecycleContent from './lifecycle/collective-service/CollectiveServiceLifecycleContent.svelte';
  import IndividualServiceLifecycleContent from './lifecycle/individual-service/IndividualServiceLifecycleContent.svelte';
  import ProjectLifecycleMechanicsCard from './components/ProjectLifecycleMechanicsCard.svelte';
  import ProjectLifecyclePhaseTabs from './components/ProjectLifecyclePhaseTabs.svelte';
  import ProjectPhaseChangeSection from './components/ProjectPhaseChangeSection.svelte';
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
    planProjectServiceRequest,
    requestProjectPhaseChange,
    requestProjectServiceRequestSettingsChange,
    setProjectActivityCommitment,
    setProjectPhaseChangeVote,
    setProjectPlanOverallVote,
    setProjectPlanValueVote,
    setProjectServiceRequestSettingsChangeVote,
    setProjectServiceRequestStatus,
    toggleProjectServiceHistoryCompletion,
    setProjectValueImportance
  } from '$lib/services/queries/details';
  import type {
    ProjectActivityRoleInput,
    ProjectServiceHistoryCompletionRole,
    ProjectApprovalVote,
    ProjectImportanceVoteValue,
    ProjectLifecyclePhase,
    ProjectLifecyclePhaseId,
    ProjectPageData,
    ProjectServiceRequestPlanInput,
    ProjectServiceRequestSettingsChangeInput,
    ProjectServiceRequestStatus
  } from '$lib/types/detail';

  type LifecycleTabItem = {
    phase: ProjectLifecyclePhase;
    title: string;
    progressLabel: string;
    isFuture: boolean;
  };

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
  let showCollectiveRequestComposer = false;
  let showPhaseFiveComposer = false;
  let expandedPhaseTwoPlanIds: string[] = [];
  let expandedPhaseThreePlanIds: string[] = [];
  let expandedActivityIds: string[] = [];
  let highlightedActivityId: string | null = null;
  let selectedCollectiveRequestActivityId: string | null = null;
  let activityHighlightResetHandle: ReturnType<typeof setTimeout> | null = null;
  let lastActivityTargetId: string | null = null;
  let activityComposerElement: HTMLElement | null = null;
  let serviceRequestComposerElement: HTMLElement | null = null;
  let activityStartInputElement: HTMLInputElement | null = null;
  let activityEndInputElement: HTMLInputElement | null = null;
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
    showCollectiveRequestComposer = false;
    showPhaseTwoComposer = false;
    showPhaseThreeComposer = false;
    showPhaseFiveComposer = false;
    selectedCollectiveRequestActivityId = null;
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

  $: phaseTabs = data.lifecycle.phases.map((phase): LifecycleTabItem => ({
    phase,
    title: phaseTabTitle(phase),
    progressLabel: phaseProgressLabel(phase),
    isFuture: isFuturePhase(phase)
  }));

  $: activePhaseProgressLabel = phaseProgressLabel(activePhase);

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

  function localDateTimeValue(date: Date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
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

  async function refreshAfter(action: () => Promise<void>) {
    await action();
    await invalidateAll();
  }

  function handlePhaseChangeRequest(targetPhaseId: ProjectLifecyclePhaseId, reason: string) {
    return refreshAfter(() => requestProjectPhaseChange(data.slug, targetPhaseId, reason));
  }

  function handlePhaseChangeVote(requestId: string, vote: ProjectApprovalVote | null) {
    return refreshAfter(() => setProjectPhaseChangeVote(data.slug, requestId, vote));
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
    const requiresSchedule =
      isCollectiveServiceProject(data.projectMode) || (data.lifecycle.requestSystem?.requiresSchedule ?? false);

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
    resetServiceRequestForm();
    showPersonalServiceRequestComposer = false;
    showCollectiveRequestComposer = false;
    selectedCollectiveRequestActivityId = null;
  }

  async function updateRequestStatus(requestId: string, status: ProjectServiceRequestStatus) {
    await refreshAfter(() => setProjectServiceRequestStatus(data.slug, requestId, status));
  }

  async function planServiceRequest(requestId: string, input: ProjectServiceRequestPlanInput) {
    await refreshAfter(() => planProjectServiceRequest(data.slug, requestId, input));
  }

  async function submitServiceRequestSettingsChange(input: ProjectServiceRequestSettingsChangeInput) {
    await refreshAfter(() => requestProjectServiceRequestSettingsChange(data.slug, input));
  }

  async function voteOnServiceRequestSettingsChange(
    requestId: string,
    vote: ProjectApprovalVote | null
  ) {
    await refreshAfter(() => setProjectServiceRequestSettingsChangeVote(data.slug, requestId, vote));
  }

  async function toggleServiceHistoryCompletion(
    historyId: string,
    role: ProjectServiceHistoryCompletionRole
  ) {
    await refreshAfter(() => toggleProjectServiceHistoryCompletion(data.slug, historyId, role));
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

      activityForm.scheduledAt = localDateTimeValue(now);
      activityForm.endsAt = localDateTimeValue(end);
    }
  }

  function resetServiceRequestForm() {
    serviceRequestForm = {
      title: '',
      body: '',
      scheduledAt: '',
      endsAt: ''
    };
  }

  function setDefaultServiceRequestTimes(isoDay?: string) {
    const requiresSchedule =
      isCollectiveServiceProject(data.projectMode) || (data.lifecycle.requestSystem?.requiresSchedule ?? false);

    if (!requiresSchedule) {
      if (!selectedCollectiveRequestActivityId) {
        serviceRequestForm.scheduledAt = '';
        serviceRequestForm.endsAt = '';
      }
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

      serviceRequestForm.scheduledAt = localDateTimeValue(now);
      serviceRequestForm.endsAt = localDateTimeValue(end);
    }
  }

  function setServiceRequestWindow(startAt: string, endsAt: string) {
    serviceRequestForm.scheduledAt = localDateTimeValue(new Date(startAt));
    serviceRequestForm.endsAt = localDateTimeValue(new Date(endsAt));
  }

  function scrollElementIntoComfortView(element: HTMLElement | null) {
    if (!browser || !element) {
      return;
    }

    const topOffset = 104;
    const targetTop = Math.max(0, window.scrollY + element.getBoundingClientRect().top - topOffset);

    window.scrollTo({ top: targetTop, behavior: 'smooth' });
  }

  function selectCalendarDay(isoDay: string) {
    setDefaultActivityTimes(isoDay);
  }

  async function openActivityComposerForDay(isoDay: string) {
    selectCalendarDay(isoDay);
    showCollectiveRequestComposer = false;
    selectedCollectiveRequestActivityId = null;
    showPhaseFiveComposer = true;
    await tick();
    scrollElementIntoComfortView(activityComposerElement);
  }

  async function openActivityComposer() {
    setDefaultActivityTimes();
    showCollectiveRequestComposer = false;
    selectedCollectiveRequestActivityId = null;
    showPhaseFiveComposer = true;
    await tick();
    scrollElementIntoComfortView(activityComposerElement);
  }

  async function openPersonalActivityComposer() {
    setDefaultActivityTimes();
    showPersonalActivityComposer = true;
    await tick();
    scrollElementIntoComfortView(activityComposerElement);
  }

  async function openPersonalServiceRequestComposerForDay(isoDay: string) {
    setDefaultServiceRequestTimes(isoDay);
    showPersonalServiceRequestComposer = true;
    await tick();
    scrollElementIntoComfortView(serviceRequestComposerElement);
  }

  async function openPersonalServiceRequestComposer() {
    setDefaultServiceRequestTimes();
    showPersonalServiceRequestComposer = true;
    await tick();
    scrollElementIntoComfortView(serviceRequestComposerElement);
  }

  async function openCollectiveServiceRequestComposer() {
    selectedCollectiveRequestActivityId = null;
    setDefaultServiceRequestTimes();
    showPhaseFiveComposer = false;
    showCollectiveRequestComposer = true;
    await tick();
    scrollElementIntoComfortView(serviceRequestComposerElement);
  }

  async function openCollectiveServiceRequestComposerForDay(isoDay: string) {
    selectedCollectiveRequestActivityId = null;
    setDefaultServiceRequestTimes(isoDay);
    showPhaseFiveComposer = false;
    showCollectiveRequestComposer = true;
    await tick();
    scrollElementIntoComfortView(serviceRequestComposerElement);
  }

  async function openCollectiveServiceRequestComposerForActivity(activityId: string) {
    const activity = data.lifecycle.phaseFive.activities.find((item) => item.id === activityId);

    selectedCollectiveRequestActivityId = activityId;
    if (activity) {
      setServiceRequestWindow(activity.startAt, activity.endAt);
    } else {
      setDefaultServiceRequestTimes();
    }

    showPhaseFiveComposer = false;
    showCollectiveRequestComposer = true;
    await tick();
    scrollElementIntoComfortView(serviceRequestComposerElement);
  }

  function closeCollectiveServiceRequestComposer() {
    showCollectiveRequestComposer = false;
    selectedCollectiveRequestActivityId = null;
    resetServiceRequestForm();
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
</script>

<section class="lifecycle-shell">
  <ProjectLifecyclePhaseTabs tabs={phaseTabs} {activePhaseId} {selectPhase} />

  <section class="phase-panel">
    <ProjectLifecycleMechanicsCard phase={activePhase} progressLabel={activePhaseProgressLabel} bind:showHowItWorks />

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
        requestServiceRequestSettingsChange={submitServiceRequestSettingsChange}
        voteOnRequestSettingsChange={voteOnServiceRequestSettingsChange}
        toggleHistoryCompletion={toggleServiceHistoryCompletion}
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
        bind:showRequestComposer={showCollectiveRequestComposer}
        productionForm={productionForm}
        distributionForm={distributionForm}
        activityForm={activityForm}
        serviceRequestForm={serviceRequestForm}
        {highlightedActivityId}
        bind:selectedRequestActivityId={selectedCollectiveRequestActivityId}
        bind:activityComposerElement
        bind:serviceRequestComposerElement
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
        openRequestComposer={openCollectiveServiceRequestComposer}
        openRequestComposerForDay={openCollectiveServiceRequestComposerForDay}
        openRequestComposerForActivity={openCollectiveServiceRequestComposerForActivity}
        closeRequestComposer={closeCollectiveServiceRequestComposer}
        focusActivityCard={focusActivityCard}
        planServiceRequest={planServiceRequest}
        submitActivity={submitActivity}
        submitServiceRequest={submitServiceRequest}
        updateRequestStatus={updateRequestStatus}
        updateActivityCommitment={updateActivityCommitment}
        requestServiceRequestSettingsChange={submitServiceRequestSettingsChange}
        voteOnRequestSettingsChange={voteOnServiceRequestSettingsChange}
        toggleHistoryCompletion={toggleServiceHistoryCompletion}
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

    <ProjectPhaseChangeSection
      data={data}
      {activePhaseId}
      requestPhaseChange={handlePhaseChangeRequest}
      voteOnPhaseChange={handlePhaseChangeVote}
    />
  </section>
</section>

<style>
  .lifecycle-shell,
  .phase-panel {
    display: grid;
    gap: 12px;
  }

  .phase-panel {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }
</style>
