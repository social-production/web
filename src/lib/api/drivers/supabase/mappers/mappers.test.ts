import { describe, expect, it } from 'vitest';
import { mapGatewayPersonalItem, mapGatewayPersonalItems } from '../mappers/feed';
import { mapGatewayProfile } from '../mappers/profile';

describe('supabase personal feed mapping', () => {
  it('maps public-shaped thread rows into personal activity items', () => {
    const mapped = mapGatewayPersonalItem({
      kind: 'thread',
      id: 'thread-1',
      slug: 'hello',
      href: '/threads/hello',
      createdAt: '2026-01-01T00:00:00.000Z',
      title: 'Hello',
      body: 'World',
      authorUsername: 'alice',
      channelTags: [],
      communityTags: [],
      voteCount: 2,
      activeVote: 1,
      commentCount: 3
    });

    expect(mapped).toMatchObject({
      kind: 'activity',
      subjectKind: 'thread',
      subjectSlug: 'hello',
      actionLabel: 'started a thread',
      author: { username: 'alice' },
      title: 'Hello',
      body: 'World'
    });
  });

  it('maps posts into personal post items with stable ids', () => {
    const mapped = mapGatewayPersonalItem({
      kind: 'post',
      id: 'post-activity-abc',
      href: '/posts/abc',
      createdAt: '2026-01-01T00:00:00.000Z',
      author: { username: 'bob', profileImageUrl: null },
      body: 'hi',
      voteTargetId: 'abc',
      voteCount: 0,
      activeVote: 0,
      commentCount: 0
    });

    expect(mapped).toMatchObject({
      kind: 'post',
      id: 'abc',
      voteTargetId: 'abc',
      author: { username: 'bob' },
      audience: 'public'
    });
  });

  it('maps comment-activity rows into personal comment cards', () => {
    const mapped = mapGatewayPersonalItem({
      kind: 'comment-activity',
      id: 'c1',
      href: '/threads/hello?comment=c1',
      createdAt: '2026-01-02T00:00:00.000Z',
      author: { id: 'u1', username: 'alice' },
      subjectKind: 'thread',
      subjectTitle: 'Hello',
      commentExcerpt: 'nested thoughts',
      voteTargetId: 'c1',
      voteCount: 1,
      activeVote: 0,
      commentCount: 2
    });

    expect(mapped).toMatchObject({
      kind: 'comment-activity',
      id: 'c1',
      subjectKind: 'thread',
      subjectTitle: 'Hello',
      commentExcerpt: 'nested thoughts',
      author: { username: 'alice' }
    });
  });

  it('drops unsupported kinds', () => {
    expect(mapGatewayPersonalItems([{ kind: 'project-activity', id: 'x' }])).toEqual([]);
  });
});

describe('supabase profile mapping', () => {
  it('normalizes gateway profile field names into ProfilePageData', () => {
    const mapped = mapGatewayProfile({
      username: 'alice',
      bio: 'hi',
      followerCount: 4,
      followingCount: 2,
      followStatus: 'accepted',
      feed: [
        {
          kind: 'project',
          id: 'p1',
          slug: 'proj',
          title: 'Proj',
          summary: 's',
          authorUsername: 'alice',
          createdAt: '2026-01-01T00:00:00.000Z',
          channelTags: [],
          communityTags: [],
          voteCount: 0,
          activeVote: 0,
          commentCount: 0
        }
      ]
    });

    expect(mapped).toMatchObject({
      username: 'alice',
      followersCount: 4,
      followingCount: 2,
      viewerIsFollowing: true,
      viewerFollowStatus: 'accepted',
      canViewPublicProfileActivity: true
    });
    expect(mapped?.feed[0]).toMatchObject({
      kind: 'activity',
      subjectKind: 'project',
      author: { username: 'alice' }
    });
  });
});
