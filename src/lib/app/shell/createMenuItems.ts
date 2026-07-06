export type CreateMenuIconId =
  | 'post'
  | 'thread'
  | 'help-request'
  | 'project'
  | 'event'
  | 'community'
  | 'channel';

export interface CreateMenuItem {
  href: string;
  label: string;
  description: string;
  icon: CreateMenuIconId;
}

export const createContentLinks: CreateMenuItem[] = [
  {
    href: '/create/post',
    label: 'Post',
    description: 'Share to your personal feed',
    icon: 'post'
  },
  {
    href: '/create/thread',
    label: 'Thread',
    description: 'Start a discussion thread',
    icon: 'thread'
  },
  {
    href: '/create/help-request',
    label: 'Help request',
    description: 'Ask for help with roles and schedule',
    icon: 'help-request'
  },
  {
    href: '/create/project',
    label: 'Project',
    description: 'Start a productive or service project',
    icon: 'project'
  },
  {
    href: '/create/event',
    label: 'Event',
    description: 'Plan a scheduled gathering',
    icon: 'event'
  }
];

export const createSurfaceLinks: CreateMenuItem[] = [
  {
    href: '/create/community',
    label: 'Community',
    description: 'Coordination space around shared activity',
    icon: 'community'
  },
  {
    href: '/create/channel',
    label: 'Channel',
    description: 'Topic-based discovery surface',
    icon: 'channel'
  }
];
