import type { NotificationItem } from '$lib/types/inbox';
import * as m from '$lib/paraglide/messages';

export function localizedNotificationBody(item: NotificationItem): string {
  if (item.kind === 'follow-request' && item.actorUsername) {
    return `${item.actorUsername} ${m.notification_follow_request()}`;
  }

  if (item.kind === 'new-follower' && item.actorUsername) {
    return `${item.actorUsername} ${m.notification_new_follower()}`;
  }

  if (item.kind === 'follow-accepted' && item.actorUsername) {
    return `${item.actorUsername} ${m.notification_follow_accepted()}`;
  }

  if (item.kind === 'reply') {
    const templates: Partial<Record<NotificationItem['subjectKind'], string>> = {
      thread: m.notification_reply_thread(),
      post: m.notification_reply_post(),
      project: m.notification_reply_project(),
      event: m.notification_reply_event(),
      'help-request': m.notification_reply_help_request()
    };

    const template = templates[item.subjectKind];
    if (template) {
      return template;
    }

    if (item.body.toLowerCase().includes('replied')) {
      return m.notification_reply_comment();
    }

    return m.notification_reply_generic();
  }

  return item.body;
}

export function localizedApiError(detail: string | undefined, fallback = m.error_generic()): string {
  if (!detail) {
    return fallback;
  }

  const map: Record<string, string> = {
    feedback_rate_limit_exceeded: m.feedback_error_rate_limit(),
    feedback_not_configured: m.feedback_error_not_configured(),
    feedback_submission_failed: m.feedback_error_generic(),
    feedback_title_required: m.feedback_error_generic(),
    feedback_description_required: m.feedback_error_generic(),
    invalid_feedback_category: m.feedback_error_generic(),
    'Not authenticated': m.error_not_authenticated(),
    'User not found': m.error_user_not_found(),
    invalid_preferred_language: m.error_generic()
  };

  return map[detail] ?? fallback;
}
