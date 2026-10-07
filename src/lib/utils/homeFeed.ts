import type { FeedEntityFilter, PersonalFeedItem, PublicFeedItem } from '$lib/types/feed';

export type HomeFeedRow =
  | { key: string; source: 'public'; item: PublicFeedItem }
  | { key: string; source: 'personal'; item: PersonalFeedItem };

function personalMatchesPublicFilter(item: PersonalFeedItem, filter: FeedEntityFilter) {
  if (filter === 'all') return true;
  if (filter === 'help_requests') return item.kind === 'help-request';
  if (filter === 'projects') return item.kind === 'activity' && item.subjectKind === 'project';
  if (filter === 'threads') return item.kind === 'activity' && item.subjectKind === 'thread';
  if (filter === 'events') return item.kind === 'activity' && item.subjectKind === 'event';
  return true;
}

function rowTime(row: HomeFeedRow) {
  if (row.source === 'public') {
    const stamp = row.item.lastActivityAt || row.item.createdAt;
    const time = Date.parse(stamp);
    return Number.isNaN(time) ? 0 : time;
  }
  const time = Date.parse(row.item.createdAt);
  return Number.isNaN(time) ? 0 : time;
}

export function mergeHomeFeed(
  publicItems: PublicFeedItem[],
  personalItems: PersonalFeedItem[],
  filter: FeedEntityFilter,
  sort: 'trending' | 'recent'
): HomeFeedRow[] {
  const publicRows: HomeFeedRow[] = publicItems.map((item) => ({
    key: `public:${item.kind}:${item.id}`,
    source: 'public',
    item
  }));
  const seenHrefs = new Set(publicItems.map((item) => item.href));
  const personalRows: HomeFeedRow[] = personalItems
    .filter((item) => personalMatchesPublicFilter(item, filter))
    .filter((item) => !seenHrefs.has(item.href))
    .map((item) => ({
      key: `personal:${item.kind}:${item.id}`,
      source: 'personal' as const,
      item
    }));

  if (sort === 'recent') {
    return [...publicRows, ...personalRows].sort((left, right) => rowTime(right) - rowTime(left));
  }

  const mixed: HomeFeedRow[] = [];
  const length = Math.max(publicRows.length, personalRows.length);
  for (let index = 0; index < length; index += 1) {
    if (publicRows[index]) mixed.push(publicRows[index]);
    if (personalRows[index]) mixed.push(personalRows[index]);
  }
  return mixed;
}
