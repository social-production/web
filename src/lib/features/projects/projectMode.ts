import { isAssetManagementSubtypeEnabled } from '$lib/config/features/phaseScope';
import type { ProjectLifecyclePhaseId } from '$lib/types/detail';
import type { ProjectMode, ProjectSubtype } from '$lib/types/feed';

export type ProjectSubtypeOption = {
  value: ProjectSubtype;
  label: string;
  description: string;
  disabled?: boolean;
};

export type ProjectCreateTypeOption = {
  value: ProjectMode;
  label: string;
  summary: string;
  bestFor: string[];
  lifecycleNote: string;
};

export type ServiceRequestModeOption = {
  value: 'calendar' | 'direct' | 'both';
  label: string;
  summary: string;
  lifecycleNote: string;
};

export const projectCreateTypeOptions: ProjectCreateTypeOption[] = [
  {
    value: 'productive',
    label: 'Productive project',
    summary: 'Build or produce something new — e.g. construction, materials, tools, or software from scratch.',
    bestFor: [
      'Creating shared capacity, goods, or tools',
      'Designing and building something that does not exist yet',
      'Work that needs demand and planning before production'
    ],
    lifecycleNote:
      'Starts in Proposal, then moves through production and distribution planning before activity.'
  },
  {
    value: 'collective-service',
    label: 'Collective service',
    summary: 'Maintain, update, or operate something already in use — e.g. keep software running, dinner service, shared care.',
    bestFor: [
      'Ongoing services delivered directly to people',
      'Maintaining and improving existing tools or systems',
      'Recurring operations rather than one-off production'
    ],
    lifecycleNote:
      'Starts in Proposal, then moves through operations and access planning before the service opens for activity.'
  },
  {
    value: 'personal-service',
    label: 'Personal service',
    summary: 'One person offering time or skill through calendar slots and/or written requests.',
    bestFor: [
      'Individual help you can schedule or request directly',
      'Skills offered without collective planning phases',
      'Small-scale mutual aid from a single provider'
    ],
    lifecycleNote:
      'Skips collective planning and opens directly into availability, requests, and scheduling.'
  }
];

export const serviceRequestModeOptions: ServiceRequestModeOption[] = [
  {
    value: 'calendar',
    label: 'Calendar booking',
    summary: 'Show availability on the calendar and let people request a slot.',
    lifecycleNote: 'Best when the service happens at specific times you list in advance.'
  },
  {
    value: 'direct',
    label: 'Direct requests',
    summary: 'Let people send written requests without calendar booking.',
    lifecycleNote: 'Best when timing is flexible and requests can be handled as they arrive.'
  },
  {
    value: 'both',
    label: 'Calendar + direct',
    summary: 'Keep slot booking and allow standalone written requests.',
    lifecycleNote: 'Use both when some work fits listed slots and some needs open-ended requests.'
  }
];

export function projectCreateTypeOption(mode: ProjectMode) {
  return projectCreateTypeOptions.find((option) => option.value === mode) ?? projectCreateTypeOptions[0];
}

export function isProductiveProject(mode: ProjectMode) {
  return mode === 'productive';
}

export function isCollectiveServiceProject(mode: ProjectMode) {
  return mode === 'collective-service';
}

export function isPersonalServiceProject(mode: ProjectMode) {
  return mode === 'personal-service';
}

export function skipsDistributionPhase(mode: ProjectMode, subtype: ProjectSubtype | null | undefined) {
  return isCollectiveServiceProject(mode) || subtype === 'software';
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

  if (mode === 'collective-service') {
    switch (phaseId) {
      case 'phase-1':
        return 'Proposal';
      case 'phase-2':
        return 'Operations Plan';
      case 'phase-3':
        return 'Access Plan';
      case 'phase-5':
        return 'Activity';
      case 'phase-7':
        return 'Closed';
      default:
        return 'Planning';
    }
  }

  switch (phaseId) {
    case 'phase-1':
      return 'Proposal';
    case 'phase-2':
      return 'Production Plan';
    case 'phase-3':
      return 'Distribution Plan';
    case 'phase-4':
      return 'Acquisition';
    case 'phase-5':
      return 'Activity';
    case 'phase-6':
      return 'Activity';
    case 'phase-7':
      return 'Closed';
    default:
      return 'Proposal';
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