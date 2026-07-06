import type {
  EventLifecyclePhase,
  EventLifecyclePhaseId,
  ProjectLifecyclePhase,
  ProjectLifecyclePhaseId
} from '$lib/types/detail';
import type { ProjectMode } from '$lib/types/feed';
import { isPersonalServiceProject } from '$lib/features/projects/projectMode';

export type PhaseChangeVoteKind = 'return' | 'advance' | 'close';

export function projectTerminalPhaseId(projectMode: ProjectMode): ProjectLifecyclePhaseId {
  return isPersonalServiceProject(projectMode) ? 'phase-2' : 'phase-7';
}

function phaseOrder<T extends { id: string; order: number }>(phases: T[], phaseId: string) {
  return phases.find((phase) => phase.id === phaseId)?.order ?? 0;
}

export function effectiveProjectPhaseChangeKind(
  request: { kind: PhaseChangeVoteKind; targetPhaseId: ProjectLifecyclePhaseId },
  projectMode: ProjectMode,
  currentPhaseId: ProjectLifecyclePhaseId,
  phases: ProjectLifecyclePhase[]
): PhaseChangeVoteKind {
  if (request.kind === 'return') {
    return 'return';
  }

  if (request.kind === 'close' || request.targetPhaseId === projectTerminalPhaseId(projectMode)) {
    return 'close';
  }

  const currentOrder = phaseOrder(phases, currentPhaseId);
  const targetOrder = phaseOrder(phases, request.targetPhaseId);

  if (targetOrder > 0 && currentOrder > 0 && targetOrder < currentOrder) {
    return 'return';
  }

  return 'advance';
}

export function effectiveEventPhaseChangeKind(
  request: { kind: PhaseChangeVoteKind; targetPhaseId: EventLifecyclePhaseId },
  currentPhaseId: EventLifecyclePhaseId,
  phases: EventLifecyclePhase[]
): PhaseChangeVoteKind {
  if (request.kind === 'return') {
    return 'return';
  }

  if (request.kind === 'close' || request.targetPhaseId === 'closed') {
    return 'close';
  }

  const currentOrder = phaseOrder(phases, currentPhaseId);
  const targetOrder = phaseOrder(phases, request.targetPhaseId);

  if (targetOrder > 0 && currentOrder > 0 && targetOrder < currentOrder) {
    return 'return';
  }

  return 'advance';
}

export function phaseChangeDecisionTitle(
  kind: PhaseChangeVoteKind,
  targetPhaseLabel: string,
  closeOutcome?: 'close' | 'convert'
) {
  if (kind === 'return') {
    return `Return to ${targetPhaseLabel}`;
  }

  if (kind === 'close') {
    return closeOutcome === 'convert' ? 'Convert project' : 'Close project';
  }

  return `Advance to ${targetPhaseLabel}`;
}

export function resolveProjectPhaseChangeVoteKind(
  request: { kind: PhaseChangeVoteKind; targetPhaseId: ProjectLifecyclePhaseId },
  projectMode: ProjectMode,
  currentPhaseId?: ProjectLifecyclePhaseId,
  phases: ProjectLifecyclePhase[] = []
): PhaseChangeVoteKind {
  if (currentPhaseId && phases.length > 0) {
    return effectiveProjectPhaseChangeKind(request, projectMode, currentPhaseId, phases);
  }

  if (request.kind === 'return') {
    return 'return';
  }

  if (request.targetPhaseId === projectTerminalPhaseId(projectMode) || request.kind === 'close') {
    return 'close';
  }

  return 'advance';
}

export function resolveEventPhaseChangeVoteKind(
  request: { kind: PhaseChangeVoteKind; targetPhaseId: EventLifecyclePhaseId },
  currentPhaseId?: EventLifecyclePhaseId,
  phases: EventLifecyclePhase[] = []
): PhaseChangeVoteKind {
  if (currentPhaseId && phases.length > 0) {
    return effectiveEventPhaseChangeKind(request, currentPhaseId, phases);
  }

  if (request.kind === 'return') {
    return 'return';
  }

  if (request.targetPhaseId === 'closed' || request.kind === 'close') {
    return 'close';
  }

  return 'advance';
}
