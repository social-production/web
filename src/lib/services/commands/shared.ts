import { currentAdapter } from '$lib/services/adapters';
import type { CommentSubjectRef, ReportTargetRef, VoteTargetRef } from '$lib/types/governance';
import type { VoteDirection } from '$lib/types/feed';
import { page } from '$app/stores';
import { get } from 'svelte/store';
import { requireViewer } from '$lib/utils/requireViewer';
import { applyVoteTarget, invalidateFeedEngagementCache } from '$lib/utils/feedSignals';
import type { VoteEngagement } from '$lib/utils/feedSignals';
import { measureAsync } from '$lib/utils/performanceDebug';

export function addComment(subject: CommentSubjectRef, body: string, parentId?: string) {
  return currentAdapter.addComment(subject, body, parentId);
}

export function submitReport(
  subjectId: string,
  target: ReportTargetRef,
  reason: string,
  details: string
) {
  return currentAdapter.submitReport(subjectId, target, reason, details);
}

export function setReportVote(targetId: string, vote: 'yes' | 'no') {
  return currentAdapter.setReportVote(targetId, vote);
}

export async function setVote(target: VoteTargetRef, vote: VoteDirection) {
  const viewer = get(page).data.bootstrap?.viewer ?? null;

  if (!requireViewer(viewer)) {
    return;
  }

  const result = await measureAsync(`mutation:vote:${target.type}`, () =>
    currentAdapter.setVote(target, vote)
  );
  void invalidateFeedEngagementCache();
  return result;
}

export async function castFeedVote(
  target: VoteTargetRef,
  vote: VoteDirection,
  current?: { activeVote?: VoteDirection; voteCount?: number }
): Promise<VoteEngagement> {
  try {
    await setVote(target, vote);
    const confirmed = applyVoteTarget(current?.activeVote ?? 0, current?.voteCount ?? 0, vote);
    // Background refresh must not gate unlock/optimistic confirmation.
    void invalidateFeedEngagementCache();
    return confirmed;
  } catch (err) {
    console.error('Feed vote failed', err);
    throw err;
  }
}

export function commitHelpRequestRole(helpRequestId: string, roleId: string) {
  return currentAdapter.commitHelpRequestRole(helpRequestId, roleId);
}

export function uncommitHelpRequestRole(helpRequestId: string, roleId: string) {
  return currentAdapter.uncommitHelpRequestRole(helpRequestId, roleId);
}
