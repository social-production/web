import { isPersonalServiceProject, supportsProjectDemandSignals } from '$lib/features/projects/projectMode';
import type { EventPageData, ProjectPageData } from '$lib/types/detail';
import type { PendingVoteItem } from '$lib/utils/pendingVotes';

export interface ParticipationStep {
  id: string;
  label: string;
  done: boolean;
  helper?: string;
}

function valuesRated(values: { activeImportanceVote: number }[]) {
  return values.length === 0 || values.every((value) => value.activeImportanceVote > 0);
}

function isProposalPhase(data: ProjectPageData | EventPageData) {
  if ('projectMode' in data) {
    return data.lifecycle.currentPhaseId === 'phase-1';
  }

  return data.lifecycle.currentPhaseId === 'proposal';
}

export function buildProjectParticipationSteps(
  data: ProjectPageData,
  pendingVotes: PendingVoteItem[] = []
): ParticipationStep[] {
  if (isPersonalServiceProject(data.projectMode)) {
    return [];
  }

  const showSignalStep = supportsProjectDemandSignals(data.projectMode) && isProposalPhase(data);
  const joined = data.viewerIsMember;
  const signaled =
    data.lifecycle.phaseOne.viewerHasDemandSignal || data.lifecycle.phaseOne.viewerHasOppositionSignal;
  const rated = valuesRated(data.lifecycle.phaseOne.values);

  const steps: ParticipationStep[] = [];

  if (data.viewerCanToggleMembership) {
    steps.push({
      id: 'join',
      label: 'Join',
      done: joined,
      helper: joined ? undefined : 'Join to propose and vote on lifecycle decisions.'
    });
  }

  if (showSignalStep) {
    steps.push({
      id: 'signal',
      label: 'Signal',
      done: signaled,
      helper: joined && !signaled ? 'Support or oppose signals interest — this is not a lifecycle vote.' : undefined
    });
  }

  if (isProposalPhase(data)) {
    steps.push({
      id: 'rate',
      label: 'Rate values',
      done: rated,
      helper: joined && signaled && !rated ? 'Rate shared values before plans can be compared.' : undefined
    });
  }

  if (pendingVotes.length > 0) {
    steps.push({
      id: 'vote',
      label: 'Vote',
      done: false,
      helper: joined ? 'Approve or reject open decisions — do not start a new one.' : undefined
    });
  }

  return steps.filter((step) => !step.done);
}

export function buildEventParticipationSteps(
  data: EventPageData,
  pendingVotes: PendingVoteItem[] = []
): ParticipationStep[] {
  const joined = data.viewerIsMember;
  const signaled =
    data.lifecycle.phaseOne.viewerHasDemandSignal || data.lifecycle.phaseOne.viewerHasOppositionSignal;
  const rated = valuesRated(data.lifecycle.phaseOne.values);

  const steps: ParticipationStep[] = [];

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
      id: 'signal',
      label: 'Signal',
      done: signaled,
      helper: joined && !signaled ? 'Support or oppose signals interest — this is not a lifecycle vote.' : undefined
    });

    steps.push({
      id: 'rate',
      label: 'Rate values',
      done: rated,
      helper: joined && signaled && !rated ? 'Rate shared values before plans can be compared.' : undefined
    });
  }

  if (pendingVotes.length > 0) {
    steps.push({
      id: 'vote',
      label: 'Vote',
      done: false,
      helper: joined ? 'Approve or reject open decisions — do not start a new one.' : undefined
    });
  }

  return steps.filter((step) => !step.done);
}

export function resolveCurrentParticipationStep(steps: ParticipationStep[]) {
  return steps.find((step) => !step.done)?.id ?? null;
}

export function getParticipationStepAnchor(stepId: string): string | null {
  switch (stepId) {
    case 'join':
      return 'participation-join';
    case 'signal':
      return 'participation-signals';
    case 'rate':
      return 'participation-values';
    case 'vote':
    case 'plan':
    case 'phase-vote':
      return 'pending-votes-panel';
    default:
      return null;
  }
}
