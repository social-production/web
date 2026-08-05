import { describe, expect, it } from 'vitest';
import type { VoteDirection } from '$lib/types/feed';
import { mergeFeedEngagement } from '$lib/utils/feedSignals';

describe('mergeFeedEngagement', () => {
  it('copies engagement for overlapping keys and leaves unmatched rows alone', () => {
    const current = [
      { id: 'a', slug: 'a', activeVote: 1 as VoteDirection, voteCount: 4 },
      { id: 'b', slug: 'b', activeVote: 0 as VoteDirection, voteCount: 1 }
    ];
    const incoming = [{ id: 'a', slug: 'a', activeVote: 0 as VoteDirection, voteCount: 3 }];

    expect(mergeFeedEngagement(current, incoming)).toEqual([
      { id: 'a', slug: 'a', activeVote: 0, voteCount: 3 },
      { id: 'b', slug: 'b', activeVote: 0, voteCount: 1 }
    ]);
  });
});
