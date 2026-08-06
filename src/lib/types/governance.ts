/**
 * Frontend-owned governance entity contract.
 *
 * Alternate backends receive these explicit refs on vote / comment / report calls.
 * Do not infer entity type from an in-memory frontend registry at the wire boundary.
 */

export type GovernanceEntityType =
  | 'thread'
  | 'post'
  | 'comment'
  | 'event'
  | 'project'
  | 'help_request'
  | 'message';

/** Subjects that can own a comment thread (not comments or DMs themselves). */
export type CommentSubjectType = Exclude<GovernanceEntityType, 'comment' | 'message'>;

/** Entities that accept up/down votes. */
export type VoteTargetType = Exclude<GovernanceEntityType, 'message'>;

/** Entities that can be reported. */
export type ReportTargetType = GovernanceEntityType;

export type GovernanceEntityRef = {
  id: string;
  type: GovernanceEntityType;
};

export type CommentSubjectRef = {
  id: string;
  type: CommentSubjectType;
};

export type VoteTargetRef = {
  id: string;
  type: VoteTargetType;
};

export type ReportTargetRef = {
  id: string;
  type: ReportTargetType;
};

/** Map UI/feed kind labels onto wire governance types. */
export function toGovernanceEntityType(
  kind: string
): GovernanceEntityType {
  if (kind === 'help-request' || kind === 'help_request') {
    return 'help_request';
  }
  if (
    kind === 'thread' ||
    kind === 'post' ||
    kind === 'comment' ||
    kind === 'event' ||
    kind === 'project' ||
    kind === 'message'
  ) {
    return kind;
  }
  throw new Error(`Unsupported governance entity kind: ${kind}`);
}

export function toCommentSubjectType(kind: string): CommentSubjectType {
  const type = toGovernanceEntityType(kind);
  if (type === 'comment' || type === 'message') {
    throw new Error(`Kind "${kind}" is not a comment subject`);
  }
  return type;
}

export function toVoteTargetType(kind: string): VoteTargetType {
  const type = toGovernanceEntityType(kind);
  if (type === 'message') {
    throw new Error(`Kind "${kind}" is not a vote target`);
  }
  return type;
}
