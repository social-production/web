/**
 * Holochain `scopes` domain scaffold.
 * Responsibility: channels, communities, invites, board, platform.
 * Replace stubs with real `web-holochain` calls mapped to `$lib/types/*`.
 */
import type { AppAdapter } from '$lib/services/adapters/types';
import { stubMethod } from '../../scaffold';

const provider = 'holochain' as const;
const domain = 'scopes' as const;

export const scopesDomain: Partial<AppAdapter> = {
  getChannel: stubMethod(provider, domain, 'getChannel') as AppAdapter['getChannel'],
  getCommunity: stubMethod(provider, domain, 'getCommunity') as AppAdapter['getCommunity'],
  getPlatform: stubMethod(provider, domain, 'getPlatform') as AppAdapter['getPlatform'],
  getPlatformAssets: stubMethod(provider, domain, 'getPlatformAssets') as AppAdapter['getPlatformAssets'],
  createChannel: stubMethod(provider, domain, 'createChannel') as AppAdapter['createChannel'],
  createCommunity: stubMethod(provider, domain, 'createCommunity') as AppAdapter['createCommunity'],
  getTaggableScopes: stubMethod(provider, domain, 'getTaggableScopes') as AppAdapter['getTaggableScopes'],
  toggleScopeMembership: stubMethod(provider, domain, 'toggleScopeMembership') as AppAdapter['toggleScopeMembership'],
  redeemScopeInvite: stubMethod(provider, domain, 'redeemScopeInvite') as AppAdapter['redeemScopeInvite'],
  createScopeInvite: stubMethod(provider, domain, 'createScopeInvite') as AppAdapter['createScopeInvite'],
  inviteUserToCommunity: stubMethod(provider, domain, 'inviteUserToCommunity') as AppAdapter['inviteUserToCommunity'],
  volunteerForBoard: stubMethod(provider, domain, 'volunteerForBoard') as AppAdapter['volunteerForBoard'],
  removeVolunteer: stubMethod(provider, domain, 'removeVolunteer') as AppAdapter['removeVolunteer'],
  castModeratorVote: stubMethod(provider, domain, 'castModeratorVote') as AppAdapter['castModeratorVote'],
};

