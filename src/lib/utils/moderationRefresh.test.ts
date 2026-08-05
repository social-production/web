import { describe, expect, it } from 'vitest';
import { normalizeFeedSort, profileSortToApiSort } from '$lib/utils/feedQuery';
import {
  formatReportThresholdLines,
  isActiveReport,
  mapContentReport,
  moderationStatusLabel
} from '$lib/utils/moderation';
import type { ContentReportSummary } from '$lib/types/detail';

describe('profile / feed sort mapping', () => {
  it('keeps newest/recent, top/highest-rated, and oldest distinct', () => {
    expect(normalizeFeedSort('recent')).toBe('recent');
    expect(normalizeFeedSort('trending')).toBe('trending');
    expect(normalizeFeedSort('popular')).toBe('trending');
    expect(normalizeFeedSort('oldest')).toBe('oldest');
    expect(normalizeFeedSort('top')).toBe('top');
    expect(normalizeFeedSort('nope')).toBe('trending');
  });

  it('maps profile UI sort labels to feed API sorts', () => {
    expect(profileSortToApiSort('newest')).toBe('recent');
    expect(profileSortToApiSort('top')).toBe('top');
    expect(profileSortToApiSort('oldest')).toBe('oldest');
  });
});

describe('moderation dismiss / active report helpers', () => {
  it('treats dismissed reports as inactive so emblems clear', () => {
    const dismissed = mapContentReport({
      id: 'r-dismissed',
      subject_id: 's1',
      target_id: 't1',
      reason: 'spam',
      description: 'noise',
      created_at: '2026-01-01T00:00:00Z',
      author_username: 'reporter',
      resolution: 'dismissed',
      vote_summary: {
        yes_count: 1,
        no_count: 5,
        active_vote: 'no',
        eligible_voter_count: 40,
        audience_size: 40,
        total_votes: 6,
        votes_required: 20,
        delete_yes_share: 0.66,
        hide_yes_share: 0.66,
        delete_quorum: 20,
        hide_quorum: 5
      }
    });

    expect(dismissed).not.toBeNull();
    expect(isActiveReport(dismissed)).toBe(false);
    expect(moderationStatusLabel({ report: dismissed })).toBeNull();
  });

  it('keeps under-review reports active for immediate emblem updates', () => {
    const underReview = mapContentReport({
      id: 'r-open',
      subject_id: 's1',
      target_id: 't1',
      reason: 'spam',
      resolution: 'under_review',
      vote_summary: {
        yes_count: 2,
        no_count: 0,
        total_votes: 2,
        delete_quorum: 20,
        hide_quorum: 5,
        delete_yes_share: 0.66
      }
    });

    expect(isActiveReport(underReview)).toBe(true);
    expect(moderationStatusLabel({ report: underReview })).toBe('Under review');
    expect(underReview?.voteSummary.yesCount).toBe(2);
    expect(underReview?.voteSummary.deleteQuorum).toBe(20);
  });
});

describe('formatReportThresholdLines', () => {
  const baseReport: ContentReportSummary = {
    id: 'r1',
    subjectId: 's1',
    targetId: 't1',
    reason: 'spam',
    description: '',
    createdAt: '2026-01-01T00:00:00Z',
    authorUsername: 'reporter',
    resolution: 'under_review',
    voteSummary: {
      yesCount: 2,
      noCount: 0,
      activeVote: 'yes',
      eligibleVoterCount: 40,
      audienceSize: 40,
      totalVotes: 2,
      votesRequired: 30,
      requiredYesShare: 0.66,
      deleteYesShare: 0.66,
      hideYesShare: 0.66,
      deleteQuorum: 30,
      hideQuorum: 5,
      removalQuorum: 30,
      restrictionQuorum: 5,
      restrictionVotesRequired: 5
    }
  };

  it('shows votes-cast quorum and audience sizing, not raw WAU as the bar', () => {
    expect(formatReportThresholdLines(baseReport)).toEqual([
      'Delete at 30 votes cast · 66% yes · sized from audience of ~40'
    ]);
  });

  it('includes hide line for serious-harm reports', () => {
    const lines = formatReportThresholdLines({
      ...baseReport,
      reason: 'serious-harm',
      voteSummary: {
        ...baseReport.voteSummary,
        deleteQuorum: 20,
        hideQuorum: 5
      }
    });

    expect(lines[0]).toContain('Hide at 5 votes cast');
    expect(lines[1]).toContain('Delete at 20 votes cast');
    expect(lines[0]).toContain('sized from audience of ~40');
  });
});
