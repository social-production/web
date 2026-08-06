import { currentAdapter } from '$lib/services/adapters';

export function getChannel(slug: string) {
  return currentAdapter.getChannel(slug);
}

export function getCommunity(slug: string) {
  return currentAdapter.getCommunity(slug);
}

export function getPlatform() {
  return currentAdapter.getPlatform();
}

/** @deprecated Import mutations from `$lib/services/commands/scopes`. */
export {
  toggleScopeMembership,
  redeemScopeInvite,
  createScopeInvite,
  inviteUserToCommunity,
  volunteerForBoard,
  removeVolunteer,
  castModeratorVote
} from '$lib/services/commands/scopes';
