/**
 * Supabase `notifications` domain scaffold.
 * Responsibility: notification list + mark read.
 * Replace stubs with real `web-supabase` calls mapped to `$lib/types/*`.
 */
import type { AppAdapter } from '$lib/services/adapters/types';
import { stubMethod } from '../../scaffold';

const provider = 'supabase' as const;
const domain = 'notifications' as const;

export const notificationsDomain: Partial<AppAdapter> = {
  getNotifications: stubMethod(provider, domain, 'getNotifications') as AppAdapter['getNotifications'],
  markNotificationRead: stubMethod(provider, domain, 'markNotificationRead') as AppAdapter['markNotificationRead'],
  markAllNotificationsRead: stubMethod(provider, domain, 'markAllNotificationsRead') as AppAdapter['markAllNotificationsRead'],
};

