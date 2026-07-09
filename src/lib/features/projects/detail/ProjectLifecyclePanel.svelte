<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { goto, invalidateAll } from '$app/navigation';
  import { refreshBootstrap } from '$lib/services/queries/bootstrap';
  import { localDateTimeInputToIso } from '$lib/utils/eventSchedule';
  import { tick } from 'svelte';
  import { preserveScrollDuring } from '$lib/utils/time';
  import { composeActivityLocationLabel, normalizedRoleRequirements } from '$lib/utils/activityCreationSteps';
  import ProductiveLifecycleContent from './lifecycle/productive/ProductiveLifecycleContent.svelte';
  import CollectiveServiceLifecycleContent from './lifecycle/collective-service/CollectiveServiceLifecycleContent.svelte';
  import IndividualServiceLifecycleContent from './lifecycle/individual-service/IndividualServiceLifecycleContent.svelte';
  import ProjectLifecycleMechanicsCard from './components/ProjectLifecycleMechanicsCard.svelte';
  import ProjectLifecyclePhaseTabs from './components/ProjectLifecyclePhaseTabs.svelte';
  import ProjectPhaseChangeSection from './components/ProjectPhaseChangeSection.svelte';
  import { scrollToPendingVote } from '$lib/utils/pendingVotes';
  import {
    isCollectiveServiceProject,
    isPersonalServiceProject
  } from '$lib/features/projects/projectMode';
  import { resolveProjectPhaseChangeVoteKind } from '$lib/utils/phaseChangeVotes';
  import {
    addProjectActivity,
    addProjectDistributionPlan,
    requestProjectMergeCapabilityChange,
    addProjectPullRequest,
    addProjectProductionPlan,
    updateProjectProductionPlan,
    requestProjectRepositoryReplacement,
    addProjectServiceRequest,
    addProjectValue,
    advanceProjectPhase,
    planProjectServiceRequest,
    recordProjectPullRequestMerge,
    revertProjectPhase,
    requestProjectPhaseChange,
    requestProjectServiceRequestSettingsChange,
    setProjectActivityCommitment,
    setProjectMergeCapabilityChangeVote,
    setProjectPhaseChangeVote,
    setProjectPlanOverallVote,
    setProjectPlanCriterionRating,
    setProjectPlanValueVote,
    setProjectPullRequestVote,
    setProjectRepositoryReplacementVote,
    setProjectServiceRequestSettingsChangeVote,
    setProjectServiceRequestStatus,
    toggleProjectServiceHistoryCompletion,
    setProjectValueImportance
  } from '$lib/services/queries/details';
  import type { ProjectSubtype } from '$lib/types/feed';
  import type {
    ProjectActivityRoleInput,
    ProjectServiceHistoryCompletionChoice,
    ProjectServiceHistoryCompletionRole,
    ProjectApprovalVote,
    ProjectImportanceVoteValue,
    ProjectLifecyclePhase,
    ProjectLifecyclePhaseId,
    ProjectPhaseChangeRequestOptions,
    ProjectPageData,
    ProjectSoftwareMergeCapabilityChangeInput,
    ProjectSoftwareRepositoryReplacementInput,
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
  export let votesRenderedInHub = false;

  export let autoExpandVoteCards = false;
  export let autoExpandVoteKind: string | null = null;
  export let autoExpandVoteTarget: string | null = null;
  export let autoAssess = false;
  export let autoAssessCriterionId: string | null = null;
  export let participationAssessPlanId: string | null = null;
  export let participationAssessCriterionId: string | null = null;

  type DraftPlanPhase = {
    title: string;
    details: string;
    materials: string[];
  };

  type DraftProductionForm = {
    title: string;
    description: string;
    projectSubtype: ProjectSubtype;
    repositoryUrl: string;
    demandConsiderationNote: string;
    valueConsiderationNotes: Record<string, string>;
    planPhases: DraftPlanPhase[];
    validationMessages: string[];
  };

  type DraftDistributionForm = {
    title: string;
    description: string;
    demandConsiderationNote: string;
    valueConsiderationNotes: Record<string, string>;
    planPhases: DraftPlanPhase[];
    requestSystemEnabled: boolean;
    requestMode: 'calendar' | 'direct' | 'both';
    allowOffScheduleRequests: boolean;
    validationMessages: string[];
  };

  let draftEntityCounter = 0;

  function nextDraftId(prefix: string) {
    draftEntityCounter += 1;
    return `${prefix}-${draftEntityCounter}`;
  }

  function createDraftPlanPhase(): DraftPlanPhase {
    return {
      title: '',
      details: '',
      materials: []
    };
  }

  function materialListLabel(phase: DraftPlanPhase) {
    const normalized = phase.materials.map((material) => material.trim()).filter(Boolean);

    return normalized.join(', ');
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

  function projectPlanPhaseHasAnyInput(phase: DraftPlanPhase) {
    return !!phase.title.trim() || !!phase.details.trim() || phase.materials.length > 0;
  }

  function projectPlanPhaseIsComplete(phase: DraftPlanPhase) {
    return !!phase.title.trim() && !!phase.details.trim();
  }

  function validateProjectPlanForm(
    form: {
      title: string;
      description: string;
      demandConsiderationNote: string;
      planPhases: DraftPlanPhase[];
      projectSubtype?: ProjectSubtype;
      repositoryUrl?: string;
    },
    options: {
      requireSoftwareRepository?: boolean;
      distributionLockedToSoftware?: boolean;
    } = {}
  ) {
    const validationMessages: string[] = [];
    const hasAnyCompleteStage = form.planPhases.some(projectPlanPhaseIsComplete);
    const hasPartialStage = form.planPhases.some(
      (phase) => projectPlanPhaseHasAnyInput(phase) && !projectPlanPhaseIsComplete(phase)
    );
    if (!form.title.trim()) {
      validationMessages.push('Add a plan title.');
    }

    if (!form.description.trim()) {
      validationMessages.push('Add a plan description.');
    }

    if (!form.demandConsiderationNote.trim()) {
      validationMessages.push('Explain how this plan responds to the current demand signal.');
    }

    if (options.requireSoftwareRepository && !form.repositoryUrl?.trim()) {
      validationMessages.push('Add the official repository URL for software plans.');
    }

    if (options.distributionLockedToSoftware) {
      validationMessages.push(
        'Software projects use the automatic open-source distribution path and do not accept distribution plans here.'
      );
    }

    if (!hasAnyCompleteStage) {
      validationMessages.push('Add at least one stage with a title and description.');
    } else if (hasPartialStage) {
      validationMessages.push('Finish every stage you start. Each stage needs a title and description.');
    }

    return validationMessages;
  }

  function resetProductionForm(): DraftProductionForm {
    return {
      title: '',
      description: '',
      projectSubtype: 'standard',
      repositoryUrl: '',
      demandConsiderationNote: '',
      valueConsiderationNotes: {},
      planPhases: [createDraftPlanPhase()],
      validationMessages: []
    };
  }

  function resetDistributionForm(): DraftDistributionForm {
    return {
      title: '',
      description: '',
      demandConsiderationNote: '',
      valueConsiderationNotes: {},
      planPhases: [createDraftPlanPhase()],
      requestSystemEnabled: false,
      requestMode: 'both',
      allowOffScheduleRequests: false,
      validationMessages: []
    };
  }

  function resolvedActivePhaseId(phaseId: ProjectLifecyclePhaseId): ProjectLifecyclePhaseId {
    if (phaseId === 'phase-4') {
      return 'phase-3';
    }

    if (phaseId === 'phase-6') {
      return 'phase-5';
    }

    return phaseId;
  }

  let activePhaseId: ProjectLifecyclePhaseId = resolvedActivePhaseId(data.lifecycle.currentPhaseId);
  let lastCurrentPhaseId = data.lifecycle.currentPhaseId;
  let lastProjectSlug = data.slug;
  let draftValue = '';
  let productionForm: DraftProductionForm = resetProductionForm();
  let distributionForm: DraftDistributionForm = resetDistributionForm();
  let editingProductionPlanId: string | null = null;
  let activityForm = {
    title: '',
    scheduledAt: '',
    endsAt: '',
    isOnline: false,
    locationLabel: '',
    onlineDetail: '',
    roleRequirements: [createDraftActivityRole()],
    linkedPlanPhaseId: '' as string | null,
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
  let highlightedRequestId: string | null = null;
  let selectedCollectiveRequestActivityId: string | null = null;
  let activityHighlightResetHandle: ReturnType<typeof setTimeout> | null = null;
  let requestHighlightResetHandle: ReturnType<typeof setTimeout> | null = null;
  let lastActivityTargetId: string | null = null;
  let lastRequestTargetId: string | null = null;
  let lastVoteTargetSignature = '';
  let activityComposerElement: HTMLElement | null = null;
  let serviceRequestComposerElement: HTMLElement | null = null;
  let activityStartInputElement: HTMLInputElement | null = null;
  let activityEndInputElement: HTMLInputElement | null = null;
  let lastHowItWorksPhaseId = activePhaseId;
  let visibleLifecyclePhases: ProjectLifecyclePhase[] = data.lifecycle.phases ?? [];

  function phaseOrder(phaseId: ProjectLifecyclePhaseId) {
    return visibleLifecyclePhases.find((phase) => phase.id === phaseId)?.order ?? 1;
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

  function readRequestTarget(url: URL) {
    if (url.hash.startsWith('#request-card-')) {
      return url.hash.slice('#request-card-'.length) || null;
    }

    if (url.hash.startsWith('#request-')) {
      return url.hash.slice('#request-'.length) || null;
    }

    return url.searchParams.get('request');
  }

  function phaseContainingPlan(planId: string): 'phase-2' | 'phase-3' | null {
    if (data.lifecycle.phaseTwo?.plans?.some((plan) => plan.id === planId)) {
      return 'phase-2';
    }

    if (data.lifecycle.phaseThree?.plans?.some((plan) => plan.id === planId)) {
      return 'phase-3';
    }

    return null;
  }

  function phaseChangeVoteGroup(requestId: string): 'return' | 'advance' | 'close' | null {
    const request = data.lifecycle.phaseChangeRequests.find((item) => item.id === requestId);
    if (!request) {
      return null;
    }

    return resolveProjectPhaseChangeVoteKind(
      request,
      data.projectMode,
      data.lifecycle.currentPhaseId,
      data.lifecycle.phases
    );
  }

  function scrollVoteCardIntoView(voteKind: string, voteTarget: string) {
    if (!browser) return;
    scrollToPendingVote(voteKind, voteTarget);
  }

  async function focusVoteCard(voteKind: string, voteTarget: string) {
    if (voteKind === 'plan') {
      const planPhase = phaseContainingPlan(voteTarget);
      if (planPhase === 'phase-2') {
        activePhaseId = 'phase-2';
        if (!expandedPhaseTwoPlanIds.includes(voteTarget)) {
          expandedPhaseTwoPlanIds = [...expandedPhaseTwoPlanIds, voteTarget];
        }
      } else if (planPhase === 'phase-3') {
        activePhaseId = 'phase-3';
        if (!expandedPhaseThreePlanIds.includes(voteTarget)) {
          expandedPhaseThreePlanIds = [...expandedPhaseThreePlanIds, voteTarget];
        }
      }
    } else if (voteKind === 'phase_change') {
      activePhaseId = resolvedActivePhaseId(data.lifecycle.currentPhaseId);
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

  $: currentPhaseOrder = phaseOrder(resolvedActivePhaseId(data.lifecycle.currentPhaseId));
  $: visibleLifecyclePhases = data.lifecycle.phases ?? [];

  $: if (data.slug !== lastProjectSlug) {
    lastProjectSlug = data.slug;
    lastCurrentPhaseId = data.lifecycle.currentPhaseId;
    activePhaseId = resolvedActivePhaseId(data.lifecycle.currentPhaseId);
    showPhaseOneComposer = false;
    showPersonalActivityComposer = false;
    showPersonalServiceRequestComposer = false;
    showCollectiveRequestComposer = false;
    showPhaseTwoComposer = false;
    showPhaseThreeComposer = false;
    showPhaseFiveComposer = false;
    editingProductionPlanId = null;
    selectedCollectiveRequestActivityId = null;
    expandedPhaseTwoPlanIds = [];
    expandedPhaseThreePlanIds = [];
    expandedActivityIds = [];
    highlightedActivityId = null;
    highlightedRequestId = null;
  }

  $: if (lastCurrentPhaseId !== data.lifecycle.currentPhaseId) {
    lastCurrentPhaseId = data.lifecycle.currentPhaseId;
    activePhaseId = resolvedActivePhaseId(data.lifecycle.currentPhaseId);
    showPhaseOneComposer = false;
    showPersonalActivityComposer = false;
    showPersonalServiceRequestComposer = false;
    showCollectiveRequestComposer = false;
    showPhaseTwoComposer = false;
    showPhaseThreeComposer = false;
    showPhaseFiveComposer = false;
    editingProductionPlanId = null;
    selectedCollectiveRequestActivityId = null;
    expandedPhaseTwoPlanIds = [];
    expandedPhaseThreePlanIds = [];
    expandedActivityIds = [];
    if (activityHighlightResetHandle) {
      clearTimeout(activityHighlightResetHandle);
      activityHighlightResetHandle = null;
    }
    if (requestHighlightResetHandle) {
      clearTimeout(requestHighlightResetHandle);
      requestHighlightResetHandle = null;
    }
    highlightedActivityId = null;
    highlightedRequestId = null;
  }

  $: activePhase =
    visibleLifecyclePhases.find((phase) => phase.id === activePhaseId) ??
    visibleLifecyclePhases.find((phase) => phase.id === resolvedActivePhaseId(data.lifecycle.currentPhaseId)) ??
    visibleLifecyclePhases[0] ?? {
      id: resolvedActivePhaseId(data.lifecycle.currentPhaseId),
      order: 1,
      shortLabel: 'P1',
      title: data.stage,
      summary: '',
      progressState: 'current',
      projectStatus: 'active',
      mechanics: []
    };
  $: targetedPhaseChangeGroup =
    autoExpandVoteCards && autoExpandVoteKind === 'phase_change' && autoExpandVoteTarget
      ? phaseChangeVoteGroup(autoExpandVoteTarget)
      : null;
  $: resolvedAutoAssessPlanId =
    autoAssess && autoExpandVoteKind === 'plan' ? autoExpandVoteTarget : participationAssessPlanId;
  $: resolvedAutoAssessCriterionId = autoAssessCriterionId ?? participationAssessCriterionId;

  $: if (lastHowItWorksPhaseId !== activePhaseId) {
    lastHowItWorksPhaseId = activePhaseId;
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

  $: if (!showPhaseTwoComposer && productionForm.validationMessages.length > 0) {
    productionForm = {
      ...productionForm,
      validationMessages: []
    };
  }

  $: if (!showPhaseThreeComposer && distributionForm.validationMessages.length > 0) {
    distributionForm = {
      ...distributionForm,
      validationMessages: []
    };
  }

  $: phaseTabs = visibleLifecyclePhases.map((phase): LifecycleTabItem => ({
    phase,
    title: phaseTabTitle(phase),
    progressLabel: phaseProgressLabel(phase),
    isFuture: isFuturePhase(phase)
  }));

  $: lifecycleContentPhaseId = resolvedActivePhaseId(activePhaseId);
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

  $: {
    const requestTargetId = readRequestTarget($page.url);

    if (!requestTargetId) {
      lastRequestTargetId = null;
    } else if (requestTargetId !== lastRequestTargetId) {
      lastRequestTargetId = requestTargetId;
      activePhaseId = isPersonalServiceProject(data.projectMode) ? 'phase-1' : 'phase-5';
      void focusRequestCard(requestTargetId);
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
    return phase.title;
  }

  async function refreshAfter(action: () => Promise<void>) {
    await action();
    await Promise.all([invalidateAll(), refreshBootstrap()]);
  }

  function handlePhaseChangeRequest(
    targetPhaseId: ProjectLifecyclePhaseId,
    reason: string,
    options?: ProjectPhaseChangeRequestOptions
  ) {
    return refreshAfter(() => requestProjectPhaseChange(data.slug, targetPhaseId, reason, options));
  }

  function handlePhaseChangeVote(requestId: string, vote: ProjectApprovalVote | null) {
    return refreshAfter(() => setProjectPhaseChangeVote(data.slug, requestId, vote));
  }

  function handleProjectValueVote(valueId: string, voteValue: ProjectImportanceVoteValue) {
    return preserveScrollDuring(() =>
      refreshAfter(() => setProjectValueImportance(data.slug, valueId, voteValue))
    );
  }

  function handlePhaseTwoPlanCriterionRating(
    planId: string,
    criterionId: string,
    rating: import('$lib/types/detail').PlanCriterionRating | null
  ) {
    return preserveScrollDuring(() =>
      refreshAfter(() => setProjectPlanCriterionRating(data.slug, planId, criterionId, rating))
    );
  }

  function handlePhaseThreePlanCriterionRating(
    planId: string,
    criterionId: string,
    rating: import('$lib/types/detail').PlanCriterionRating | null
  ) {
    return preserveScrollDuring(() =>
      refreshAfter(() => setProjectPlanCriterionRating(data.slug, planId, criterionId, rating))
    );
  }

  function handlePhaseTwoPlanValueVote(
    planId: string,
    valueId: string,
    vote: ProjectApprovalVote | null
  ) {
    return preserveScrollDuring(() =>
      refreshAfter(() => setProjectPlanValueVote(data.slug, 'phase-2', planId, valueId, vote))
    );
  }

  function handlePhaseTwoPlanOverallVote(planId: string, vote: ProjectApprovalVote | null) {
    return preserveScrollDuring(() =>
      refreshAfter(() => setProjectPlanOverallVote(data.slug, 'phase-2', planId, vote))
    );
  }

  function handlePhaseThreePlanValueVote(
    planId: string,
    valueId: string,
    vote: ProjectApprovalVote | null
  ) {
    return preserveScrollDuring(() =>
      refreshAfter(() => setProjectPlanValueVote(data.slug, 'phase-3', planId, valueId, vote))
    );
  }

  function handlePhaseThreePlanOverallVote(planId: string, vote: ProjectApprovalVote | null) {
    return preserveScrollDuring(() =>
      refreshAfter(() => setProjectPlanOverallVote(data.slug, 'phase-3', planId, vote))
    );
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
    const validationMessages = validateProjectPlanForm(productionForm, {
      requireSoftwareRepository: productionForm.projectSubtype === 'software'
    });

    if (validationMessages.length > 0) {
      productionForm = {
        ...productionForm,
        validationMessages
      };
      return;
    }

    const planPhases = productionForm.planPhases
      .filter(projectPlanPhaseIsComplete)
      .map((phase) => ({
        title: phase.title,
        details: phase.details,
        materialsLabel: materialListLabel(phase),
        costLabel: 'Cost moved to acquisition'
      }));
    const input = {
      title: productionForm.title,
      description: productionForm.description,
      projectSubtype: productionForm.projectSubtype,
      repositoryUrl:
        productionForm.projectSubtype === 'software' ? productionForm.repositoryUrl : undefined,
      demandConsiderationNote: productionForm.demandConsiderationNote,
      valueConsiderationNotes: productionForm.valueConsiderationNotes,
      totalCostLabel: 'Cost moved to acquisition',
      planPhases
    };
    const created = editingProductionPlanId
      ? await updateProjectProductionPlan(data.slug, editingProductionPlanId, input)
      : await addProjectProductionPlan(data.slug, input, data.projectMode);

    if (!created.ok) {
      productionForm = {
        ...productionForm,
        validationMessages: [
          created.error ??
            (editingProductionPlanId
              ? 'This production plan could not be updated from the current state.'
              : 'This production plan could not be submitted from the current state.')
        ]
      };
      return;
    }

    await Promise.all([invalidateAll(), refreshBootstrap()]);
    productionForm = resetProductionForm();
    editingProductionPlanId = null;
    showPhaseTwoComposer = false;
  }

  async function submitDistributionPlan() {
    const validationMessages = validateProjectPlanForm(distributionForm, {
      distributionLockedToSoftware: data.lifecycle.currentSubtype === 'software'
    });

    if (validationMessages.length > 0) {
      distributionForm = {
        ...distributionForm,
        validationMessages
      };
      return;
    }

    const planPhases = distributionForm.planPhases
      .filter(projectPlanPhaseIsComplete)
      .map((phase) => ({
        title: phase.title,
        details: phase.details,
        materialsLabel: materialListLabel(phase),
        costLabel: 'Cost moved to acquisition'
      }));
    const created = await addProjectDistributionPlan(
      data.slug,
      {
        title: distributionForm.title,
        description: distributionForm.description,
        demandConsiderationNote: distributionForm.demandConsiderationNote,
        valueConsiderationNotes: distributionForm.valueConsiderationNotes,
        totalCostLabel: 'Cost moved to acquisition',
        planPhases,
        requestSystemEnabled: distributionForm.requestSystemEnabled,
        requestMode: distributionForm.requestMode,
        allowOffScheduleRequests: distributionForm.allowOffScheduleRequests
      },
      data.projectMode
    );

    if (!created.ok) {
      distributionForm = {
        ...distributionForm,
        validationMessages: [created.error ?? 'This distribution plan could not be submitted from the current state.']
      };
      return;
    }

    await Promise.all([invalidateAll(), refreshBootstrap()]);
    distributionForm = resetDistributionForm();
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
          scheduledAt: localDateTimeInputToIso(scheduledAtValue),
          endsAt: localDateTimeInputToIso(endsAtValue),
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
        isOnline: false,
        locationLabel: '',
        onlineDetail: '',
        roleRequirements: [createDraftActivityRole()],
        linkedPlanPhaseId: '',
        note: ''
      };
      showPersonalActivityComposer = false;
      return;
    }

    const roleRequirements = normalizedRoleRequirements(activityForm.roleRequirements);
    const locationLabel = composeActivityLocationLabel(activityForm);

    if (
      !activityForm.title.trim() ||
      !scheduledAtValue ||
      !endsAtValue ||
      !locationLabel ||
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
        scheduledAt: localDateTimeInputToIso(scheduledAtValue),
        endsAt: localDateTimeInputToIso(endsAtValue),
        isOnline: activityForm.isOnline,
        locationLabel,
        roleRequirements,
        linkedPlanPhaseId: activityForm.linkedPlanPhaseId || null,
        note: activityForm.note
      })
    );
    activityForm = {
      title: '',
      scheduledAt: '',
      endsAt: '',
      isOnline: false,
      locationLabel: '',
      onlineDetail: '',
      roleRequirements: [createDraftActivityRole()],
      linkedPlanPhaseId: '',
      note: ''
    };
    showPersonalActivityComposer = false;
    showPhaseFiveComposer = false;
  }

  let serviceRequestFeedback = '';

  async function submitServiceRequest() {
    const scheduledAtValue = serviceRequestForm.scheduledAt;
    const endsAtValue = serviceRequestForm.endsAt;
    const requiresSchedule =
      isCollectiveServiceProject(data.projectMode) || (data.lifecycle.requestSystem?.requiresSchedule ?? false);
    const usesScheduledRequest =
      requiresSchedule || !!(scheduledAtValue && endsAtValue);

    serviceRequestFeedback = '';

    if (!serviceRequestForm.title.trim() || !serviceRequestForm.body.trim()) {
      serviceRequestFeedback = 'Add a title and message for your request.';
      return;
    }

    if (
      usesScheduledRequest &&
      (!scheduledAtValue ||
        !endsAtValue ||
        new Date(endsAtValue).getTime() <= new Date(scheduledAtValue).getTime())
    ) {
      serviceRequestFeedback = 'Choose a valid start and end time for your request.';
      return;
    }

    await refreshAfter(async () => {
      await addProjectServiceRequest(data.slug, {
        title: serviceRequestForm.title,
        body: serviceRequestForm.body,
        scheduledAt: scheduledAtValue ? localDateTimeInputToIso(scheduledAtValue) : undefined,
        endsAt: endsAtValue ? localDateTimeInputToIso(endsAtValue) : undefined
      });
    });
    resetServiceRequestForm();
    showPersonalServiceRequestComposer = false;
    showCollectiveRequestComposer = false;
    selectedCollectiveRequestActivityId = null;
    serviceRequestFeedback = 'Request sent. The project owner can review it from the overview.';
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
    role: ProjectServiceHistoryCompletionRole,
    selection?: ProjectServiceHistoryCompletionChoice
  ) {
    await refreshAfter(() =>
      toggleProjectServiceHistoryCompletion(data.slug, historyId, role, selection)
    );
  }

  async function advancePhase(closeNote?: string) {
    await refreshAfter(() => advanceProjectPhase(data.slug, closeNote));
  }

  async function revertPhase(
    targetPhaseId: Extract<ProjectLifecyclePhaseId, 'phase-1' | 'phase-2' | 'phase-3'>,
    reason: string
  ) {
    await refreshAfter(() => revertProjectPhase(data.slug, targetPhaseId, reason));
  }

  async function submitSoftwarePullRequest(input: import('$lib/types/detail').ProjectSoftwarePullRequestInput) {
    await refreshAfter(() => addProjectPullRequest(data.slug, input));
  }

  async function submitSoftwareMergeCapabilityChange(
    input: ProjectSoftwareMergeCapabilityChangeInput
  ) {
    await refreshAfter(() => requestProjectMergeCapabilityChange(data.slug, input));
  }

  async function submitSoftwareRepositoryReplacement(
    input: ProjectSoftwareRepositoryReplacementInput
  ) {
    await refreshAfter(() => requestProjectRepositoryReplacement(data.slug, input));
  }

  async function recordSoftwarePullRequestMerge(requestId: string, mergeId: string) {
    await refreshAfter(() => recordProjectPullRequestMerge(data.slug, requestId, mergeId));
  }

  async function voteSoftwarePullRequest(requestId: string, vote: ProjectApprovalVote | null) {
    await refreshAfter(() => setProjectPullRequestVote(data.slug, requestId, vote));
  }

  async function voteSoftwareMergeCapabilityChange(requestId: string, vote: ProjectApprovalVote | null) {
    await refreshAfter(() => setProjectMergeCapabilityChangeVote(data.slug, requestId, vote));
  }

  async function voteSoftwareRepositoryReplacement(requestId: string, vote: ProjectApprovalVote | null) {
    await refreshAfter(() => setProjectRepositoryReplacementVote(data.slug, requestId, vote));
  }

  function addProductionPlanPhase() {
    productionForm.planPhases = [...productionForm.planPhases, createDraftPlanPhase()];
  }

  function removeProductionPlanPhase(index: number) {
    productionForm.planPhases = productionForm.planPhases.filter((_, phaseIndex) => phaseIndex !== index);
  }

  function openProductionPlanEditor(planId: string) {
    const plan = data.lifecycle.phaseTwo.plans.find((item) => item.id === planId);

    if (!plan || !plan.viewerCanEdit) {
      return;
    }

    editingProductionPlanId = plan.id;
    productionForm = {
      title: plan.title,
      description: plan.description,
      projectSubtype: plan.projectSubtype,
      repositoryUrl: plan.repositoryUrl ?? '',
      demandConsiderationNote: plan.demandConsiderationNote,
      valueConsiderationNotes: plan.valueConsiderationNotes ?? {},
      planPhases: plan.planPhases.map((phase) => ({
        title: phase.title,
        details: phase.details,
        materials: phase.materialsLabel
          .split(/\r?\n|,|;/)
          .map((material) => material.trim())
          .filter(Boolean)
      })),
      validationMessages: []
    };
    showPhaseTwoComposer = true;
  }

  function cancelProductionPlanEdit() {
    editingProductionPlanId = null;
    productionForm = resetProductionForm();
    showPhaseTwoComposer = false;
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

  function firstActivityOnDay(isoDay: string) {
    return data.lifecycle.phaseFive.activities
      .filter((activity) => activity.startAt.startsWith(isoDay))
      .sort((left, right) => +new Date(left.startAt) - +new Date(right.startAt))[0];
  }

  function setDefaultActivityTimes(isoDay?: string) {
    if (isoDay) {
      const firstActivity = firstActivityOnDay(isoDay);

      if (firstActivity) {
        activityForm.scheduledAt = localDateTimeValue(new Date(firstActivity.startAt));
        activityForm.endsAt = localDateTimeValue(new Date(firstActivity.endAt));
        return;
      }

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
      const firstActivity = firstActivityOnDay(isoDay);

      if (firstActivity) {
        serviceRequestForm.scheduledAt = localDateTimeValue(new Date(firstActivity.startAt));
        serviceRequestForm.endsAt = localDateTimeValue(new Date(firstActivity.endAt));
        return;
      }

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
  }

  async function openActivityComposer() {
    setDefaultActivityTimes();
    showCollectiveRequestComposer = false;
    selectedCollectiveRequestActivityId = null;
    showPhaseFiveComposer = true;
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
      block: 'center'
    });
  }

  function openActivityDetails(activityId: string) {
    if (!browser) {
      return;
    }

    const details = document.getElementById(`activity-${activityId}`);

    if (details instanceof HTMLDetailsElement) {
      details.open = true;
    }
  }

  function scrollRequestCardIntoView(requestId: string) {
    if (!browser) {
      return;
    }

    document.getElementById(`request-card-${requestId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  function openRequestDetails(requestId: string) {
    if (!browser) {
      return;
    }

    const details = document.getElementById(`request-${requestId}`);

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

  async function focusRequestCard(requestId: string) {
    if (requestHighlightResetHandle) {
      clearTimeout(requestHighlightResetHandle);
    }

    highlightedRequestId = requestId;
    await tick();
    openRequestDetails(requestId);
    scrollRequestCardIntoView(requestId);

    if (browser) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          openRequestDetails(requestId);
          scrollRequestCardIntoView(requestId);
        });
      });
    }

    requestHighlightResetHandle = setTimeout(() => {
      if (highlightedRequestId === requestId) {
        highlightedRequestId = null;
      }
      requestHighlightResetHandle = null;
    }, 1800);
  }
</script>

<section class="lifecycle-shell">
  <ProjectLifecyclePhaseTabs tabs={phaseTabs} {activePhaseId} {selectPhase} />

  <section class="phase-panel">
    <ProjectLifecycleMechanicsCard phase={activePhase} progressLabel={activePhaseProgressLabel} />

    {#if isPersonalServiceProject(data.projectMode)}
      <IndividualServiceLifecycleContent
        data={data}
        activePhaseId={lifecycleContentPhaseId}
        activityForm={activityForm}
        serviceRequestForm={serviceRequestForm}
        bind:showPersonalActivityComposer
        bind:showPersonalServiceRequestComposer
        bind:activityComposerElement
        bind:serviceRequestComposerElement
        bind:activityStartInputElement
        bind:activityEndInputElement
        {highlightedActivityId}
        {highlightedRequestId}
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
        activePhaseId={lifecycleContentPhaseId}
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
        serviceRequestFeedback={serviceRequestFeedback}
        {highlightedActivityId}
        {highlightedRequestId}
        bind:selectedRequestActivityId={selectedCollectiveRequestActivityId}
        bind:activityComposerElement
        bind:serviceRequestComposerElement
        submitValue={submitValue}
        setProjectValueVote={handleProjectValueVote}
        addProductionPlanPhase={addProductionPlanPhase}
        submitProductionPlan={submitProductionPlan}
        editingProductionPlanId={editingProductionPlanId}
        startEditingProductionPlan={openProductionPlanEditor}
        cancelEditingProductionPlan={cancelProductionPlanEdit}
        setPhaseTwoPlanOverallVote={handlePhaseTwoPlanOverallVote}
        setPhaseTwoPlanCriterionRating={handlePhaseTwoPlanCriterionRating}
        addDistributionPlanPhase={addDistributionPlanPhase}
        submitDistributionPlan={submitDistributionPlan}
        setPhaseThreePlanOverallVote={handlePhaseThreePlanOverallVote}
        setPhaseThreePlanCriterionRating={handlePhaseThreePlanCriterionRating}
        isExpandedPlan={isExpandedPlan}
        autoAssessPlanId={resolvedAutoAssessPlanId}
        autoAssessCriterionId={resolvedAutoAssessCriterionId}
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
        createPullRequest={submitSoftwarePullRequest}
        requestMergeCapabilityChange={submitSoftwareMergeCapabilityChange}
        requestRepositoryReplacement={submitSoftwareRepositoryReplacement}
        recordPullRequestMerge={recordSoftwarePullRequestMerge}
        votePullRequest={voteSoftwarePullRequest}
        voteMergeCapabilityChange={voteSoftwareMergeCapabilityChange}
        voteRepositoryReplacement={voteSoftwareRepositoryReplacement}
        toggleHistoryCompletion={toggleServiceHistoryCompletion}
      />
    {:else}
      <ProductiveLifecycleContent
        data={data}
        activePhaseId={lifecycleContentPhaseId}
        {importanceOptions}
        bind:draftValue
        bind:showPhaseOneComposer
        bind:showPhaseTwoComposer
        bind:showPhaseThreeComposer
        bind:showPhaseFiveComposer
        productionForm={productionForm}
        distributionForm={distributionForm}
        activityForm={activityForm}
        {highlightedActivityId}
        bind:activityComposerElement
        submitValue={submitValue}
        setProjectValueVote={handleProjectValueVote}
        addProductionPlanPhase={addProductionPlanPhase}
        submitProductionPlan={submitProductionPlan}
        editingProductionPlanId={editingProductionPlanId}
        startEditingProductionPlan={openProductionPlanEditor}
        cancelEditingProductionPlan={cancelProductionPlanEdit}
        setPhaseTwoPlanOverallVote={handlePhaseTwoPlanOverallVote}
        setPhaseTwoPlanCriterionRating={handlePhaseTwoPlanCriterionRating}
        addDistributionPlanPhase={addDistributionPlanPhase}
        submitDistributionPlan={submitDistributionPlan}
        setPhaseThreePlanOverallVote={handlePhaseThreePlanOverallVote}
        setPhaseThreePlanCriterionRating={handlePhaseThreePlanCriterionRating}
        isExpandedPlan={isExpandedPlan}
        autoAssessPlanId={resolvedAutoAssessPlanId}
        autoAssessCriterionId={resolvedAutoAssessCriterionId}
        openActivityComposer={openActivityComposer}
        openActivityComposerForDay={openActivityComposerForDay}
        focusActivityCard={focusActivityCard}
        submitActivity={submitActivity}
        updateActivityCommitment={updateActivityCommitment}
        createPullRequest={submitSoftwarePullRequest}
        requestMergeCapabilityChange={submitSoftwareMergeCapabilityChange}
        requestRepositoryReplacement={submitSoftwareRepositoryReplacement}
        recordPullRequestMerge={recordSoftwarePullRequestMerge}
        votePullRequest={voteSoftwarePullRequest}
        voteMergeCapabilityChange={voteSoftwareMergeCapabilityChange}
        voteRepositoryReplacement={voteSoftwareRepositoryReplacement}
        toggleHistoryCompletion={toggleServiceHistoryCompletion}
      />
    {/if}

    <ProjectPhaseChangeSection
      data={data}
      {activePhaseId}
      {advancePhase}
      {revertPhase}
      requestPhaseChange={handlePhaseChangeRequest}
      voteOnPhaseChange={handlePhaseChangeVote}
      autoExpandVoteGroup={targetedPhaseChangeGroup}
      {votesRenderedInHub}
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
