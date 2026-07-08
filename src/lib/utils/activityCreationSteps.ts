import type { ProjectActivityRoleInput } from '$lib/types/detail';

export interface ActivityCreationForm {
  title: string;
  scheduledAt: string;
  endsAt: string;
  isOnline: boolean;
  locationLabel: string;
  onlineDetail: string;
  roleRequirements: ProjectActivityRoleInput[];
  linkedPlanPhaseId: string | null;
  note: string;
}

export type ActivityCreationStepType =
  | 'title'
  | 'schedule'
  | 'location'
  | 'plan-stage'
  | 'roles'
  | 'note'
  | 'review';

export interface ActivityCreationStep {
  id: string;
  question: string;
  helper?: string;
  type: ActivityCreationStepType;
}

export interface ActivityScheduleBounds {
  startLocal?: string | null;
  endLocal?: string | null;
}

export function createActivityCreationForm(
  locationLabel = '',
  linkedPlanPhaseId: string | null = null
): ActivityCreationForm {
  return {
    title: '',
    scheduledAt: '',
    endsAt: '',
    isOnline: false,
    locationLabel,
    onlineDetail: '',
    roleRequirements: [{ label: '', requiredCount: 1 }],
    linkedPlanPhaseId,
    note: ''
  };
}

export function composeActivityLocationLabel(form: ActivityCreationForm): string {
  if (form.isOnline) {
    const detail = form.onlineDetail.trim();
    return detail ? `Online · ${detail}` : 'Online';
  }

  return form.locationLabel.trim();
}

export function minimumParticipantsFromRoles(roleRequirements: ProjectActivityRoleInput[]) {
  return roleRequirements.reduce(
    (total, role) => total + Math.max(1, Number(role.requiredCount) || 1),
    0
  );
}

export function normalizedRoleRequirements(roleRequirements: ProjectActivityRoleInput[]) {
  return roleRequirements
    .map((role) => {
      const requiredCount = Math.max(1, Number(role.requiredCount) || 1);
      const parsedMaximumCount = Number(role.maximumCount);

      return {
        label: role.label.trim(),
        requiredCount,
        maximumCount: Number.isFinite(parsedMaximumCount)
          ? Math.max(requiredCount, Math.floor(parsedMaximumCount))
          : undefined
      };
    })
    .filter((role) => role.label);
}

export function buildActivityCreationSteps(hasPlanStages: boolean): ActivityCreationStep[] {
  const steps: ActivityCreationStep[] = [
    {
      id: 'title',
      type: 'title',
      question: 'What is this activity called?',
      helper: 'Give it a clear title so others know what they are signing up for.'
    },
    {
      id: 'schedule',
      type: 'schedule',
      question: 'When does it happen?',
      helper: 'Set a start and finish time for this activity.'
    },
    {
      id: 'location',
      type: 'location',
      question: 'Where does it happen?',
      helper: 'Mark it online or enter a place name. Location data will support maps and calendars later.'
    }
  ];

  if (hasPlanStages) {
    steps.push({
      id: 'plan-stage',
      type: 'plan-stage',
      question: 'Which plan stage does this support?',
      helper: 'Link the activity to a stage from the leading plan.'
    });
  }

  steps.push(
    {
      id: 'roles',
      type: 'roles',
      question: 'Who is needed?',
      helper: 'Define the roles others can sign up for.'
    },
    {
      id: 'note',
      type: 'note',
      question: 'What should happen?',
      helper: 'Describe what participants will do during this activity.'
    },
    {
      id: 'review',
      type: 'review',
      question: 'Review activity',
      helper: 'Check the details before creating this activity.'
    }
  );

  return steps;
}

export function validateActivityStep(
  step: ActivityCreationStep,
  form: ActivityCreationForm
): boolean {
  switch (step.type) {
    case 'title':
      return !!form.title.trim();
    case 'schedule': {
      if (!form.scheduledAt.trim() || !form.endsAt.trim()) {
        return false;
      }

      const startMs = new Date(form.scheduledAt).getTime();
      const endMs = new Date(form.endsAt).getTime();
      return !Number.isNaN(startMs) && !Number.isNaN(endMs) && endMs > startMs;
    }
    case 'location':
      return form.isOnline || !!form.locationLabel.trim();
    case 'plan-stage':
      return !!form.linkedPlanPhaseId;
    case 'roles':
      return normalizedRoleRequirements(form.roleRequirements).length > 0;
    case 'note':
      return !!form.note.trim();
    case 'review':
      return true;
    default:
      return false;
  }
}
