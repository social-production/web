/**
 * Pure access-policy parity checks mirrored from web-supabase/_shared/access.ts
 * and web-backend/app/domain/access_policy.py / access_control.py.
 */

import { describe, expect, it } from 'vitest';

type EntityTagScope = {
  hasChannelTag: boolean;
  hasOpenCommunityTag: boolean;
  closedCommunityIds: string[];
};

function canViewByTagScope(
  viewerId: string | null,
  scope: EntityTagScope,
  viewerClosedMemberships: string[]
): boolean {
  if (scope.hasChannelTag || scope.hasOpenCommunityTag) return true;
  if (scope.closedCommunityIds.length === 0) return true;
  if (!viewerId) return false;
  const member = new Set(viewerClosedMemberships);
  return scope.closedCommunityIds.every((id) => member.has(id));
}

function canViewPrivateEventPure(input: {
  viewerId: string | null;
  isPrivate: boolean;
  isCreator: boolean;
  isMember: boolean;
  audience?: string | null;
  homeCommunityMember?: boolean;
}): boolean {
  if (!input.isPrivate) return true;
  if (!input.viewerId) return false;
  if (input.isCreator || input.isMember) return true;
  if (input.audience === 'private_community' && input.homeCommunityMember) return true;
  return false;
}

function canViewEntityUnknownType(): boolean {
  // FastAPI fails closed for unknown types.
  return false;
}

function canViewCommunityInSearchPure(input: {
  joinPolicy: string;
  viewerId: string | null;
  isMember: boolean;
}): boolean {
  if (input.joinPolicy !== 'closed') return true;
  if (!input.viewerId) return false;
  return input.isMember;
}

describe('supabase access policy parity', () => {
  it('allows public-tagged entities', () => {
    expect(
      canViewByTagScope(
        null,
        { hasChannelTag: true, hasOpenCommunityTag: false, closedCommunityIds: [] },
        []
      )
    ).toBe(true);
  });

  it('blocks anonymous viewers from closed-community-only entities', () => {
    expect(
      canViewByTagScope(
        null,
        {
          hasChannelTag: false,
          hasOpenCommunityTag: false,
          closedCommunityIds: ['c1']
        },
        []
      )
    ).toBe(false);
  });

  it('requires membership in every closed community', () => {
    expect(
      canViewByTagScope(
        'u1',
        {
          hasChannelTag: false,
          hasOpenCommunityTag: false,
          closedCommunityIds: ['c1', 'c2']
        },
        ['c1']
      )
    ).toBe(false);
    expect(
      canViewByTagScope(
        'u1',
        {
          hasChannelTag: false,
          hasOpenCommunityTag: false,
          closedCommunityIds: ['c1', 'c2']
        },
        ['c1', 'c2']
      )
    ).toBe(true);
  });

  it('fails closed for unknown entity types', () => {
    expect(canViewEntityUnknownType()).toBe(false);
  });

  it('gates private events by membership/audience without requiring tags', () => {
    expect(
      canViewPrivateEventPure({
        viewerId: 'u1',
        isPrivate: true,
        isCreator: false,
        isMember: true
      })
    ).toBe(true);
    expect(
      canViewPrivateEventPure({
        viewerId: null,
        isPrivate: true,
        isCreator: false,
        isMember: false
      })
    ).toBe(false);
    expect(
      canViewPrivateEventPure({
        viewerId: 'u1',
        isPrivate: true,
        isCreator: false,
        isMember: false,
        audience: 'private_community',
        homeCommunityMember: true
      })
    ).toBe(true);
  });

  it('hides closed communities from search for non-members', () => {
    expect(
      canViewCommunityInSearchPure({
        joinPolicy: 'closed',
        viewerId: null,
        isMember: false
      })
    ).toBe(false);
    expect(
      canViewCommunityInSearchPure({
        joinPolicy: 'closed',
        viewerId: 'u1',
        isMember: true
      })
    ).toBe(true);
    expect(
      canViewCommunityInSearchPure({
        joinPolicy: 'open',
        viewerId: null,
        isMember: false
      })
    ).toBe(true);
  });
});
