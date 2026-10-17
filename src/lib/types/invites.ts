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

/** A direct invite to a private community or event, waiting for an answer. */
export interface PendingInvite {
  id: string;
  kind: 'community' | 'event';
  title: string;
  description: string;
  href: string;
  invitedBy: string | null;
  createdAt: string;
  scheduledAt: string | null;
  endsAt: string | null;
}

export interface InviteAnswer {
  accepted: boolean;
  href: string | null;
}
