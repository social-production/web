import { isPersonalServiceProject, isProductiveProject, skipsDistributionPhase, supportsProjectDemandSignals } from '$lib/features/projects/projectMode';
import type { EventPageData, EventPlan, ProjectPageData, ProjectServiceHistoryItem } from '$lib/types/detail';
import { canProposeEventActivity } from '$lib/utils/eventSchedule';
import {
  activateParticipationActivityPhase,
  focusActivitySignupTargets,
  focusHistoryFollowUpTargets,
  getHistoryItemsNeedingFollowUp
} from '$lib/utils/participationActivityFocus';
import { pendingVoteCardId, type PendingVoteItem } from '$lib/utils/pendingVotes';

export {
  activateParticipationActivityPhase,
  focusActivitySignupTargets,
  focusHistoryFollowUpTargets,
  getHistoryItemsNeedingFollowUp
};

export interface ParticipationStep {
  id: string;
  label: string;
  done: boolean;
  helper?: string;
}

export interface ParticipationStepOptions {
  signalRemovalNudge?: boolean;
  viewerUsername?: string | null;
}

function valuesRated(values: { activeImportanceVote: number }[]) {
  if (values.length === 0) {
    return false;
  }

  return values.every((value) => value.activeImportanceVote > 0);
}

function isProposalPhase(data: ProjectPageData | EventPageData) {
  if ('projectMode' in data) {
    return data.lifecycle.currentPhaseId === 'phase-1';
  }

  return data.lifecycle.currentPhaseId === 'proposal';
}

function isPlanPhase(data: ProjectPageData | EventPageData) {
  if ('projectMode' in data) {
    return data.lifecycle.currentPhaseId === 'phase-2' || data.lifecycle.currentPhaseId === 'phase-3';
  }

  return data.lifecycle.currentPhaseId === 'event-plan';
}

function isActivityPhase(data: ProjectPageData | EventPageData) {
  if ('projectMode' in data) {
    return data.lifecycle.currentPhaseId === 'phase-5';
  }

  return data.lifecycle.currentPhaseId === 'activity';
}

function viewerHasAdvanceProposal(data: ProjectPageData | EventPageData, viewerUsername: string | null) {
  if (!viewerUsername) {
    return false;
  }

  return data.lifecycle.phaseChangeRequests.some(
    (request) =>
      request.authorUsername === viewerUsername &&
      (request.kind === 'advance' || request.kind === 'close')
  );
}

function projectAdvancementGatePasses(data: ProjectPageData) {
  const phaseId = data.lifecycle.currentPhaseId;

  if (phaseId === 'phase-1') {
    return data.lifecycle.phaseOne?.signalSummary?.advancementUnlocked ?? false;
  }

  if (phaseId === 'phase-2') {
    return (
      !!data.lifecycle.phaseTwo.winningPlanId ||
      data.lifecycle.phaseTwo.plans.some(
        (plan) => plan.leaderStatus === 'leading' || plan.leaderStatus === 'tied'
      )
    );
  }

  if (phaseId === 'phase-3') {
    if (skipsDistributionPhase(data.projectMode, data.projectSubtype)) {
      return true;
    }

    return (
      !!data.lifecycle.phaseThree.winningPlanId ||
      data.lifecycle.phaseThree.plans.some(
        (plan) => plan.leaderStatus === 'leading' || plan.leaderStatus === 'tied'
      )
    );
  }

  return true;
}

function eventAdvancementGatePasses(data: EventPageData) {
  const phaseId = data.lifecycle.currentPhaseId;

  if (phaseId === 'proposal') {
    return data.lifecycle.phaseOne?.signalSummary?.advancementUnlocked ?? false;
  }

  if (phaseId === 'event-plan') {
    return (
      !!data.lifecycle.phaseTwo.winningPlanId ||
      data.lifecycle.phaseTwo.plans.some(
        (plan) => plan.leaderStatus === 'leading' || plan.leaderStatus === 'tied'
      )
    );
  }

  return true;
}

function advancementGatePasses(data: ProjectPageData | EventPageData) {
  if ('projectMode' in data) {
    return projectAdvancementGatePasses(data);
  }

  return eventAdvancementGatePasses(data);
}

function canShowProposeAdvanceStep(
  data: ProjectPageData | EventPageData,
  joined: boolean,
  viewerUsername: string | null
) {
  if (!joined || !data.lifecycle.nextPhaseId) {
    return false;
  }

  if ('projectMode' in data && isPersonalServiceProject(data.projectMode)) {
    return false;
  }

  // Organizer-controlled events change phases directly; do not nudge "propose advance".
  if (!('projectMode' in data) && data.governance === 'organizer_controlled') {
    return false;
  }

  if (data.lifecycle.phaseChangeRequests.length > 0) {
    return false;
  }

  if (!data.lifecycle.viewerCanRequestPhaseChanges) {
    return false;
  }

  if (viewerHasAdvanceProposal(data, viewerUsername)) {
    return false;
  }

  return true;
}

function projectClosePhaseId(data: ProjectPageData) {
  return isPersonalServiceProject(data.projectMode) ? 'phase-2' : 'phase-7';
}

function isClosingTransition(data: ProjectPageData | EventPageData) {
  if ('projectMode' in data) {
    return data.lifecycle.nextPhaseId === projectClosePhaseId(data);
  }

  return data.lifecycle.nextPhaseId === 'closed';
}

function canOfferConversionOnClose(data: ProjectPageData) {
  return isProductiveProject(data.projectMode) && isClosingTransition(data);
}

function proposePhaseChangeStepLabel(data: ProjectPageData | EventPageData) {
  if (isClosingTransition(data)) {
    if ('projectMode' in data && canOfferConversionOnClose(data)) {
      return 'Close / convert';
    }

    return 'Close';
  }

  return 'Advance';
}

function projectAdvanceGateHelper(data: ProjectPageData): string | null {
  const phaseId = data.lifecycle.currentPhaseId;
  const nextLabel = data.lifecycle.nextPhaseLabel ?? 'the next phase';

  if (phaseId === 'phase-1') {
    if (!(data.lifecycle.phaseOne?.signalSummary?.advancementUnlocked ?? false)) {
      return 'Proposal demand still needs to meet the required threshold before this project can advance.';
    }
  }

  if (phaseId === 'phase-2' && !data.lifecycle.phaseTwo.winningPlanId) {
    return 'This project needs an approved production or operations plan before it can advance.';
  }

  if (
    phaseId === 'phase-3' &&
    !skipsDistributionPhase(data.projectMode, data.projectSubtype) &&
    !data.lifecycle.phaseThree.winningPlanId
  ) {
    return 'This project needs an approved distribution or access plan before it can advance.';
  }

  if (phaseId === 'phase-4') {
    return `When acquisition and inventory for this phase are complete, open the phase-change controls to propose advancing to ${nextLabel}.`;
  }

  if (phaseId === 'phase-5') {
    return `When this phase’s work is complete, open the phase-change controls to propose advancing to ${nextLabel}.`;
  }

  if (phaseId === 'phase-6') {
    if (isClosingTransition(data)) {
      if (canOfferConversionOnClose(data)) {
        return 'When execution is finished, open the phase-change controls to propose closing this project or converting it into a collective service.';
      }
      return 'When execution is finished, open the phase-change controls to propose closing this project.';
    }
    return `When execution is finished, open the phase-change controls to propose advancing to ${nextLabel}.`;
  }

  return null;
}

function eventAdvanceGateHelper(data: EventPageData): string | null {
  const phaseId = data.lifecycle.currentPhaseId;
  const nextLabel = data.lifecycle.nextPhaseLabel ?? 'the next phase';

  if (phaseId === 'proposal') {
    if (!(data.lifecycle.phaseOne?.signalSummary?.advancementUnlocked ?? false)) {
      return 'Proposal demand still needs to meet the required threshold before this event can advance.';
    }
  }

  if (phaseId === 'event-plan' && !data.lifecycle.phaseTwo.winningPlanId) {
    return 'This event needs an approved plan before it can advance.';
  }

  if (phaseId === 'activity') {
    if (isClosingTransition(data)) {
      return 'When the event is finished, open the phase-change controls to propose closing it.';
    }
    return `When this event’s activity is complete, open the phase-change controls to propose advancing to ${nextLabel}.`;
  }

  return null;
}

function proposeAdvanceHelper(data: ProjectPageData | EventPageData): string {
  const blockedHelper =
    'projectMode' in data ? projectAdvanceGateHelper(data) : eventAdvanceGateHelper(data);

  if (blockedHelper && !advancementGatePasses(data)) {
    return blockedHelper;
  }

  if (
    blockedHelper &&
    ('projectMode' in data
      ? data.lifecycle.currentPhaseId === 'phase-4' ||
        data.lifecycle.currentPhaseId === 'phase-5' ||
        data.lifecycle.currentPhaseId === 'phase-6'
      : data.lifecycle.currentPhaseId === 'activity')
  ) {
    return blockedHelper;
  }

  if (isClosingTransition(data)) {
    if ('projectMode' in data && canOfferConversionOnClose(data)) {
      return 'Open the phase-change controls to propose closing this project or converting it into a collective service.';
    }

    return 'projectMode' in data
      ? 'Open the phase-change controls to propose closing this project.'
      : 'Open the phase-change controls to propose closing this event.';
  }

  const nextLabel = data.lifecycle.nextPhaseLabel ?? 'the next phase';
  return `Open the phase-change controls to propose advancing to ${nextLabel}.`;
}

function isSoftwareActivityPhase(data: ProjectPageData | EventPageData) {
  return (
    'projectMode' in data &&
    data.lifecycle.currentPhaseId === 'phase-5' &&
    data.lifecycle.currentSubtype === 'software'
  );
}

function viewerCanProposeActivity(data: ProjectPageData | EventPageData) {
  if ('projectMode' in data) {
    return true;
  }

  return (
    data.lifecycle.activity.viewerCanCreateActivities &&
    canProposeEventActivity(eventWinningPlan(data))
  );
}

function proposeActivityHelper(
  data: ProjectPageData | EventPageData,
  joined: boolean,
  activitiesExist: boolean
) {
  if (!joined) {
    return undefined;
  }

  if (!('projectMode' in data) && !viewerCanProposeActivity(data)) {
    return 'Activity proposals open once the event plan has future scheduled days.';
  }

  return activitiesExist
    ? 'Add more activity others can sign up for.'
    : 'Add the first activity others can sign up for.';
}

function makePullRequestHelper(data: ProjectPageData, joined: boolean) {
  if (!joined) {
    return undefined;
  }

  if (!data.lifecycle.phaseFive.softwareGovernance?.viewerCanCreatePullRequests) {
    return 'Pull request tools unlock once you can create software changes for this project.';
  }

  return 'Open software governance to submit a pull request for review.';
}

function viewerSubmittedPlan(data: ProjectPageData | EventPageData, viewerUsername: string | null) {
  const matchesViewer = (authorUsername: string) =>
    viewerUsername != null && authorUsername === viewerUsername;

  if ('projectMode' in data) {
    if (data.lifecycle.currentPhaseId === 'phase-2') {
      return data.lifecycle.phaseTwo.plans.some(
        (plan) => ('viewerCanEdit' in plan && plan.viewerCanEdit) || matchesViewer(plan.authorUsername)
      );
    }
    if (data.lifecycle.currentPhaseId === 'phase-3') {
      return data.lifecycle.phaseThree.plans.some(
        (plan) => matchesViewer(plan.authorUsername)
      );
    }
    return false;
  }

  return data.lifecycle.phaseTwo.plans.some(
    (plan) => matchesViewer(plan.authorUsername)
  );
}

function eventWinningPlan(data: EventPageData): EventPlan | null {
  const winningPlanId = data.lifecycle.phaseTwo.winningPlanId;

  if (!winningPlanId) {
    return null;
  }

  return data.lifecycle.phaseTwo.plans.find((plan) => plan.id === winningPlanId) ?? null;
}

function viewerHasPendingPlanAssessments(data: ProjectPageData | EventPageData) {
  const plans =
    'projectMode' in data
      ? data.lifecycle.currentPhaseId === 'phase-3'
        ? data.lifecycle.phaseThree.plans
        : data.lifecycle.phaseTwo.plans
      : data.lifecycle.phaseTwo.plans;

  const canVote =
    'projectMode' in data
      ? data.lifecycle.currentPhaseId === 'phase-3'
        ? data.lifecycle.phaseThree.viewerCanVoteOnPlans
        : data.lifecycle.phaseTwo.viewerCanVoteOnPlans
      : data.lifecycle.phaseTwo.viewerCanVoteOnPlans;

  if (!canVote) {
    return false;
  }

  return plans.some((plan) =>
    (plan.criterionAssessments ?? []).some((entry) => entry.activeRating == null)
  );
}

function hasScheduledActivities(data: ProjectPageData | EventPageData) {
  if ('projectMode' in data) {
    return data.lifecycle.phaseFive.activities.length > 0;
  }

  return data.lifecycle.activity.activities.length > 0;
}

export function getActivitiesNeedingSignup(data: ProjectPageData | EventPageData) {
  const activities =
    'projectMode' in data ? data.lifecycle.phaseFive.activities : data.lifecycle.activity.activities;

  return activities.filter((activity) => {
    if (activity.viewerAssignedRoleLabel) {
      return false;
    }

    return activity.roles.some(
      (role) =>
        !role.isViewerAssigned &&
        (role.maximumCount == null || role.filledCount < role.maximumCount)
    );
  });
}

function viewerNeedsActivitySignup(data: ProjectPageData | EventPageData) {
  const activities =
    'projectMode' in data ? data.lifecycle.phaseFive.activities : data.lifecycle.activity.activities;

  return activities.some((activity) => !activity.viewerAssignedRoleLabel);
}

function signalHelper(
  data: ProjectPageData | EventPageData,
  signaled: boolean,
  signalRemovalNudge: boolean
) {
  if (signalRemovalNudge && !signaled) {
    return 'You removed your signal. Signals stay open through every phase and inform whether this should continue on the platform.';
  }

  if (signaled) {
    return undefined;
  }

  if (!data.viewerIsMember) {
    return 'Support or oppose — you can signal without joining. This is platform interest, not a lifecycle vote.';
  }

  return 'Support or oppose — this is platform interest, not a lifecycle vote.';
}

function buildSignalStep(
  data: ProjectPageData | EventPageData,
  signaled: boolean,
  options: ParticipationStepOptions
): ParticipationStep | null {
  const supportsSignals =
    'projectMode' in data
      ? supportsProjectDemandSignals(data.projectMode)
      : data.governance !== 'organizer_controlled';

  if (!supportsSignals) {
    return null;
  }

  const showRemovalNudge = Boolean(options.signalRemovalNudge && !signaled);

  if (signaled && !showRemovalNudge) {
    return {
      id: 'signal',
      label: 'Signal',
      done: true
    };
  }

  return {
    id: 'signal',
    label: 'Signal',
    done: signaled,
    helper: signalHelper(data, signaled, Boolean(options.signalRemovalNudge))
  };
}

function historyFollowUpHelper(items: ProjectServiceHistoryItem[]) {
  const needsCompletion = items.some(
    (item) =>
      (item.requesterCompletion?.viewerCanSet && item.requesterCompletion.viewerSelection == null) ||
      (item.participantCompletion.viewerCanSet && item.participantCompletion.viewerSelection == null)
  );
  const needsRating = items.some((item) => item.viewerCanRate && item.viewerRating == null);

  if (needsCompletion && needsRating) {
    return 'Mark completion and leave a rating for activity you joined.';
  }

  if (needsCompletion) {
    return 'Say whether this activity completed from your side.';
  }

  if (needsRating) {
    return 'Rate an activity you took part in.';
  }

  return undefined;
}

function buildHistoryFollowUpStep(items: ProjectServiceHistoryItem[]): ParticipationStep {
  return {
    id: 'history-follow-up',
    label: 'Wrap up',
    done: false,
    helper: historyFollowUpHelper(items)
  };
}

function rateValuesHelper(
  values: { activeImportanceVote: number }[],
  joined: boolean,
  signaled: boolean,
  rated: boolean
): string | undefined {
  if (!joined || !signaled || rated) {
    return undefined;
  }

  if (values.length === 0) {
    return 'Add a shared value, then rate it — proposal needs at least one before plans can be compared.';
  }

  return 'Rate shared values and add your own proposals before plans can be compared.';
}

function buildParticipationSteps(
  data: ProjectPageData | EventPageData,
  pendingVotes: PendingVoteItem[] = [],
  options: ParticipationStepOptions = {}
): ParticipationStep[] {
  if ('projectMode' in data && isPersonalServiceProject(data.projectMode)) {
    const historyPending = getHistoryItemsNeedingFollowUp(data);
    if (historyPending.length === 0) {
      return [];
    }

    return [buildHistoryFollowUpStep(historyPending)].filter((step) => !step.done);
  }

  const joined = data.viewerIsMember;
  const signaled =
    data.lifecycle.phaseOne.viewerHasDemandSignal || data.lifecycle.phaseOne.viewerHasOppositionSignal;
  const rated = valuesRated(data.lifecycle.phaseOne.values);
  const viewerUsername = options.viewerUsername ?? null;

  const steps: ParticipationStep[] = [];

  const signalStep = buildSignalStep(data, signaled, options);
  if (signalStep) {
    steps.push(signalStep);
  }

  if (data.viewerCanToggleMembership) {
    const joinHelper = joined
      ? undefined
      : !('projectMode' in data) && data.governance === 'organizer_controlled'
        ? 'Join to attend and sign up for activity roles.'
        : 'Join to propose and vote on lifecycle decisions.';
    steps.push({
      id: 'join',
      label: 'Join',
      done: joined,
      helper: joinHelper
    });
  }

  const hasAssessPlansStep =
    isPlanPhase(data) && ('projectMode' in data || data.governance !== 'organizer_controlled');
  const skipVoteForPlanAssess =
    hasAssessPlansStep && pendingVotesArePlanAssessmentsOnly(pendingVotes);

  if (pendingVotes.length > 0 && !skipVoteForPlanAssess) {
    const hasSoftwareActions = pendingVotes.some(
      (item) =>
        item.voteKind === 'pull_request_merge' ||
        item.voteKind === 'pull_request' ||
        item.voteKind === 'merge_capability' ||
        item.voteKind === 'repository_replacement'
    );
    steps.push({
      id: 'vote',
      label: 'Vote',
      done: false,
      helper: joined
        ? hasSoftwareActions
          ? 'Handle open votes, merges, and confirmations — do not start a new one.'
          : 'Approve or reject open decisions — do not start a new one.'
        : undefined
    });
  }

  if (isProposalPhase(data) && ('projectMode' in data || data.governance !== 'organizer_controlled')) {
    steps.push({
      id: 'rate',
      label: data.lifecycle.phaseOne.values.length === 0 ? 'Add values' : 'Rate values',
      done: rated,
      helper: rateValuesHelper(data.lifecycle.phaseOne.values, joined, signaled, rated)
    });
  }

  if (isPlanPhase(data) && ('projectMode' in data || data.governance !== 'organizer_controlled')) {
    steps.push({
      id: 'plan',
      label: 'Add plan',
      done: viewerSubmittedPlan(data, viewerUsername),
      helper: joined
        ? 'Contribute your own plan and assess plans from others in this phase.'
        : undefined
    });
    steps.push({
      id: 'assess-plans',
      label: 'Assess',
      done: !viewerHasPendingPlanAssessments(data),
      helper: joined ? 'Rate other members’ plans before casting final approval votes.' : undefined
    });
  }

  if (isActivityPhase(data)) {
    const activitiesExist = hasScheduledActivities(data);
    if (activitiesExist) {
      steps.push({
        id: 'activity',
        label: 'Sign up',
        done: !viewerNeedsActivitySignup(data),
        helper: joined ? 'Take a role on scheduled activity others have proposed.' : undefined
      });
    }
    steps.push({
      id: 'propose-activity',
      label: 'Add activity',
      done: false,
      helper: proposeActivityHelper(data, joined, activitiesExist)
    });

    if (isSoftwareActivityPhase(data) && 'projectMode' in data) {
      steps.push({
        id: 'make-pull-request',
        label: 'Add PR',
        done: false,
        helper: makePullRequestHelper(data, joined)
      });
    }
  }

  if (canShowProposeAdvanceStep(data, joined, viewerUsername)) {
    steps.push({
      id: 'propose-advance',
      label: proposePhaseChangeStepLabel(data),
      done: false,
      helper: joined ? proposeAdvanceHelper(data) : undefined
    });
  }

  const historyPending = getHistoryItemsNeedingFollowUp(data);
  if (historyPending.length > 0) {
    steps.push(buildHistoryFollowUpStep(historyPending));
  }

  return steps.filter((step) => !step.done);
}

export function buildProjectParticipationSteps(
  data: ProjectPageData,
  pendingVotes: PendingVoteItem[] = [],
  options: ParticipationStepOptions = {}
): ParticipationStep[] {
  return buildParticipationSteps(data, pendingVotes, options);
}

export function buildEventParticipationSteps(
  data: EventPageData,
  pendingVotes: PendingVoteItem[] = [],
  options: ParticipationStepOptions = {}
): ParticipationStep[] {
  return buildParticipationSteps(data, pendingVotes, options);
}

export function resolveCurrentParticipationStep(steps: ParticipationStep[]) {
  const signalStep = steps.find((step) => step.id === 'signal' && !step.done);
  if (signalStep) {
    return signalStep.id;
  }

  const priority = [
    'join',
    'vote',
    'rate',
    'plan',
    'assess-plans',
    'activity',
    'propose-activity',
    'make-pull-request',
    'propose-advance',
    'history-follow-up'
  ];
  for (const id of priority) {
    const match = steps.find((step) => step.id === id && !step.done);
    if (match) {
      return match.id;
    }
  }

  return steps.find((step) => !step.done)?.id ?? null;
}

function pendingVotesArePlanAssessmentsOnly(pendingVotes: PendingVoteItem[]) {
  return (
    pendingVotes.length > 0 &&
    pendingVotes.every((item) => item.voteKind === 'plan' && Boolean(item.planCriterionId))
  );
}

export function getParticipationStepAnchor(stepId: string): string | null {
  switch (stepId) {
    case 'join':
      return 'participation-join';
    case 'signal':
      return 'participation-signals';
    case 'rate':
      return 'participation-values';
    case 'plan':
      return 'participation-plans';
    case 'assess-plans':
      return 'pending-votes-panel';
    case 'propose-advance':
      return 'participation-phase-change';
    case 'make-pull-request':
      return 'software-governance-panel';
    case 'activity':
    case 'propose-activity':
    case 'history-follow-up':
      return 'participation-activities';
    case 'vote':
    case 'phase-vote':
      return 'pending-votes-panel';
    default:
      return null;
  }
}

export function getParticipationStepActionTarget(
  stepId: string,
  pendingVotes: PendingVoteItem[] = [],
  pageData?: ProjectPageData | EventPageData | null
): string | null {
  switch (stepId) {
    case 'join':
      return '#participation-join';
    case 'signal':
      return '#participation-signals .demand-button';
    case 'rate':
      if (pageData && pageData.lifecycle.phaseOne.values.length === 0) {
        return '[data-participation-action="add-value"]';
      }

      return '#participation-values [data-participation-action="rate-value"]';
    case 'plan':
      return '[data-participation-action="submit-plan"]';
    case 'assess-plans': {
      const assessItem = pendingVotes.find((item) => item.voteKind === 'plan' && item.planCriterionId);
      if (assessItem) {
        return `#${pendingVoteCardId(
          assessItem.voteKind,
          assessItem.id,
          assessItem.planValueId,
          assessItem.planCriterionId
        )}`;
      }

      return '#pending-votes-panel [data-participation-action="assess-plan"]';
    }
    case 'propose-advance':
      return '[data-participation-action="propose-advance"]';
    case 'activity':
      return '#participation-activities [data-participation-target="activity-signup"]';
    case 'propose-activity':
      return '[data-participation-action="propose-activity"]';
    case 'make-pull-request':
      return '[data-participation-action="make-pull-request"]';
    case 'vote': {
      if (pendingVotes.length > 0) {
        return '#pending-votes-panel .pending-vote-banner';
      }

      return '#pending-votes-panel [data-participation-action="cast-vote"]';
    }
    default:
      return null;
  }
}
