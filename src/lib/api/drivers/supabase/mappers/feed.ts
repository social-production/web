/**
 * Map gateway feed payloads into frontend PersonalFeedItem contracts.
 * Gateway personal/user feeds currently emit public-style rows; the UI expects
 * author objects and personal kinds (activity / post / help-request).
 */
import type {
  PersonalFeedItem,
  ProjectMode,
  PublicFeedItem,
  TagRef,
  VoteDirection,
  ViewerSignal
} from '$lib/types/feed';
import type { ViewerSummary } from '$lib/types/bootstrap';

type GatewayAuthor = {
  id?: string;
  username?: string;
  profileImageUrl?: string | null;
};

type GatewayPersonalCandidate = Record<string, unknown> & {
  kind?: string;
  id?: string;
  slug?: string;
  href?: string;
  createdAt?: string;
  title?: string;
  body?: string;
  description?: string;
  summary?: string;
  authorUsername?: string;
  createdByUsername?: string;
  author?: GatewayAuthor;
  projectMode?: ProjectMode;
  stage?: string;
  timeLabel?: string;
  locationLabel?: string;
  scheduleLabel?: string;
  neededAt?: string;
  channelTags?: TagRef[];
  communityTags?: TagRef[];
  voteCount?: number;
  activeVote?: VoteDirection;
  commentCount?: number;
  supportCount?: number;
  opposeCount?: number;
  favorability?: number | null;
  viewerSignal?: ViewerSignal;
  isClosed?: boolean;
  audience?: 'followers' | 'public';
  feedSource?: 'following' | 'discovery';
  voteTargetId?: string;
  linkedSubjects?: unknown[];
  roles?: Array<{ title: string; description?: string; slots: number }>;
  signupCount?: number;
  slotsNeeded?: number;
  moderationState?: string;
  report?: unknown;
  isUnderReview?: boolean;
  hasActiveReport?: boolean;
};

function asAuthor(
  item: GatewayPersonalCandidate,
  fallbackUsername?: string
): ViewerSummary {
  if (item.author && typeof item.author === 'object') {
    return {
      id: item.author.id ?? '',
      username: item.author.username ?? fallbackUsername ?? 'unknown',
      profileImageUrl: item.author.profileImageUrl ?? undefined
    };
  }
  return {
    id: '',
    username: fallbackUsername ?? item.authorUsername ?? item.createdByUsername ?? 'unknown'
  };
}

function moderationFields(item: GatewayPersonalCandidate) {
  return {
    moderationState: item.moderationState as never,
    report: (item.report as never) ?? null,
    isUnderReview: item.isUnderReview,
    hasActiveReport: item.hasActiveReport
  };
}

export function mapGatewayPersonalItem(raw: unknown): PersonalFeedItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as GatewayPersonalCandidate;
  const kind = item.kind;
  if (!kind || !item.id) return null;

  if (kind === 'post') {
    const author = asAuthor(item);
    return {
      kind: 'post',
      id: String(item.id).replace(/^post-activity-/, ''),
      href: item.href ?? `/posts/${String(item.id).replace(/^post-activity-/, '')}`,
      author,
      feedSource: item.feedSource,
      audience: item.audience === 'followers' ? 'followers' : 'public',
      voteTargetId: item.voteTargetId ?? String(item.id).replace(/^post-activity-/, ''),
      body: item.body ?? '',
      linkedSubjects: Array.isArray(item.linkedSubjects) ? (item.linkedSubjects as never) : [],
      voteCount: item.voteCount ?? 0,
      activeVote: (item.activeVote ?? 0) as VoteDirection,
      commentCount: item.commentCount ?? 0,
      createdAt: item.createdAt ?? new Date(0).toISOString(),
      ...moderationFields(item)
    };
  }

  if (kind === 'help-request') {
    return {
      kind: 'help-request',
      id: item.id,
      href: item.href ?? `/help-requests/${item.id}`,
      author: asAuthor(item, item.authorUsername),
      feedSource: item.feedSource,
      title: item.title ?? '',
      body: item.body ?? '',
      locationLabel: item.locationLabel ?? '',
      scheduleLabel: item.scheduleLabel ?? item.timeLabel ?? '',
      neededAt: item.neededAt,
      roles: Array.isArray(item.roles)
        ? item.roles.map((role) => ({
            title: role.title,
            description: role.description ?? '',
            slots: role.slots
          }))
        : [],
      channelTags: item.channelTags ?? [],
      communityTags: item.communityTags ?? [],
      voteCount: item.voteCount ?? 0,
      activeVote: (item.activeVote ?? 0) as VoteDirection,
      commentCount: item.commentCount ?? 0,
      signupCount: item.signupCount ?? 0,
      slotsNeeded: item.slotsNeeded ?? 0,
      createdAt: item.createdAt ?? new Date(0).toISOString(),
      ...moderationFields(item)
    };
  }

  if (kind === 'comment-activity') {
    const subjectKindRaw = String(item.subjectKind ?? item.subjectType ?? 'thread');
    const subjectKind =
      subjectKindRaw === 'help_request' || subjectKindRaw === 'help-request'
        ? 'help-request'
        : subjectKindRaw === 'post' ||
            subjectKindRaw === 'project' ||
            subjectKindRaw === 'event' ||
            subjectKindRaw === 'thread'
          ? subjectKindRaw
          : 'thread';
    return {
      kind: 'comment-activity',
      id: String(item.id),
      href: item.href ?? '#',
      author: asAuthor(item, item.authorUsername),
      feedSource: item.feedSource,
      subjectKind,
      subjectTitle: String(item.subjectTitle ?? item.title ?? ''),
      commentExcerpt: String(item.commentExcerpt ?? item.body ?? ''),
      voteTargetId: String(item.voteTargetId ?? item.id),
      voteCount: item.voteCount ?? 0,
      activeVote: (item.activeVote ?? 0) as VoteDirection,
      commentCount: item.commentCount ?? 0,
      createdAt: item.createdAt ?? new Date(0).toISOString(),
      ...moderationFields(item)
    };
  }

  const subjectKindMap: Record<string, 'project' | 'thread' | 'event'> = {
    project: 'project',
    thread: 'thread',
    event: 'event'
  };
  const subjectKind = subjectKindMap[kind];
  if (!subjectKind) return null;

  const actionLabelMap: Record<string, string> = {
    project: 'created a project',
    thread: 'started a thread',
    event: 'created an event'
  };

  const href =
    item.href ??
    (item.slug ? `/${kind}s/${item.slug}` : '#');

  return {
    kind: 'activity',
    id: item.id,
    subjectId: item.id,
    href,
    author: asAuthor(item, item.authorUsername ?? item.createdByUsername),
    feedSource: item.feedSource,
    actionLabel: actionLabelMap[kind] ?? 'posted',
    subjectKind,
    subjectProjectMode: item.projectMode,
    subjectSlug: item.slug,
    title: item.title ?? '',
    body: item.body ?? item.description ?? item.summary ?? '',
    meta: item.stage ?? item.timeLabel ?? '',
    voteCount: item.voteCount ?? 0,
    activeVote: (item.activeVote ?? 0) as VoteDirection,
    supportCount: item.supportCount,
    opposeCount: item.opposeCount,
    favorability: item.favorability ?? null,
    viewerSignal: item.viewerSignal ?? null,
    isClosed: item.isClosed,
    commentCount: item.commentCount ?? 0,
    createdAt: item.createdAt ?? new Date(0).toISOString(),
    channelTags: item.channelTags ?? [],
    communityTags: item.communityTags ?? [],
    ...moderationFields(item)
  };
}

export function mapGatewayPersonalItems(items: unknown[]): PersonalFeedItem[] {
  return items.flatMap((item) => {
    const mapped = mapGatewayPersonalItem(item);
    return mapped ? [mapped] : [];
  });
}

export function mapGatewayPublicItems(items: unknown[]): PublicFeedItem[] {
  return items.filter((item): item is PublicFeedItem => {
    if (!item || typeof item !== 'object') return false;
    const kind = (item as { kind?: string }).kind;
    return (
      kind === 'project' ||
      kind === 'project-activity' ||
      kind === 'thread' ||
      kind === 'event' ||
      kind === 'help-request'
    );
  });
}
