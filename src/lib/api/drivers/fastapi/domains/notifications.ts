import { apiClient } from '../client';
import type { NotificationsPageData } from '$lib/types/inbox';
import type { ViewerSummary } from '$lib/types/bootstrap';
import type { SubjectKind } from '$lib/types/feed';

interface BackendUser { id: string; username: string; bio: string | null; profile_image_url: string | null; }
interface BackendNotification {
  id: string;
  kind: string;
  surface: string;
  subject_type: string;
  actor_username?: string | null;
  title: string;
  body: string;
  href: string;
  is_unread: boolean;
  created_at: string;
}
interface BackendNotificationsResponse { total: number; items: BackendNotification[]; }

const KIND_MAP: Record<string, NotificationsPageData['items'][number]['kind']> = {
  reply: 'reply',
  mention: 'mention',
  message: 'message',
  'follow-request': 'follow-request',
  'follow-accepted': 'follow-accepted',
  'new-follower': 'new-follower',
  'hr-role-signup': 'help-request',
  'community-invite': 'message',
  'pr-approved': 'project',
  'evt-plan-lead': 'event',
  'prj-plan-lead': 'project',
  'prj-share': 'project',
  'evt-share': 'event',
  'evt-phase-vote': 'event',
  'prj-phase-vote': 'project',
  'evt-phase-done': 'event',
  'prj-phase-done': 'project'
};

function mapKind(k: string): NotificationsPageData['items'][number]['kind'] {
  if (KIND_MAP[k]) return KIND_MAP[k];
  if (k.startsWith('evt-')) return 'event';
  if (k.startsWith('hr-')) return 'help-request';
  if (k.startsWith('prj-') || k.startsWith('pr-') || k.startsWith('project-')) return 'project';
  return 'project';
}

function mapSubjectKind(s: string): SubjectKind {
  const map: Record<string, SubjectKind> = {
    project: 'project',
    thread: 'thread',
    event: 'event',
    post: 'post',
    user: 'post',
    community: 'thread',
    'phase-change': 'project',
    'pull-request': 'project',
    'event-plan': 'event',
    'help-request': 'help-request',
    help_request: 'help-request'
  };
  return map[s] ?? 'project';
}

export async function fetchNotifications(): Promise<NotificationsPageData | null> {
  try {
    const [notifRes, meRes] = await Promise.all([
      apiClient.get<BackendNotificationsResponse>('/notifications'),
      apiClient.get<{ user: BackendUser }>('/users/me')
    ]);
    const viewer: ViewerSummary = {
      id: meRes.user.id,
      username: meRes.user.username,
      bio: meRes.user.bio ?? undefined,
      profileImageUrl: meRes.user.profile_image_url ?? undefined
    };
    const items = notifRes.items ?? [];
    return {
      viewer,
      items: items.map(n => ({
        id: n.id,
        kind: mapKind(n.kind),
        surface: (n.surface as 'public' | 'personal') ?? 'public',
        subjectKind: mapSubjectKind(n.subject_type),
        actorUsername: n.actor_username ?? undefined,
        title: n.title,
        body: n.body,
        href: n.href,
        createdAt: n.created_at,
        isUnread: n.is_unread,
        channelTags: [],
        communityTags: []
      }))
    };
  } catch (err) {
    if ((err as { status?: number }).status === 401) return null;
    throw err;
  }
}

export async function fetchMarkNotificationRead(notificationId: string): Promise<void> {
  await apiClient.patch(`/notifications/${notificationId}/read`);
}

export async function fetchMarkAllNotificationsRead(): Promise<void> {
  await apiClient.patch('/notifications/read-all');
}
