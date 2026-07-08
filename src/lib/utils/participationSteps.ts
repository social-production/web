import { isPersonalServiceProject, supportsProjectDemandSignals } from '$lib/features/projects/projectMode';
import type { EventPageData, ProjectPageData } from '$lib/types/detail';
import { pendingVoteCardId, type PendingVoteItem } from '$lib/utils/pendingVotes';

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

function viewerProposedActivity(data: ProjectPageData | EventPageData, viewerUsername: string | null) {
  if (!viewerUsername) {
    return false;
  }

  if ('projectMode' in data) {
    return data.lifecycle.phaseFive.activities.some(
      (activity) => activity.authorUsername === viewerUsername
    );
  }

  return data.lifecycle.activity.activities.some(
    (activity) => activity.authorUsername === viewerUsername
  );
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

export { focusActivitySignupTargets } from '$lib/utils/participationActivityFocus';

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
    'projectMode' in data ? supportsProjectDemandSignals(data.projectMode) : true;

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
    return [];
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
    steps.push({
      id: 'join',
      label: 'Join',
      done: joined,
      helper: joined ? undefined : 'Join to propose and vote on lifecycle decisions.'
    });
  }

  if (isProposalPhase(data)) {
    steps.push({
      id: 'rate',
      label: data.lifecycle.phaseOne.values.length === 0 ? 'Add values' : 'Rate values',
      done: rated,
      helper: rateValuesHelper(data.lifecycle.phaseOne.values, joined, signaled, rated)
    });
  }

  if (isPlanPhase(data)) {
    steps.push({
      id: 'plan',
      label: 'Submit a plan',
      done: viewerSubmittedPlan(data, viewerUsername),
      helper: joined
        ? 'Contribute your own plan and assess plans from others in this phase.'
        : undefined
    });
    steps.push({
      id: 'assess-plans',
      label: 'Assess plans',
      done: !viewerHasPendingPlanAssessments(data),
      helper: joined ? 'Rate other members’ plans before casting final approval votes.' : undefined
    });
  }

  if (isActivityPhase(data)) {
    const activitiesExist = hasScheduledActivities(data);
    if (activitiesExist) {
      steps.push({
        id: 'activity',
        label: 'Sign up for a role',
        done: !viewerNeedsActivitySignup(data),
        helper: joined ? 'Take a role on scheduled activity others have proposed.' : undefined
      });
    }
    steps.push({
      id: 'propose-activity',
      label: 'Propose activity',
      done: viewerProposedActivity(data, viewerUsername),
      helper: joined
        ? activitiesExist
          ? 'Add more activity others can sign up for.'
          : 'Add the first activity others can sign up for.'
        : undefined
    });
  }

  const hasAssessPlansStep = steps.some((step) => step.id === 'assess-plans');
  const skipVoteForPlanAssess =
    hasAssessPlansStep && pendingVotesArePlanAssessmentsOnly(pendingVotes);

  if (pendingVotes.length > 0 && !skipVoteForPlanAssess) {
    steps.push({
      id: 'vote',
      label: 'Vote',
      done: false,
      helper: joined ? 'Approve or reject open decisions — do not start a new one.' : undefined
    });
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

  const priority = ['join', 'rate', 'plan', 'assess-plans', 'activity', 'propose-activity', 'vote'];
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
    case 'activity':
    case 'propose-activity':
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
    case 'activity':
      return '#participation-activities [data-participation-target="activity-signup"]';
    case 'propose-activity':
      return '[data-participation-action="propose-activity"]';
    case 'vote': {
      const voteItem =
        pendingVotes.find((item) => !(item.voteKind === 'plan' && item.planCriterionId)) ??
        pendingVotes[0];

      if (voteItem) {
        return `#${pendingVoteCardId(
          voteItem.voteKind,
          voteItem.id,
          voteItem.planValueId,
          voteItem.planCriterionId
        )}`;
      }

      return '#pending-votes-panel [data-participation-action="cast-vote"]';
    }
    default:
      return null;
  }
}
