import type { SearchResultKind } from '$lib/types/search';

export const searchKindLabels: Record<SearchResultKind, string> = {
  project: 'Project',
  thread: 'Thread',
  event: 'Event',
  channel: 'Channel',
  community: 'Community',
  profile: 'Profile',
  'help-request': 'Help request',
  post: 'Post'
};
