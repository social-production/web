export interface ScopeInviteRedeemResult {
  ok: boolean;
  joined: boolean;
  slug?: string;
}

export interface ScopeInviteCreateResult {
  token: string;
  redeemUrl: string;
}

export interface CommunityDirectInviteResult {
  ok: boolean;
  username: string;
  alreadyMember: boolean;
}
