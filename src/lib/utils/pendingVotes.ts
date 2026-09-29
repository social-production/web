import type {
  EventLifecyclePhaseChangeRequest,
  EventPageData,
  EventUpdateRequest,
  EventEditRequest,
  DecisionHistoryEntry,
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
  | 'pull_request_merge'
  | 'request_settings';

export interface PendingVoteItem {
  id: string;
  voteKind: PendingVoteKind;
  label: string;
  title: string;
  reason?: string;
  description?: string;
  previousTitle?: string;
  previousDescription?: string;
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
  data: ProjectPageData | EventPageData,
  includeCast = false
) {
  if (!canVote) {
    return;
  }

  for (const request of requests) {
    if (!includeCast && !isUnvoted(request.voteSummary.activeVote)) {
      continue;
    }

    const kind =
      'projectMode' in data
        ? resolveProjectPhaseChangeKind(request as ProjectLifecyclePhaseChangeRequest, data)
        : resolveEventPhaseChangeKind(request as EventLifecyclePhaseChangeRequest, data);

    items.push({
      id: request.id,
      voteKind: 'phase_change',
      label: 'Phase',
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
  canVote: boolean,
  includeCast = false
) {
  if (!canVote) {
    return;
  }

  for (const request of requests) {
    if (!includeCast && !isUnvoted(request.voteSummary.activeVote)) {
      continue;
    }

    items.push({
      id: request.id,
      voteKind: 'update',
      label: 'Update',
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
  canVote: boolean,
  currentTitle: string,
  currentDescription: string,
  includeCast = false
) {
  if (!canVote) {
    return;
  }

  for (const request of requests) {
    if (!includeCast && !isUnvoted(request.voteSummary.activeVote)) {
      continue;
    }

    items.push({
      id: request.id,
      voteKind: 'edit',
      label: 'Edit',
      title: request.title,
      reason: request.description,
      previousTitle: currentTitle,
      previousDescription: currentDescription,
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
  planPhaseId?: 'phase-2' | 'phase-3',
  includeCast = false
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
        label: 'Plan',
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
        label: 'Plan value',
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

    if (includeCast || isUnvoted(plan.overallApproval.activeVote)) {
      items.push({
        id: plan.id,
        voteKind: 'plan',
        label: 'Plan',
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

function pushRequestSettingsVotes(items: PendingVoteItem[], data: ProjectPageData, includeCast = false) {
  const system = data.lifecycle.requestSystem;
  if (!system?.viewerCanVoteOnSettingsChanges) {
    return;
  }

  for (const request of system.settingsChangeRequests) {
    if (!includeCast && !isUnvoted(request.voteSummary.activeVote)) {
      continue;
    }

    items.push({
      id: request.id,
      voteKind: 'request_settings',
      label: 'Request settings',
      title: request.proposedSettings.summary,
      reason: request.reason,
      voteSummary: request.voteSummary,
      approvalThresholdPercent: request.approvalThresholdPercent,
      authorUsername: request.authorUsername,
      createdAt: request.createdAt,
      canVote: true
    });
  }
}

function pushSoftwareGovernanceActions(items: PendingVoteItem[], data: ProjectPageData, includeCast = false) {
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
        label: needsConfirmation ? 'Merge' : 'Pull request',
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
        label: 'Merge',
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
      (!includeCast && !isUnvoted(request.voteSummary.activeVote)) ||
      !request.canStillPass ||
      request.passesApprovalThreshold
    ) {
      continue;
    }

    items.push({
      id: request.id,
      voteKind: 'merge_capability',
      label: 'Merge capability',
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
      (!includeCast && !isUnvoted(request.voteSummary.activeVote)) ||
      !request.canStillPass ||
      request.passesApprovalThreshold
    ) {
      continue;
    }

    items.push({
      id: request.id,
      voteKind: 'repository_replacement',
      label: 'Repository',
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

export function collectProjectPendingVotes(data: ProjectPageData, includeCast = false): PendingVoteItem[] {
  const items: PendingVoteItem[] = [];

  pushPhaseChangeVotes(
    items,
    data.lifecycle.phaseChangeRequests,
    data.lifecycle.viewerCanVoteOnPhaseChanges,
    data,
    includeCast
  );
  pushUpdateVotes(items, data.updateRequests, data.viewerCanVoteOnUpdateRequests, includeCast);
  pushEditVotes(
    items,
    data.editRequests,
    data.viewerCanVoteOnEditRequests,
    data.title,
    data.description,
    includeCast
  );

  if (data.lifecycle.currentPhaseId === 'phase-2') {
    pushPlanVotes(
      items,
      data.lifecycle.phaseTwo.plans,
      data.lifecycle.phaseTwo.viewerCanVoteOnPlans,
      'phase-2',
      includeCast
    );
  } else if (data.lifecycle.currentPhaseId === 'phase-3') {
    pushPlanVotes(
      items,
      data.lifecycle.phaseThree.plans,
      data.lifecycle.phaseThree.viewerCanVoteOnPlans,
      'phase-3',
      includeCast
    );
  }

  pushRequestSettingsVotes(items, data, includeCast);
  pushSoftwareGovernanceActions(items, data, includeCast);

  return items;
}

export function isPlanSurfaceVote(item: PendingVoteItem) {
  return item.voteKind === 'plan' && !item.planValueId;
}

export function hubActionVotes(items: PendingVoteItem[]) {
  return items.filter((item) => !isPlanSurfaceVote(item));
}

export function collectEventPendingVotes(data: EventPageData, includeCast = false): PendingVoteItem[] {
  const items: PendingVoteItem[] = [];

  pushPhaseChangeVotes(
    items,
    data.lifecycle.phaseChangeRequests,
    data.lifecycle.viewerCanVoteOnPhaseChanges,
    data,
    includeCast
  );
  pushUpdateVotes(items, data.updateRequests, data.viewerCanVoteOnUpdateRequests, includeCast);
  pushEditVotes(
    items,
    data.editRequests,
    data.viewerCanVoteOnEditRequests,
    data.title,
    data.description,
    includeCast
  );

  if (data.lifecycle.currentPhaseId === 'event-plan') {
    pushPlanVotes(items, data.lifecycle.phaseTwo.plans, data.lifecycle.phaseTwo.viewerCanVoteOnPlans, undefined, includeCast);
  }

  return items;
}

export function historyEntryToVoteItem(entry: DecisionHistoryEntry): PendingVoteItem {
  const payload = entry.payload;
  const base: PendingVoteItem = {
    id: entry.id,
    voteKind: 'phase_change',
    label: entry.kindLabel,
    title: entry.kindLabel,
    voteSummary: entry.voteSummary,
    approvalThresholdPercent: entry.approvalThresholdPercent,
    authorUsername: entry.authorUsername,
    createdAt: entry.createdAt,
    canVote: entry.status === 'open' && entry.canVote
  };

  if (payload.type === 'edit') {
    const title = payload.changes.find((change) => change.label === 'Title');
    const description = payload.changes.find((change) => change.label === 'Description');
    return {
      ...base,
      voteKind: 'edit',
      label: 'Edit',
      title: title?.after ?? '',
      previousTitle: title?.before ?? '',
      reason: description?.after ?? '',
      previousDescription: description?.before ?? ''
    };
  }

  if (payload.type === 'update') {
    return { ...base, voteKind: 'update', label: 'Update', title: 'Update', reason: payload.body };
  }

  if (payload.type === 'phase-change') {
    return {
      ...base,
      voteKind: 'phase_change',
      label: 'Phase',
      title: `${payload.fromPhaseLabel} → ${payload.toPhaseLabel}`,
      reason: payload.reason
    };
  }

  if (payload.type === 'pull-request') {
    return {
      ...base,
      voteKind: 'pull_request',
      label: 'Pull request',
      title: payload.title,
      description: payload.summary,
      reason: payload.pullRequestId
    };
  }

  if (payload.type === 'merge-capability') {
    return {
      ...base,
      voteKind: 'merge_capability',
      label: 'Merge capability',
      title: payload.targetUsername,
      reason: payload.actionLabel
    };
  }

  if (payload.type === 'repository-replacement') {
    return {
      ...base,
      voteKind: 'repository_replacement',
      label: 'Repository',
      title: payload.repositoryUrl,
      description: payload.previousRepositoryUrl ?? undefined,
      reason: payload.reason
    };
  }

  if (payload.type === 'link') {
    return {
      ...base,
      label: payload.requestType === 'sever' ? 'Sever' : 'Link',
      title: payload.counterpartTitle,
      reason: payload.summary,
      description: `${payload.thisSideLabel} · ${payload.otherSideLabel}`
    };
  }

  return {
    ...base,
    voteKind: 'request_settings',
    label: 'Request settings',
    title: payload.proposedSettings.summary,
    description: payload.previousSettings.summary,
    reason: payload.reason
  };
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
