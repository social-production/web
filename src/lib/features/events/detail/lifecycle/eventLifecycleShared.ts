import type {
  EventPlan,
  EventLifecyclePhase,
  EventPlanScheduleInput,
  EventPlanScheduleMode,
  ProjectActivityRoleInput,
  ProjectApprovalVote,
  ProjectImportanceVoteValue
} from '$lib/types/detail';
import { suggestedEventActivityWindow } from '$lib/utils/eventSchedule';

export type DraftPlanPhase = {
  title: string;
  details: string;
};

export type EventPlanForm = {
  title: string;
  description: string;
  demandConsiderationNote: string;
  valueConsiderationNotes?: Record<string, string>;
  scheduleMode: EventPlanScheduleMode;
  scheduledDate: string;
  rangeStartDate: string;
  rangeEndDate: string;
  startTimeLabel: string;
  finishTimeLabel: string;
  locationLabel: string;
  planPhases: DraftPlanPhase[];
  validationMessages?: string[];
};

export type EventActivityForm = {
  title: string;
  scheduledAt: string;
  endsAt: string;
  locationLabel: string;
  roleRequirements: ProjectActivityRoleInput[];
  linkedPlanPhaseId: string | null;
  note: string;
};

export type EventLifecycleTabItem = {
  phase: EventLifecyclePhase;
  title: string;
  progressLabel: string;
  isFuture: boolean;
};

export const importanceOptions: Array<{ value: ProjectImportanceVoteValue; label: string }> = Array.from(
  { length: 10 },
  (_, index) => {
    const value = (index + 1) as ProjectImportanceVoteValue;

    return {
      value,
      label: value === 1 ? 'Unnecessary' : value === 10 ? 'Required' : `Importance ${value} of 10`
    };
  }
);

export function createDraftPlanPhase(): DraftPlanPhase {
  return {
    title: '',
    details: ''
  };
}

export function createDraftActivityRole(): ProjectActivityRoleInput {
  return {
    label: '',
    requiredCount: 1
  };
}

export function createEventPlanForm(): EventPlanForm {
  return {
    title: '',
    description: '',
    demandConsiderationNote: '',
    valueConsiderationNotes: {},
    scheduleMode: 'date',
    scheduledDate: '',
    rangeStartDate: '',
    rangeEndDate: '',
    startTimeLabel: '',
    finishTimeLabel: '',
    locationLabel: '',
    planPhases: [createDraftPlanPhase()],
    validationMessages: []
  };
}

export function eventPlanScheduleFromForm(form: EventPlanForm): EventPlanScheduleInput {
  if (form.scheduleMode === 'date') {
    return {
      mode: 'date',
      startDate: form.scheduledDate || null,
      startTimeLabel: form.startTimeLabel || null,
      finishTimeLabel: form.finishTimeLabel || null
    };
  }

  if (form.scheduleMode === 'range') {
    return {
      mode: 'range',
      startDate: form.rangeStartDate || null,
      endDate: form.rangeEndDate || null,
      startTimeLabel: form.startTimeLabel || null,
      finishTimeLabel: form.finishTimeLabel || null
    };
  }

  return {
    mode: 'any-day',
    startTimeLabel: form.startTimeLabel || null,
    finishTimeLabel: form.finishTimeLabel || null
  };
}

export function createEventActivityForm(
  locationLabel: string,
  linkedPlanPhaseId: string | null
): EventActivityForm {
  return {
    title: '',
    scheduledAt: '',
    endsAt: '',
    locationLabel,
    roleRequirements: [createDraftActivityRole()],
    linkedPlanPhaseId,
    note: ''
  };
}

export function eventPlanSuggestedDayIso(plan: Pick<EventPlan, 'schedule'> | null) {
  if (!plan) {
    return '';
  }

  return plan.schedule.mode === 'date' || plan.schedule.mode === 'range'
    ? plan.schedule.startDate ?? ''
    : '';
}

function isoDayValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function eventPlanScheduledDayIsos(plan: Pick<EventPlan, 'schedule'> | null) {
  const startDate = plan?.schedule.startDate ?? '';

  if (!startDate) {
    return [];
  }

  const start = new Date(`${startDate}T00:00:00`);

  if (Number.isNaN(start.getTime())) {
    return [];
  }

  const endDate =
    plan?.schedule.mode === 'range' && plan.schedule.endDate ? plan.schedule.endDate : startDate;
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(end.getTime()) || end.getTime() < start.getTime()) {
    return [startDate];
  }

  const days: string[] = [];
  const cursor = new Date(start);

  while (cursor.getTime() <= end.getTime()) {
    days.push(isoDayValue(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

export function eventPlanDefaultActivityWindow(
  plan: Pick<EventPlan, 'schedule'> | null,
  isoDay = ''
) {
  const dayIso = isoDay || eventPlanSuggestedDayIso(plan);

  if (!dayIso) {
    return {
      scheduledAt: '',
      endsAt: ''
    };
  }

  return suggestedEventActivityWindow(plan?.schedule ?? null, dayIso);
}

export function eventPlanDefaultLocationLabel(plan: Pick<EventPlan, 'locationLabel'> | null) {
  return plan?.locationLabel?.trim() || '';
}

export function minimumParticipantsFromRoles(roleRequirements: ProjectActivityRoleInput[]) {
  return roleRequirements.reduce(
    (total, role) => total + Math.max(1, Number(role.requiredCount) || 1),
    0
  );
}

export function nextVote(activeVote: ProjectApprovalVote | null, vote: ProjectApprovalVote) {
  return activeVote === vote ? null : vote;
}