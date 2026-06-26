import { isAssetManagementSubtypeEnabled } from '$lib/config/features/phaseScope';
import type { ProjectLifecyclePhaseId } from '$lib/types/detail';
import type { ProjectMode, ProjectSubtype } from '$lib/types/feed';

export type ProjectSubtypeOption = {
  value: ProjectSubtype;
  label: string;
  description: string;
  disabled?: boolean;
};

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
  if (mode === 'personal-service') {
    switch (phaseId) {
      case 'phase-1':
        return 'Activity';
      case 'phase-2':
        return 'Closed';
      default:
        return 'Calendar';
    }
  }

  switch (phaseId) {
    case 'phase-1':
      return 'Proposal';
    case 'phase-2':
      return 'Planning';
    case 'phase-3':
      return 'Planning';
    case 'phase-4':
      return 'Acquisition';
    case 'phase-5':
      return 'Activity';
    case 'phase-6':
      return 'Activity';
  }
}

export function projectSubtypeLabel(subtype: ProjectSubtype) {
  switch (subtype) {
    case 'software':
      return 'Software';
    case 'asset-management':
      return isAssetManagementSubtypeEnabled() ? 'Asset management' : 'Standard';
    default:
      return 'Standard';
  }
}

export function projectSubtypeOptions(mode: ProjectMode): ProjectSubtypeOption[] {
  if (mode === 'personal-service') {
    return [];
  }

  if (mode === 'productive') {
    return [
      {
        value: 'standard',
        label: 'Standard project',
        description: 'Use the ordinary productive project path.'
      },
      {
        value: 'software',
        label: 'Software project',
        description: 'Use software-specific governance with the default open-source release path.'
      }
    ];
  }

  return [
    {
      value: 'standard',
      label: 'Standard service',
      description: 'Use the ordinary collective-service path.'
    },
    {
      value: 'software',
      label: 'Software service',
      description: 'Use the software service path with the default open-source release rules.'
    }
  ];
}