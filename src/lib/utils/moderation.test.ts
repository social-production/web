import { describe, expect, it } from 'vitest';
import {
  feedModerationFields,
  moderatedPlaceholder,
  moderationStatusLabel,
  shouldHideModeratedBody
} from '$lib/utils/moderation';
import type { ContentReportSummary } from '$lib/types/detail/shared';

const openReport: ContentReportSummary = {
  id: 'r1',
  subjectId: 's1',
  targetId: 't1',
  reason: 'spam',
  description: '',
  createdAt: '2026-01-01T00:00:00Z',
  authorUsername: 'reporter',
  resolution: 'open',
  voteSummary: {
    yesCount: 1,
    noCount: 0,
    activeVote: 'yes',
    eligibleVoterCount: 10,
    audienceSize: 10,
    totalVotes: 1,
    votesRequired: 5,
    requiredYesShare: 0.66,
    deleteYesShare: 0.66,
    hideYesShare: 0.66,
    deleteQuorum: 5,
    hideQuorum: 3,
    removalQuorum: 5,
    restrictionQuorum: 3,
    restrictionVotesRequired: 3
  }
};

describe('moderation utils', () => {
  it('labels under-review and hidden states; open reports are under review', () => {
    expect(
      moderationStatusLabel({ moderationState: 'under_review', report: openReport })
    ).toBe('Under review');
    expect(moderationStatusLabel({ moderationState: 'hidden' })).toBe('Hidden');
    expect(moderationStatusLabel({ report: openReport })).toBe('Under review');
    expect(moderationStatusLabel({ hasActiveReport: true })).toBe('Under review');
    expect(moderationStatusLabel({})).toBeNull();
  });

  it('builds placeholders for removed bodies and keeps hidden votable', () => {
    expect(moderatedPlaceholder(openReport)).toBe('Removed for spam');
    expect(
      moderatedPlaceholder({ ...openReport, reason: 'serious-harm' })
    ).toBe('Removed for serious harm');
    expect(shouldHideModeratedBody({ body: 'Removed for spam' })).toBe(true);
    expect(shouldHideModeratedBody({ moderationState: 'removed' })).toBe(true);
    expect(shouldHideModeratedBody({ moderationState: 'hidden' })).toBe(false);
    expect(
      shouldHideModeratedBody({
        report: { ...openReport, resolution: 'hidden', reason: 'serious-harm' }
      })
    ).toBe(false);
  });

  it('maps feed moderation fields including active report flags', () => {
    expect(
      feedModerationFields({
        moderation_state: 'under_review',
        has_active_report: true
      })
    ).toEqual({
      moderationState: 'under_review',
      isUnderReview: true,
      hasActiveReport: true
    });
  });
});
