/** Channel/community settings and member votes (backend: app/services/scope_governance.py). */
export type ScopeSettingsKind = 'channel' | 'community';

export interface ScopeProposal {
  id: string;
  kind: 'edit' | 'remove_member' | 'to_collaborative' | 'to_organizer';
  payload: {
    name?: string;
    description?: string;
    imageUrl?: string | null;
    removeImage?: boolean;
    username?: string;
    organizerUsernames?: string[];
  };
  proposer: string | null;
  yes: number;
  no: number;
  votesRequired: number;
  viewerVote: 'yes' | 'no' | null;
  viewerCanVote: boolean;
  createdAt: string | null;
  closesAt: string;
}

export interface ScopeSettings {
  kind: ScopeSettingsKind;
  slug: string;
  name: string;
  description: string;
  imageUrl: string | null;
  isPrivate: boolean;
  governance: 'collaborative' | 'organizer';
  quorumBasis: string;
  memberCount: number;
  organizers: string[];
  viewerIsMember: boolean;
  viewerIsOrganizer: boolean;
  viewerEditsDirectly: boolean;
  proposals: ScopeProposal[];
  /** Closed decisions with final tallies, newest first. */
  recentDecisions: ScopeDecision[];
}

export interface ScopeDecision {
  id: string;
  kind: ScopeProposal['kind'];
  payload: ScopeProposal['payload'];
  proposer: string | null;
  /** 'passed' or 'rejected'. */
  outcome: string;
  yes: number;
  no: number;
  createdAt: string;
  closedAt: string | null;
}

export interface ScopeSettingsEdit {
  name?: string;
  description?: string;
  imageKey?: string;
  imageContentType?: string;
  removeImage?: boolean;
}

export interface ScopeSettingsApi {
  get(kind: ScopeSettingsKind, slug: string): Promise<ScopeSettings>;
  edit(kind: ScopeSettingsKind, slug: string, input: ScopeSettingsEdit): Promise<ScopeSettings>;
  uploadImage(
    kind: ScopeSettingsKind,
    slug: string,
    file: File
  ): Promise<{ imageKey: string; contentType: string }>;
  propose(
    kind: ScopeSettingsKind,
    slug: string,
    input: {
      kind: 'remove_member' | 'to_collaborative' | 'to_organizer';
      targetUsername?: string;
      organizerUsernames?: string[];
    }
  ): Promise<ScopeSettings>;
  vote(proposalId: string, vote: 'yes' | 'no'): Promise<ScopeSettings>;
  setOrganizer(
    kind: ScopeSettingsKind,
    slug: string,
    username: string,
    organizer: boolean
  ): Promise<ScopeSettings>;
  removeMember(kind: ScopeSettingsKind, slug: string, username: string): Promise<ScopeSettings>;
}
