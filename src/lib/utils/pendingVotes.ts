import type {
  EventLifecyclePhaseChangeRequest,
  EventPageData,
  EventUpdateRequest,
  EventEditRequest,
  ProjectApprovalVote,
  ProjectEditRequest,
  ProjectLifecyclePhaseChangeRequest,
  ProjectPageData,
  ProjectPlanVoteSummary,
  ProjectProductionPlan,
  ProjectDistributionPlan,
  EventPlan,
  ProjectUpdateRequest
} from '$lib/types/detail';
import {
  effectiveEventPhaseChangeKind,
  effectiveProjectPhaseChangeKind,
  phaseChangeDecisionTitle,
  type PhaseChangeVoteKind
} from '$lib/utils/phaseChangeVotes';
import { scrollToPageAnchor } from '$lib/utils/scrollAnchors';

export type PendingVoteKind = 'phase_change' | 'update' | 'edit' | 'plan';

export interface PendingVoteItem {
  id: string;
  voteKind: PendingVoteKind;
  label: string;
  title: string;
  reason?: string;
  description?: string;
  criteriaRatedCount?: number;
  criteriaTotalCount?: number;
  planValueId?: string;
  planCriterionId?: string;
  planPhaseId?: 'phase-2' | 'phase-3';
  voteSummary: ProjectPlanVoteSummary;
  approvalThresholdPercent: number;
  authorUsername: string;
  createdAt: string;
  canVote: boolean;
}

function isUnvoted(activeVote: ProjectApprovalVote | null | undefined) {
  return activeVote == null;
}

function phaseChangeTitle(
  request: ProjectLifecyclePhaseChangeRequest | EventLifecyclePhaseChangeRequest,
  kind: PhaseChangeVoteKind
) {
  return phaseChangeDecisionTitle(
    kind,
    request.targetPhaseLabel,
    'closeOutcome' in request ? request.closeOutcome : undefined
  );
}

function resolveProjectPhaseChangeKind(request: ProjectLifecyclePhaseChangeRequest, data: ProjectPageData) {
  return effectiveProjectPhaseChangeKind(
    request,
    data.projectMode,
    data.lifecycle.currentPhaseId,
    data.lifecycle.phases
  );
}

function resolveEventPhaseChangeKind(request: EventLifecyclePhaseChangeRequest, data: EventPageData) {
  return effectiveEventPhaseChangeKind(
    request,
    data.lifecycle.currentPhaseId,
    data.lifecycle.phases
  );
}

function pushPhaseChangeVotes(
  items: PendingVoteItem[],
  requests: ProjectLifecyclePhaseChangeRequest[] | EventLifecyclePhaseChangeRequest[],
  canVote: boolean,
  data: ProjectPageData | EventPageData
) {
  if (!canVote) {
    return;
  }

  for (const request of requests) {
    if (!isUnvoted(request.voteSummary.activeVote)) {
      continue;
    }

    const kind =
      'projectMode' in data
        ? resolveProjectPhaseChangeKind(request as ProjectLifecyclePhaseChangeRequest, data)
        : resolveEventPhaseChangeKind(request as EventLifecyclePhaseChangeRequest, data);

    items.push({
      id: request.id,
      voteKind: 'phase_change',
      label: 'Phase decision',
      title: phaseChangeTitle(request, kind),
      reason: request.reason,
      voteSummary: request.voteSummary,
      approvalThresholdPercent: request.approvalThresholdPercent,
      authorUsername: request.authorUsername,
      createdAt: request.createdAt,
      canVote
    });
  }
}

function pushUpdateVotes(
  items: PendingVoteItem[],
  requests: ProjectUpdateRequest[] | EventUpdateRequest[],
  canVote: boolean
) {
  if (!canVote) {
    return;
  }

  for (const request of requests) {
    if (!isUnvoted(request.voteSummary.activeVote)) {
      continue;
    }

    items.push({
      id: request.id,
      voteKind: 'update',
      label: 'Update decision',
      title: 'Update proposal',
      reason: request.body,
      voteSummary: request.voteSummary,
      approvalThresholdPercent: request.approvalThresholdPercent,
      authorUsername: request.authorUsername,
      createdAt: request.createdAt,
      canVote
    });
  }
}

function pushEditVotes(
  items: PendingVoteItem[],
  requests: ProjectEditRequest[] | EventEditRequest[],
  canVote: boolean
) {
  if (!canVote) {
    return;
  }

  for (const request of requests) {
    if (!isUnvoted(request.voteSummary.activeVote)) {
      continue;
    }

    items.push({
      id: request.id,
      voteKind: 'edit',
      label: 'Edit decision',
      title: request.title,
      reason: request.description,
      voteSummary: request.voteSummary,
      approvalThresholdPercent: request.approvalThresholdPercent,
      authorUsername: request.authorUsername,
      createdAt: request.createdAt,
      canVote
    });
  }
}

function pushPlanVotes(
  items: PendingVoteItem[],
  plans: (ProjectProductionPlan | ProjectDistributionPlan | EventPlan)[],
  canVote: boolean,
  planPhaseId?: 'phase-2' | 'phase-3'
) {
  if (!canVote) {
    return;
  }

  for (const plan of plans) {
    const pendingCriterion = (plan.criterionAssessments ?? []).find(
      (assessment) => assessment.activeRating == null
    );
    if (pendingCriterion) {
      const criteria = plan.criterionAssessments ?? [];
      const ratedCount = criteria.filter((entry) => entry.activeRating != null).length;
      items.push({
        id: plan.id,
        voteKind: 'plan',
        label: 'Plan Assessment',
        title: plan.title,
        description: plan.description,
        planCriterionId: pendingCriterion.criterionId,
        criteriaRatedCount: ratedCount,
        criteriaTotalCount: criteria.length,
        planPhaseId,
        voteSummary: plan.overallApproval,
        approvalThresholdPercent: plan.overallApproval.quorumThresholdPercent,
        authorUsername: plan.authorUsername,
        createdAt: plan.createdAt,
        canVote
      });
      continue;
    }

    const pendingValue = plan.valueAssessments.find((assessment) => !assessment.activeVote);
    if (pendingValue) {
      items.push({
        id: plan.id,
        voteKind: 'plan',
        label: 'Plan value vote',
        title: plan.title,
        reason: `Vote on value: ${pendingValue.valueLabel}`,
        planValueId: pendingValue.valueId,
        planPhaseId,
        voteSummary: pendingValue,
        approvalThresholdPercent: pendingValue.quorumThresholdPercent,
        authorUsername: plan.authorUsername,
        createdAt: plan.createdAt,
        canVote
      });
      continue;
    }

    if (isUnvoted(plan.overallApproval.activeVote)) {
      items.push({
        id: plan.id,
        voteKind: 'plan',
        label: 'Plan approval vote',
        title: plan.title,
        reason: plan.description,
        planPhaseId,
        voteSummary: plan.overallApproval,
        approvalThresholdPercent: plan.overallApproval.quorumThresholdPercent,
        authorUsername: plan.authorUsername,
        createdAt: plan.createdAt,
        canVote
      });
    }
  }
}

export function collectProjectPendingVotes(data: ProjectPageData): PendingVoteItem[] {
  const items: PendingVoteItem[] = [];

  pushPhaseChangeVotes(items, data.lifecycle.phaseChangeRequests, data.lifecycle.viewerCanVoteOnPhaseChanges, data);
  pushUpdateVotes(items, data.updateRequests, data.viewerCanVoteOnUpdateRequests);
  pushEditVotes(items, data.editRequests, data.viewerCanVoteOnEditRequests);

  if (data.lifecycle.currentPhaseId === 'phase-2') {
    pushPlanVotes(items, data.lifecycle.phaseTwo.plans, data.lifecycle.phaseTwo.viewerCanVoteOnPlans, 'phase-2');
  } else if (data.lifecycle.currentPhaseId === 'phase-3') {
    pushPlanVotes(items, data.lifecycle.phaseThree.plans, data.lifecycle.phaseThree.viewerCanVoteOnPlans, 'phase-3');
  }

  return items;
}

export function collectEventPendingVotes(data: EventPageData): PendingVoteItem[] {
  const items: PendingVoteItem[] = [];

  pushPhaseChangeVotes(items, data.lifecycle.phaseChangeRequests, data.lifecycle.viewerCanVoteOnPhaseChanges, data);
  pushUpdateVotes(items, data.updateRequests, data.viewerCanVoteOnUpdateRequests);
  pushEditVotes(items, data.editRequests, data.viewerCanVoteOnEditRequests);

  if (data.lifecycle.currentPhaseId === 'event-plan') {
    pushPlanVotes(items, data.lifecycle.phaseTwo.plans, data.lifecycle.phaseTwo.viewerCanVoteOnPlans);
  }

  return items;
}

export function pendingVoteCardId(
  voteKind: PendingVoteKind,
  id: string,
  planValueId?: string,
  planCriterionId?: string
) {
  if (voteKind === 'plan' && planCriterionId) {
    return `vote-card-plan-${id}-criterion-${planCriterionId}`;
  }

  if (voteKind === 'plan' && planValueId) {
    return `vote-card-plan-${id}-value-${planValueId}`;
  }

  return `vote-card-${voteKind}-${id}`;
}

export function scrollToPendingVote(
  voteKind: PendingVoteKind | string,
  id: string,
  planValueId?: string,
  planCriterionId?: string
) {
  if (typeof document === 'undefined') {
    return;
  }

  scrollToPageAnchor('pending-votes-panel');

  requestAnimationFrame(() => {
    const cardId = pendingVoteCardId(voteKind as PendingVoteKind, id, planValueId, planCriterionId);
    scrollToPageAnchor(cardId);
    const card = document.getElementById(cardId);
    card?.classList.add('vote-card-highlight');
    window.setTimeout(() => card?.classList.remove('vote-card-highlight'), 1800);
  });
}
