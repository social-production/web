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
  valueConsiderationNotes?: Record<string, string>;
  planPhases: Array<{ title: string; details: string; materials?: string[] }>;
  validationMessages?: string[];
  projectSubtype?: string;
  repositoryUrl?: string;
  scheduleMode?: string;
  scheduledDate?: string;
  rangeStartDate?: string;
  rangeEndDate?: string;
  startTimeLabel?: string;
  finishTimeLabel?: string;
  locationLabel?: string;
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
  | 'value-note'
  | 'schedule-mode'
  | 'schedule-date'
  | 'schedule-range'
  | 'schedule-time'
  | 'location'
  | 'subtype'
  | 'repository'
  | 'request-settings'
  | 'stage-title'
  | 'stage-details'
  | 'stage-materials'
  | 'review';

export interface PlanCreationStep {
  id: string;
  question: string;
  helper?: string;
  type: PlanCreationStepType;
  valueId?: string;
  valueLabel?: string;
  stageIndex?: number;
}

const SHARED_RUBRIC: PlanRubricCriterion[] = [
  { id: 'rubric:title-clarity', kind: 'rubric', label: 'Is the title clear and specific?' },
  {
    id: 'rubric:description-clarity',
    kind: 'rubric',
    label: 'Does the description explain what will actually happen and why?'
  },
  {
    id: 'rubric:demand-response',
    kind: 'rubric',
    label: 'Does this plan respond well to the current demand signals?'
  },
  {
    id: 'rubric:achievability',
    kind: 'rubric',
    label: 'Does this plan seem realistically achievable?'
  },
  {
    id: 'rubric:stages-coherent',
    kind: 'rubric',
    label: 'Are the stages coherent and in a sensible order?'
  }
];

const EVENT_RUBRIC: PlanRubricCriterion[] = [
  { id: 'rubric:timing-suitable', kind: 'rubric', label: 'Is the timing suitable?' },
  { id: 'rubric:duration-realistic', kind: 'rubric', label: 'Is the duration/schedule realistic?' },
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
  },
  {
    id: 'rubric:materials-realistic',
    kind: 'rubric',
    label: 'Are the listed materials/resources realistic?'
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
    label: 'Is the access/distribution approach appropriate?'
  },
  {
    id: 'rubric:request-settings',
    kind: 'rubric',
    label: 'Are the request settings sensible?'
  },
  {
    id: 'rubric:off-schedule',
    kind: 'rubric',
    label: 'Is off-schedule handling appropriate?'
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

function stageSteps(stageCount: number, includeMaterials: boolean): PlanCreationStep[] {
  const steps: PlanCreationStep[] = [];

  for (let index = 0; index < stageCount; index += 1) {
    steps.push({
      id: `stage-${index}-title`,
      question: `What is stage ${index + 1} called?`,
      helper: 'Give this stage a short, specific title.',
      type: 'stage-title',
      stageIndex: index
    });
    steps.push({
      id: `stage-${index}-details`,
      question: `What happens in stage ${index + 1}?`,
      helper: 'Describe what this stage delivers or accomplishes.',
      type: 'stage-details',
      stageIndex: index
    });

    if (includeMaterials) {
      steps.push({
        id: `stage-${index}-materials`,
        question: `What materials or resources does stage ${index + 1} need?`,
        helper: 'List materials one at a time. You can add more than one.',
        type: 'stage-materials',
        stageIndex: index
      });
    }
  }

  return steps;
}

export function buildEventPlanCreationSteps(
  prominentValues: ProjectValueItem[],
  stageCount: number
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
    {
      id: 'demand-note',
      question: 'How does this plan respond to current demand signals?',
      helper: 'State whether this plan meets demand and explain any gap.',
      type: 'demand-note'
    }
  ];

  for (const value of prominentValues) {
    steps.push({
      id: `value-note-${value.id}`,
      question: `How does this plan address “${value.label}”?`,
      helper: 'Optional, but helps assessors understand your reasoning.',
      type: 'value-note',
      valueId: value.id,
      valueLabel: value.label
    });
  }

  steps.push(...stageSteps(stageCount, false));
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
  stageCount: number,
  options: { includeSubtype?: boolean; includeRepository?: boolean } = {}
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
      helper: 'Software plans need a repository link assessors can verify.',
      type: 'repository'
    });
  }

  steps.push({
    id: 'demand-note',
    question: 'How does this plan respond to current demand signals?',
    helper: 'State whether this plan meets demand and explain any gap.',
    type: 'demand-note'
  });

  for (const value of prominentValues) {
    steps.push({
      id: `value-note-${value.id}`,
      question: `How does this plan address “${value.label}”?`,
      helper: 'Optional, but helps assessors understand your reasoning.',
      type: 'value-note',
      valueId: value.id,
      valueLabel: value.label
    });
  }

  steps.push(...stageSteps(stageCount, true));
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
  stageCount: number
): PlanCreationStep[] {
  const steps: PlanCreationStep[] = [
    {
      id: 'plan-overview',
      question: 'What is this plan called, and what does it deliver?',
      helper: 'Use a clear title and explain how people will access or receive what is produced.',
      type: 'plan-overview'
    },
    {
      id: 'request-settings',
      question: 'How should requests work for this plan?',
      helper: 'Choose calendar, direct, or both, and whether off-schedule requests are allowed.',
      type: 'request-settings'
    },
    {
      id: 'demand-note',
      question: 'How does this plan respond to current demand signals?',
      helper: 'State whether this plan meets demand and explain any gap.',
      type: 'demand-note'
    }
  ];

  for (const value of prominentValues) {
    steps.push({
      id: `value-note-${value.id}`,
      question: `How does this plan address “${value.label}”?`,
      helper: 'Optional, but helps assessors understand your reasoning.',
      type: 'value-note',
      valueId: value.id,
      valueLabel: value.label
    });
  }

  steps.push(...stageSteps(stageCount, false));
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
      blocks.push({ label: 'Demand response', value: plan.demandConsiderationNote || 'No note provided.' });
      if (plan.demandSignalSnapshot != null) {
        blocks.push({
          label: 'Demand at posting',
          value: `${plan.demandSignalSnapshot} demand signals were active when this plan was posted.`
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
