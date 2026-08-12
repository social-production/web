import { describe, expect, it } from 'vitest';
import { formatCompactVoteStatus } from './projectVotes';
import type { ProjectPlanVoteSummary } from '$lib/types/detail';

const baseSummary: ProjectPlanVoteSummary = {
  yesCount: 1,
  noCount: 0,
  totalVotes: 1,
  approvalPercent: 100,
  activeVote: null,
  meetsQuorum: false,
  eligibleVoterCount: 10,
  quorumThresholdPercent: 66,
  votesRequired: 8,
  votesRemaining: 7,
  remainingEligibleVotes: 9
};

describe('formatCompactVoteStatus', () => {
  it('renders quorum chips without undefined or NaN', () => {
    expect(formatCompactVoteStatus(baseSummary, 66)).toBe('100% yes · 1/10 voted · 66% needed');
  });

  it('guards incomplete payloads that previously produced NaN', () => {
    const incomplete = {
      yesCount: 1,
      noCount: 0
    } as unknown as ProjectPlanVoteSummary;

    expect(formatCompactVoteStatus(incomplete, 66)).toBe('0% yes · 1/1 voted · 66% needed');
    expect(formatCompactVoteStatus(incomplete, 66)).not.toMatch(/undefined|NaN/);
  });
});
