import { currentAdapter } from '$lib/services/adapters';
import type { ScopeKind } from '$lib/types/scope';

export function toggleScopeMembership(kind: ScopeKind, slug: string, viewerIsMember: boolean) {
  return currentAdapter.toggleScopeMembership(kind, slug, viewerIsMember);
}

export function redeemScopeInvite(kind: ScopeKind, slug: string, inviteValue: string) {
  return currentAdapter.redeemScopeInvite(kind, slug, inviteValue);
}

export function createScopeInvite(kind: 'channel' | 'community', slug: string) {
  return currentAdapter.createScopeInvite(kind, slug);
}

export function inviteUserToCommunity(slug: string, username: string) {
  return currentAdapter.inviteUserToCommunity(slug, username);
}

export function volunteerForBoard() {
  return currentAdapter.volunteerForBoard();
}

export function removeVolunteer() {
  return currentAdapter.removeVolunteer();
}

export function castModeratorVote(targetUserId: string, vote: string) {
  return currentAdapter.castModeratorVote(targetUserId, vote);
}
