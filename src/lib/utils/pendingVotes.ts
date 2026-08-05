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

export type PendingVoteKind =
  | 'phase_change'
  | 'update'
  | 'edit'
  | 'plan'
  | 'pull_request'
  | 'merge_capability'
  | 'repository_replacement'
  | 'pull_request_merge';

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
  actionLabel?: string;
  softwareStage?: string;
  voteSummary: ProjectPlanVoteSummary;
  approvalThresholdPercent: number;
  authorUsername: string;
  createdAt: string;
  canVote: boolean;
}

const EMPTY_VOTE_SUMMARY: ProjectPlanVoteSummary = {
  yesCount: 0,
  noCount: 0,
  totalVotes: 0,
  approvalPercent: 0,
  activeVote: null,
  meetsQuorum: false,
  eligibleVoterCount: 0,
  quorumThresholdPercent: 66,
  votesRequired: 0,
  votesRemaining: 0,
  remainingEligibleVotes: 0
};

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

function pushSoftwareGovernanceActions(items: PendingVoteItem[], data: ProjectPageData) {
  const governance = data.lifecycle.phaseFive?.softwareGovernance;
  if (!governance) {
    return;
  }

  for (const request of governance.pullRequests) {
    if (
      (request.stage === 'approval' || request.stage === 'confirmation') &&
      request.viewerCanVote &&
      request.voteSummary &&
      isUnvoted(request.voteSummary.activeVote) &&
      request.canStillPass &&
      !request.passesApprovalThreshold
    ) {
      const needsConfirmation = request.stage === 'confirmation';
      items.push({
        id: request.id,
        voteKind: 'pull_request',
        label: needsConfirmation ? 'Merge confirmation needed' : 'Pull request vote needed',
        title: request.title,
        reason: request.summary,
        description: needsConfirmation
          ? 'Confirm that the merge was completed correctly.'
          : 'Review the pull request details, then approve or reject.',
        voteSummary: request.voteSummary,
        approvalThresholdPercent: request.approvalThresholdPercent,
        authorUsername: request.authorUsername,
        createdAt: request.createdAt,
        canVote: false,
        actionLabel: 'Assess',
        softwareStage: request.stage
      });
    }

    if (request.stage === 'awaiting-merge' && request.viewerCanRecordMerge && !request.mergeId) {
      items.push({
        id: request.id,
        voteKind: 'pull_request_merge',
        label: 'Merge needed',
        title: request.title,
        reason: request.summary,
        description: 'A merge-capable member needs to record the merge commit or release ID.',
        voteSummary: request.voteSummary ?? EMPTY_VOTE_SUMMARY,
        approvalThresholdPercent: request.approvalThresholdPercent,
        authorUsername: request.authorUsername,
        createdAt: request.createdAt,
        canVote: false,
        actionLabel: 'Record merge',
        softwareStage: request.stage
      });
    }
  }

  for (const request of governance.mergeCapabilityChangeRequests) {
    if (
      !request.viewerCanVote ||
      !request.voteSummary ||
      !isUnvoted(request.voteSummary.activeVote) ||
      !request.canStillPass ||
      request.passesApprovalThreshold
    ) {
      continue;
    }

    items.push({
      id: request.id,
      voteKind: 'merge_capability',
      label: 'Merge capability vote needed',
      title: request.actionLabel,
      reason: `Member: ${request.targetMember.username}`,
      voteSummary: request.voteSummary,
      approvalThresholdPercent: request.approvalThresholdPercent,
      authorUsername: request.authorUsername,
      createdAt: request.createdAt,
      canVote: true
    });
  }

  for (const request of governance.repositoryReplacementRequests) {
    if (
      !request.viewerCanVote ||
      !request.voteSummary ||
      !isUnvoted(request.voteSummary.activeVote) ||
      !request.canStillPass ||
      request.passesApprovalThreshold
    ) {
      continue;
    }

    items.push({
      id: request.id,
      voteKind: 'repository_replacement',
      label: 'Repository replacement vote needed',
      title: request.repositoryUrl,
      reason: request.reason,
      voteSummary: request.voteSummary,
      approvalThresholdPercent: request.approvalThresholdPercent,
      authorUsername: request.authorUsername,
      createdAt: request.createdAt,
      canVote: true
    });
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

  pushSoftwareGovernanceActions(items, data);

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

  if (voteKind === 'link' || voteKind === 'link_sever') {
    requestAnimationFrame(() => {
      const cardId = `link-request-${id}`;
      scrollToPageAnchor(cardId);
      const card = document.getElementById(cardId);
      card?.classList.add('request-highlight');
      window.setTimeout(() => card?.classList.remove('request-highlight'), 1800);
    });
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
