import { isPersonalServiceProject, supportsProjectDemandSignals } from '$lib/features/projects/projectMode';
import type { EventPageData, ProjectPageData } from '$lib/types/detail';
import type { PendingVoteItem } from '$lib/utils/pendingVotes';

export interface ParticipationStep {
  id: string;
  label: string;
  done: boolean;
  helper?: string;
}

export interface ParticipationStepOptions {
  signalRemovalNudge?: boolean;
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

  return 'Rate shared values before plans can be compared.';
}

export function buildProjectParticipationSteps(
  data: ProjectPageData,
  pendingVotes: PendingVoteItem[] = [],
  options: ParticipationStepOptions = {}
): ParticipationStep[] {
  if (isPersonalServiceProject(data.projectMode)) {
    return [];
  }

  const joined = data.viewerIsMember;
  const signaled =
    data.lifecycle.phaseOne.viewerHasDemandSignal || data.lifecycle.phaseOne.viewerHasOppositionSignal;
  const rated = valuesRated(data.lifecycle.phaseOne.values);

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
  pendingVotes: PendingVoteItem[] = [],
  options: ParticipationStepOptions = {}
): ParticipationStep[] {
  const joined = data.viewerIsMember;
  const signaled =
    data.lifecycle.phaseOne.viewerHasDemandSignal || data.lifecycle.phaseOne.viewerHasOppositionSignal;
  const rated = valuesRated(data.lifecycle.phaseOne.values);

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
  const signalStep = steps.find((step) => step.id === 'signal' && !step.done);
  if (signalStep) {
    return signalStep.id;
  }

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
