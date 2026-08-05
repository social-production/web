import type {
  DetailLinkTargetDetail,
  ProjectManualLinkVoteState,
  ProjectPlanVoteSummary
} from '$lib/types/detail';
import {
  formatProjectVoteRequirement,
  formatProjectVoteSummary
} from '$lib/utils/projectVotes';

export const LINK_APPROVAL_THRESHOLD_PERCENT = 66;

/** Treat empty / placeholder metadata as absent so TBD never clutters the card. */
export function meaningfulLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.toLowerCase();
  if (normalized === 'tbd' || normalized === 'location tbd' || normalized === 'time tbd') {
    return null;
  }
  return trimmed;
}

export function detailMetaRows(detail: {
  stageLabel?: string | null;
  locationLabel?: string | null;
  timeLabel?: string | null;
  memberCount?: number | null;
}): string[] {
  const rows: string[] = [];
  const stage = meaningfulLabel(detail.stageLabel);
  const location = meaningfulLabel(detail.locationLabel);
  const time = meaningfulLabel(detail.timeLabel);

  if (stage) rows.push(stage);
  if (location) rows.push(location);
  if (time) rows.push(time);
  if (typeof detail.memberCount === 'number') {
    rows.push(`${detail.memberCount} members`);
  }

  return rows;
}

export function targetDetailMetaRows(detail: DetailLinkTargetDetail | null | undefined): string[] {
  if (!detail) return [];
  return detailMetaRows(detail);
}

export function sideVoteLines(input: {
  sourceTitle?: string | null;
  sourceVoteLabel?: string | null;
  targetTitle?: string | null;
  targetVoteLabel?: string | null;
}): string[] {
  const lines: string[] = [];
  if (input.sourceTitle && input.sourceVoteLabel) {
    lines.push(`${input.sourceTitle}: ${input.sourceVoteLabel}`);
  }
  if (input.targetTitle && input.targetVoteLabel) {
    lines.push(`${input.targetTitle}: ${input.targetVoteLabel}`);
  }
  return lines;
}

/** Card title should always be the opposing / counterpart record. */
export function opposingLinkTitle(input: {
  title?: string | null;
  otherRecordTitle?: string | null;
  targetTitle?: string | null;
}): string {
  return (input.title || input.otherRecordTitle || input.targetTitle || '').trim();
}

export function toLinkVoteSummary(vote: ProjectManualLinkVoteState): ProjectPlanVoteSummary {
  const totalVotes = vote.yesCount + vote.noCount;
  const remainingEligibleVotes = Math.max(0, vote.memberCount - totalVotes);

  return {
    yesCount: vote.yesCount,
    noCount: vote.noCount,
    totalVotes,
    approvalPercent: Math.round(vote.approvalPercent),
    activeVote: vote.viewerVote ?? null,
    meetsQuorum: totalVotes >= vote.approvalsRequired,
    eligibleVoterCount: vote.memberCount,
    quorumThresholdPercent:
      vote.memberCount > 0 ? (vote.approvalsRequired / vote.memberCount) * 100 : 0,
    votesRequired: vote.approvalsRequired,
    votesRemaining: vote.approvalsRemaining,
    remainingEligibleVotes
  };
}

export function formatLinkVoteSummary(vote: ProjectManualLinkVoteState) {
  return formatProjectVoteSummary(toLinkVoteSummary(vote));
}

export function formatLinkVoteRequirement(vote: ProjectManualLinkVoteState) {
  return formatProjectVoteRequirement(toLinkVoteSummary(vote), LINK_APPROVAL_THRESHOLD_PERCENT);
}

export function isLinkSideApproved(vote: ProjectManualLinkVoteState) {
  return vote.resultNote.toLowerCase().includes('approved');
}

export function isLinkSideBlocked(vote: ProjectManualLinkVoteState) {
  return vote.resultNote.toLowerCase().includes('no longer');
}
