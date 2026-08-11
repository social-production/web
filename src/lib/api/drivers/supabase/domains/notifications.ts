import { apiClient } from '../client';
import type { AppAdapter } from '$lib/services/adapters/types';
import type { NotificationsPageData } from '$lib/types/inbox';
import type { ViewerSummary } from '$lib/types/bootstrap';
import type { SubjectKind } from '$lib/types/feed';

function mapKind(k: string): NotificationsPageData['items'][number]['kind'] {
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
    const res = await apiClient.get<{
      viewer?: ViewerSummary | null;
      items?: Array<Record<string, unknown>>;
      total?: number;
    }>('/notifications');

    const viewer =
      res.viewer ??
      (
        await apiClient.get<{ viewer?: ViewerSummary | null; user?: ViewerSummary }>('/users/me')
      ).viewer ??
      null;

    if (!viewer) return null;

    return {
      viewer,
      items: (res.items ?? []).map((n) => ({
        id: String(n.id),
        kind: mapKind(String(n.kind ?? 'project')),
        surface: ((n.surface as string) ?? 'public') as 'public' | 'personal',
        subjectKind: mapSubjectKind(String(n.subjectKind ?? n.subject_type ?? 'project')),
        actorUsername: (n.actorUsername ?? n.actor_username ?? undefined) as string | undefined,
        title: String(n.title ?? ''),
        body: String(n.body ?? ''),
        href: String(n.href ?? '#'),
        createdAt: String(n.createdAt ?? n.created_at ?? ''),
        isUnread: Boolean(n.isUnread ?? n.is_unread),
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
  await apiClient.post(`/notifications/${notificationId}/read`);
}

export async function fetchMarkAllNotificationsRead(): Promise<void> {
  await apiClient.post('/notifications/read-all');
}

export const notificationsDomain: Partial<AppAdapter> = {
  getNotifications: fetchNotifications,
  markNotificationRead: fetchMarkNotificationRead,
  markAllNotificationsRead: fetchMarkAllNotificationsRead
};
