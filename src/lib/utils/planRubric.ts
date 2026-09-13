import type {
  EventPlan,
  ProjectDistributionPlan,
  ProjectProductionPlan,
  ProjectValueItem
} from '$lib/types/detail';
import { formatEventPlanSchedule } from '$lib/utils/time';

export type PlanAssessmentContextPlan = EventPlan | ProjectProductionPlan | ProjectDistributionPlan;

export interface CriterionContextBlock {
  label: string;
  value: string;
}

export interface CriterionContext {
  headline: string;
  blocks: CriterionContextBlock[];
}

export type PlanCriterionRating = 1 | 2 | 3 | 4 | 5;
export type PlanCriterionKind = 'rubric' | 'value';
export type PlanComposerMode =
  | 'event'
  | 'project-production'
  | 'project-distribution';

export type PlanCreationForm = {
  title: string;
  description: string;
  demandConsiderationNote: string;
  valuesNote?: string;
  valueConsiderationNotes?: Record<string, string>;
  planPhases: Array<{ title: string; details: string; materials?: string[] }>;
  validationMessages?: string[];
  projectSubtype?: string;
  repositoryUrl?: string;
  licenseLabel?: string;
  scheduleMode?: string;
  scheduledDate?: string;
  rangeStartDate?: string;
  rangeEndDate?: string;
  startTimeLabel?: string;
  finishTimeLabel?: string;
  locationLabel?: string;
  locationId?: string | null;
  locationIsOnline?: boolean;
  distributionLocationLabel?: string;
  distributionLocationId?: string | null;
  distributionLocationIsOnline?: boolean;
  sameAsProductionLocation?: boolean;
  projectLocationId?: string | null;
  projectLocationLabel?: string;
  requestSystemEnabled?: boolean;
  requestMode?: 'calendar' | 'direct' | 'both';
  allowOffScheduleRequests?: boolean;
};

export const PLAN_RATING_OPTIONS: Array<{ value: PlanCriterionRating; label: string }> = [
  { value: 1, label: 'Strongly oppose' },
  { value: 2, label: 'Oppose' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Support' },
  { value: 5, label: 'Strongly support' }
];

export interface PlanRubricCriterion {
  id: string;
  kind: PlanCriterionKind;
  label: string;
  valueId?: string;
}

export interface PlanCriterionAssessment {
  criterionId: string;
  kind: PlanCriterionKind;
  label: string;
  valueId?: string;
  activeRating: PlanCriterionRating | null;
  averageRating: number;
  ratingCount: number;
  ratingDistribution: Record<PlanCriterionRating, number>;
}

export type PlanCreationStepType =
  | 'title'
  | 'description'
  | 'plan-overview'
  | 'demand-note'
  | 'values-note'
  | 'schedule-mode'
  | 'schedule-date'
  | 'schedule-range'
  | 'schedule-time'
  | 'location'
  | 'distribution-location'
  | 'subtype'
  | 'repository'
  | 'request-settings'
  | 'stages'
  | 'review';

export interface PlanCreationStep {
  id: string;
  question: string;
  helper?: string;
  type: PlanCreationStepType;
  values?: Array<{ id: string; label: string }>;
  includeMaterials?: boolean;
}

const SHARED_RUBRIC: PlanRubricCriterion[] = [
  {
    id: 'rubric:description-clarity',
    kind: 'rubric',
    label: 'Does the plan clearly explain what will happen and why?'
  },
  {
    id: 'rubric:achievability',
    kind: 'rubric',
    label: 'Does this plan seem realistically achievable?'
  }
];

const EVENT_RUBRIC: PlanRubricCriterion[] = [
  { id: 'rubric:timing-suitable', kind: 'rubric', label: 'Is the timing and schedule realistic?' },
  {
    id: 'rubric:location-appropriate',
    kind: 'rubric',
    label: 'Is the location appropriate and accessible?'
  }
];

const PROJECT_PRODUCTION_RUBRIC: PlanRubricCriterion[] = [
  {
    id: 'rubric:production-approach',
    kind: 'rubric',
    label: 'Is the proposed production approach appropriate?'
  }
];

const PROJECT_SOFTWARE_RUBRIC: PlanRubricCriterion[] = [
  {
    id: 'rubric:repository-clear',
    kind: 'rubric',
    label: 'Is the repository/setup clear enough?'
  }
];

const PROJECT_DISTRIBUTION_RUBRIC: PlanRubricCriterion[] = [
  {
    id: 'rubric:access-approach',
    kind: 'rubric',
    label: 'Is the access and request approach appropriate?'
  }
];

export function valueCriterionId(valueId: string) {
  return `value:${valueId}`;
}

export function buildValueCriteria(values: ProjectValueItem[]): PlanRubricCriterion[] {
  return values
    .filter((value) => value.importanceScore >= 5)
    .map((value) => ({
      id: valueCriterionId(value.id),
      kind: 'value' as const,
      label: `How well does this plan satisfy “${value.label}”?`,
      valueId: value.id
    }));
}

export function buildAssessmentCriteria(
  mode: PlanComposerMode,
  prominentValues: ProjectValueItem[],
  options: { projectSubtype?: string; includeSoftwareRubric?: boolean } = {}
): PlanRubricCriterion[] {
  const criteria = [...SHARED_RUBRIC];

  if (mode === 'event') {
    criteria.push(...EVENT_RUBRIC);
  } else if (mode === 'project-production') {
    criteria.push(...PROJECT_PRODUCTION_RUBRIC);
    if (options.includeSoftwareRubric || options.projectSubtype === 'software') {
      criteria.push(...PROJECT_SOFTWARE_RUBRIC);
    }
  } else {
    criteria.push(...PROJECT_DISTRIBUTION_RUBRIC);
  }

  criteria.push(...buildValueCriteria(prominentValues));
  return criteria;
}

const DEMAND_NOTE_HELPER =
  'Support signals show how many people want this to exist right now. Assessors compare every plan against that need, so say whether your plan meets it and what gap remains.';

const VALUES_NOTE_HELPER =
  'These are the values the community rated most important for this proposal. One short note is enough — assessors see it when they rate your plan against each value.';

function demandNoteStep(): PlanCreationStep {
  return {
    id: 'demand-note',
    question: 'How does this plan respond to current support?',
    helper: DEMAND_NOTE_HELPER,
    type: 'demand-note'
  };
}

function valuesNoteStep(prominentValues: ProjectValueItem[]): PlanCreationStep[] {
  if (prominentValues.length === 0) {
    return [];
  }
  return [
    {
      id: 'values-note',
      question: 'How does this plan serve the shared values?',
      helper: VALUES_NOTE_HELPER,
      type: 'values-note',
      values: prominentValues.map((value) => ({ id: value.id, label: value.label }))
    }
  ];
}

function stagesStep(includeMaterials: boolean): PlanCreationStep {
  return {
    id: 'stages',
    question: 'What are the stages of this plan?',
    helper: includeMaterials
      ? 'Break the work into stages. Each stage needs a title and details; add materials where they matter. You can add, remove, and reorder stages.'
      : 'Break the work into stages. Each stage needs a title and details. You can add, remove, and reorder stages.',
    type: 'stages',
    includeMaterials
  };
}

export function buildEventPlanCreationSteps(
  prominentValues: ProjectValueItem[]
): PlanCreationStep[] {
  const steps: PlanCreationStep[] = [
    {
      id: 'plan-overview',
      question: 'What is this plan called, and what does it do?',
      helper: 'Use a clear title and explain what will happen and why this plan is worth considering.',
      type: 'plan-overview'
    },
    {
      id: 'schedule-mode',
      question: 'How should the event be scheduled?',
      helper: 'Choose a single date or a date range.',
      type: 'schedule-mode'
    },
    {
      id: 'schedule-date',
      question: 'Which date should the event use?',
      type: 'schedule-date'
    },
    {
      id: 'schedule-range',
      question: 'What date range should the event cover?',
      type: 'schedule-range'
    },
    {
      id: 'schedule-time',
      question: 'What are the start and finish times?',
      helper: 'Marked plan days become the days where activity can be scheduled from the calendar.',
      type: 'schedule-time'
    },
    {
      id: 'location',
      question: 'Where will this event happen?',
      type: 'location'
    },
    demandNoteStep()
  ];

  steps.push(...valuesNoteStep(prominentValues));
  steps.push(stagesStep(false));
  steps.push({
    id: 'review',
    question: 'Review your plan before submitting',
    helper: 'Check each section, then submit when you are ready.',
    type: 'review'
  });

  return steps;
}

export function buildProjectProductionCreationSteps(
  prominentValues: ProjectValueItem[],
  options: { includeSubtype?: boolean; includeRepository?: boolean; includeLocation?: boolean } = {}
): PlanCreationStep[] {
  const steps: PlanCreationStep[] = [
    {
      id: 'plan-overview',
      question: 'What is this plan called, and what does it deliver?',
      helper: 'Use a clear title and explain what will be produced and why this approach makes sense.',
      type: 'plan-overview'
    }
  ];

  if (options.includeSubtype) {
    steps.push({
      id: 'subtype',
      question: 'What type of production plan is this?',
      type: 'subtype'
    });
  }

  if (options.includeRepository) {
    steps.push({
      id: 'repository',
      question: 'What is the official repository URL?',
      helper:
        'Link a public repository under AGPL v3. Assessors need a place they can verify, and the license keeps the software in the commons.',
      type: 'repository'
    });
  }

  if (options.includeLocation) {
    steps.push({
      id: 'location',
      question: 'Where will production or operations happen?',
      helper: 'Choose the primary project or production site.',
      type: 'location'
    });
  }

  steps.push(demandNoteStep());
  steps.push(...valuesNoteStep(prominentValues));
  steps.push(stagesStep(true));
  steps.push({
    id: 'review',
    question: 'Review your plan before submitting',
    helper: 'Check each section, then submit when you are ready.',
    type: 'review'
  });

  return steps;
}

export function buildProjectDistributionCreationSteps(
  prominentValues: ProjectValueItem[],
  options: { includeRequestSettings?: boolean; includeDistributionLocation?: boolean } = {}
): PlanCreationStep[] {
  const steps: PlanCreationStep[] = [
    {
      id: 'plan-overview',
      question: 'What is this plan called, and what does it deliver?',
      helper: 'Use a clear title and explain how people will access or receive what is produced.',
      type: 'plan-overview'
    }
  ];

  if (options.includeRequestSettings) {
    steps.push({
      id: 'request-settings',
      question: 'How should requests work for this plan?',
      helper: 'Choose calendar, direct, or both, and whether off-schedule requests are allowed.',
      type: 'request-settings'
    });
  }

  if (options.includeDistributionLocation) {
    steps.push({
      id: 'distribution-location',
      question: 'Where will distribution or access happen?',
      helper: 'This can be the same address as the production plan location.',
      type: 'distribution-location'
    });
  }

  steps.push(demandNoteStep());
  steps.push(...valuesNoteStep(prominentValues));
  steps.push(stagesStep(false));
  steps.push({
    id: 'review',
    question: 'Review your plan before submitting',
    helper: 'Check each section, then submit when you are ready.',
    type: 'review'
  });

  return steps;
}

export function ratingLabel(rating: PlanCriterionRating | null | undefined) {
  return PLAN_RATING_OPTIONS.find((option) => option.value === rating)?.label ?? 'Not rated';
}

export function allCriteriaRated(assessments: PlanCriterionAssessment[]) {
  return assessments.length === 0 || assessments.every((entry) => entry.activeRating != null);
}

function stageBlocks(plan: PlanAssessmentContextPlan): CriterionContextBlock[] {
  return plan.planPhases.map((phase, index) => {
    const parts = [phase.details];
    if ('materialsLabel' in phase && phase.materialsLabel) {
      parts.push(`Materials: ${phase.materialsLabel}`);
    }
    return {
      label: `Stage ${index + 1}: ${phase.title}`,
      value: parts.join('\n')
    };
  });
}

function valueNoteForPlan(plan: PlanAssessmentContextPlan, valueId: string | undefined) {
  if (!valueId) {
    return '';
  }
  return plan.valueConsiderationNotes?.[valueId]?.trim() ?? '';
}

export function getCriterionContext(
  criterionId: string,
  plan: PlanAssessmentContextPlan,
  criterionLabel?: string
): CriterionContext {
  const blocks: CriterionContextBlock[] = [];
  let headline = plan.title;

  if (criterionId.startsWith('value:')) {
    const valueId = criterionId.slice('value:'.length);
    headline = criterionLabel ?? `Shared value`;
    blocks.push({ label: 'Plan title', value: plan.title });
    blocks.push({ label: 'Plan description', value: plan.description });
    const note = valueNoteForPlan(plan, valueId);
    if (note) {
      blocks.push({ label: 'Author note on this value', value: note });
    }
    return { headline, blocks };
  }

  switch (criterionId) {
    case 'rubric:title-clarity':
      blocks.push({ label: 'Title', value: plan.title });
      break;
    case 'rubric:description-clarity':
      blocks.push({ label: 'Description', value: plan.description });
      break;
    case 'rubric:demand-response':
      blocks.push({ label: 'Support response', value: plan.demandConsiderationNote || 'No note provided.' });
      if (plan.demandSignalSnapshot != null) {
        blocks.push({
          label: 'Support at posting',
          value: `${plan.demandSignalSnapshot} support signals were active when this plan was posted.`
        });
      }
      break;
    case 'rubric:achievability':
      blocks.push({ label: 'Description', value: plan.description });
      blocks.push(...stageBlocks(plan));
      break;
    case 'rubric:stages-coherent':
      blocks.push(...stageBlocks(plan));
      break;
    case 'rubric:timing-suitable':
    case 'rubric:duration-realistic':
      if ('schedule' in plan) {
        blocks.push({
          label: 'Schedule',
          value: formatEventPlanSchedule(plan.schedule) || plan.schedule.label || 'Not specified'
        });
      }
      break;
    case 'rubric:location-appropriate':
      if ('locationLabel' in plan) {
        blocks.push({ label: 'Location', value: plan.locationLabel || 'Not specified' });
      }
      break;
    case 'rubric:production-approach':
      blocks.push({ label: 'Description', value: plan.description });
      blocks.push(...stageBlocks(plan));
      break;
    case 'rubric:materials-realistic':
      blocks.push(...stageBlocks(plan));
      break;
    case 'rubric:repository-clear':
      if ('repositoryUrl' in plan) {
        blocks.push({
          label: 'Repository',
          value: plan.repositoryUrl?.trim() || 'No repository link provided.'
        });
      }
      break;
    case 'rubric:access-approach':
      blocks.push({ label: 'Description', value: plan.description });
      blocks.push(...stageBlocks(plan));
      break;
    case 'rubric:request-settings':
      if ('requestSystemEnabled' in plan) {
        blocks.push({
          label: 'Request system',
          value: plan.requestSystemEnabled ? 'Enabled' : 'Disabled'
        });
        if (plan.requestSystemEnabled) {
          const mode =
            plan.requestMode === 'calendar'
              ? 'Calendar only'
              : plan.requestMode === 'direct'
                ? 'Direct only'
                : 'Calendar and direct';
          blocks.push({ label: 'Request mode', value: mode });
          blocks.push({
            label: 'Off-schedule requests',
            value: plan.allowOffScheduleRequests ? 'Allowed' : 'Slot-bound only'
          });
        }
      }
      break;
    case 'rubric:off-schedule':
      if ('allowOffScheduleRequests' in plan) {
        blocks.push({
          label: 'Off-schedule requests',
          value: plan.allowOffScheduleRequests ? 'Allowed' : 'Slot-bound only'
        });
      }
      break;
    default:
      blocks.push({ label: 'Plan', value: plan.title });
      blocks.push({ label: 'Description', value: plan.description });
  }

  return { headline, blocks };
}

export function criterionStepIndex(criterionId: string, criteria: PlanCriterionAssessment[]) {
  const index = criteria.findIndex((entry) => entry.criterionId === criterionId);
  return index >= 0 ? index : 0;
}
