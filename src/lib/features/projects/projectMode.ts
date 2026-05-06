import type { ProjectLifecyclePhaseId } from '$lib/types/detail';
import type { ProjectMode } from '$lib/types/feed';

export function isProductiveProject(mode: ProjectMode) {
  return mode === 'productive';
}

export function isCollectiveServiceProject(mode: ProjectMode) {
  return mode === 'collective-service';
}

export function isPersonalServiceProject(mode: ProjectMode) {
  return mode === 'personal-service';
}

export function supportsProjectDemandSignals(mode: ProjectMode) {
  return mode !== 'personal-service';
}

export function supportsProjectPlanning(mode: ProjectMode) {
  return mode !== 'personal-service';
}

export function projectSubjectLabel(mode: ProjectMode) {
  switch (mode) {
    case 'productive':
      return 'Productive';
    case 'collective-service':
      return 'Collective Service';
    case 'personal-service':
      return 'Personal Service';
  }
}

export function projectCreateTitle(mode: ProjectMode) {
  switch (mode) {
    case 'productive':
      return 'Productive Project';
    case 'collective-service':
      return 'Collective Service';
    case 'personal-service':
      return 'Personal Service';
  }
}

export function projectFeedPhaseLabel(mode: ProjectMode, phaseId: ProjectLifecyclePhaseId) {
  switch (phaseId) {
    case 'phase-1':
      return 'Proposal';
    case 'phase-2':
      return mode === 'personal-service' ? 'Completed' : 'Planning';
    case 'phase-3':
      return 'Planning';
    case 'phase-4':
      return 'Acquisition';
    case 'phase-5':
      return 'Activity';
    case 'phase-6':
      return 'Completed';
  }
}