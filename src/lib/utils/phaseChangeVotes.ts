import type { EventLifecyclePhaseId, ProjectLifecyclePhaseId } from '$lib/types/detail';
import type { ProjectMode } from '$lib/types/feed';
import { isPersonalServiceProject } from '$lib/features/projects/projectMode';

export type PhaseChangeVoteKind = 'return' | 'advance' | 'close';

export function projectTerminalPhaseId(projectMode: ProjectMode): ProjectLifecyclePhaseId {
  return isPersonalServiceProject(projectMode) ? 'phase-2' : 'phase-7';
}

export function resolveProjectPhaseChangeVoteKind(
  request: { kind: PhaseChangeVoteKind; targetPhaseId: ProjectLifecyclePhaseId },
  projectMode: ProjectMode
): PhaseChangeVoteKind {
  if (request.kind === 'return') {
    return 'return';
  }

  if (request.targetPhaseId === projectTerminalPhaseId(projectMode) || request.kind === 'close') {
    return 'close';
  }

  return 'advance';
}

export function resolveEventPhaseChangeVoteKind(request: {
  kind: PhaseChangeVoteKind;
  targetPhaseId: EventLifecyclePhaseId;
}): PhaseChangeVoteKind {
  if (request.kind === 'return') {
    return 'return';
  }

  if (request.targetPhaseId === 'closed' || request.kind === 'close') {
    return 'close';
  }

  return 'advance';
}
