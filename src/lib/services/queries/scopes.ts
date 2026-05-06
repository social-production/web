import { currentAdapter } from '$lib/services/adapters';
import type { ScopeKind } from '$lib/types/scope';

export function getChannel(slug: string) {
  return currentAdapter.getChannel(slug);
}

export function getCommunity(slug: string) {
  return currentAdapter.getCommunity(slug);
}

export function getPlatform() {
  return currentAdapter.getPlatform();
}

export function toggleScopeMembership(kind: ScopeKind, slug: string) {
  return currentAdapter.toggleScopeMembership(kind, slug);
}

export function redeemScopeInvite(kind: ScopeKind, slug: string, inviteValue: string) {
  return currentAdapter.redeemScopeInvite(kind, slug, inviteValue);
}