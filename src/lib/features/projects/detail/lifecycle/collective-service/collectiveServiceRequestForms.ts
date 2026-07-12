import type { ProjectSubtype } from '$lib/types/feed';
import type {
  ProjectActivityRoleInput,
  ProjectPageData,
  ProjectServiceRequestItem
} from '$lib/types/detail';

export type RequestPlanningForm = {
  title: string;
  locationLabel: string;
  roleRequirements: ProjectActivityRoleInput[];
  linkedPlanPhaseId: string | null;
  note: string;
};

export type RequestSettingsForm = {
  enabled: boolean;
  requestMode: 'calendar' | 'direct' | 'both';
  allowOffScheduleRequests: boolean;
  reason: string;
};

export type ComparableRequestSettings = Omit<RequestSettingsForm, 'reason'>;

export type SpecializedRequestForm = {
  requestUse: 'project' | 'individual';
  itemSummary: string;
  pickupLabel: string;
  destinationLabel: string;
  description: string;
  needsDelivery: boolean;
};

export type RequestComposerCopy = {
  sectionTitle: string;
  actionLabel: string;
  composerTitle: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  startLabel: string;
  endLabel: string;
  submitLabel: string;
  selectionHelp: string;
  usesAssetFields: boolean;
  usesDeliveryFields: boolean;
  itemLabel?: string;
  itemPlaceholder?: string;
  pickupLabel?: string;
  destinationLabel?: string;
  titlePlaceholder?: string;
  bodyPlaceholder?: string;
};

export function createDraftActivityRole(label = ''): ProjectActivityRoleInput {
  return {
    label,
    requiredCount: 1
  };
}

export function createRequestPlanningForm(
  data: ProjectPageData,
  request?: ProjectServiceRequestItem
): RequestPlanningForm {
  return {
    title: request?.title ?? '',
    locationLabel: data.locationLabel,
    roleRequirements: [createDraftActivityRole('Service lead')],
    linkedPlanPhaseId: '',
    note: request?.body ?? ''
  };
}

export function createRequestSettingsForm(data: ProjectPageData): RequestSettingsForm {
  const settings = data.lifecycle.requestSystem?.settings;

  return {
    enabled: settings?.enabled ?? false,
    requestMode: settings?.requestMode ?? 'both',
    allowOffScheduleRequests: settings?.allowOffScheduleRequests ?? false,
    reason: ''
  };
}

export function createSpecializedRequestForm(): SpecializedRequestForm {
  return {
    requestUse: 'project',
    itemSummary: '',
    pickupLabel: '',
    destinationLabel: '',
    description: '',
    needsDelivery: false
  };
}

export function currentCollectiveSubtype(data: ProjectPageData): ProjectSubtype {
  return data.lifecycle.currentSubtype ?? data.projectSubtype ?? 'standard';
}

export function requestComposerCopy(subtype: ProjectSubtype): RequestComposerCopy {
  switch (subtype) {
    case 'asset-management':
      return {
        sectionTitle: 'Asset requests',
        actionLabel: 'Request assets',
        composerTitle: 'Create asset request',
        descriptionLabel: 'Description',
        descriptionPlaceholder:
          'Describe the land access, asset support, storage need, or handoff coordination needed during this time.',
        startLabel: 'Requested start',
        endLabel: 'Requested finish',
        submitLabel: 'Create request',
        selectionHelp:
          'Use this form when the inventory list is not the entry point for asset-management work.',
        usesAssetFields: true,
        usesDeliveryFields: false,
        itemLabel: 'Asset, site use, or handoff need',
        itemPlaceholder: 'What needs managing, moving, reserving, or supporting?'
      };
    default:
      return {
        sectionTitle: 'Requests',
        actionLabel: 'Request service',
        composerTitle: 'Create request',
        descriptionLabel: 'Request details',
        descriptionPlaceholder: 'What should happen during this requested window?',
        startLabel: 'Requested start',
        endLabel: 'Requested finish',
        submitLabel: 'Create request',
        selectionHelp: 'Use this form to request service during the selected time.',
        usesAssetFields: false,
        usesDeliveryFields: false,
        titlePlaceholder: 'Request title',
        bodyPlaceholder: 'What should happen during this requested window?'
      };
  }
}

export function buildSpecializedRequestPayload(
  subtype: ProjectSubtype,
  form: SpecializedRequestForm,
  serviceRequestForm: { title: string; body: string }
) {
  if (subtype === 'asset-management') {
    const itemSummary = form.itemSummary.trim();
    const description = form.description.trim();

    if (!itemSummary || !description) {
      return null;
    }

    return {
      title: `Asset request: ${itemSummary}`,
      body: [
        `Use type: ${form.requestUse === 'project' ? 'Project use' : 'Individual use'}`,
        `Delivery needed: ${form.needsDelivery ? 'Yes' : 'No'}`,
        `Asset-management need: ${itemSummary}`,
        '',
        description
      ].join('\n')
    };
  }

  const title = serviceRequestForm.title.trim();
  const body = serviceRequestForm.body.trim();

  if (!title || !body) {
    return null;
  }

  return { title, body };
}
