import type { RightRailActivityItem } from '$lib/types/bootstrap';

function isActionableActivityItem(item: RightRailActivityItem) {
  if (item.kind !== 'project' && item.kind !== 'event') {
    return false;
  }

  if (item.viewerIsParticipating) {
    return false;
  }

  return item.hasOpenRole !== false;
}

export function countActionableRailItems(
  items: RightRailActivityItem[],
  dismissedIds: Set<string> = new Set(),
  seenIds: Set<string> = new Set()
) {
  let count = 0;

  for (const item of items) {
    if (dismissedIds.has(item.id) || seenIds.has(item.id)) {
      continue;
    }

    if (item.kind === 'vote' || item.kind === 'help-request-open' || isActionableActivityItem(item)) {
      count += 1;
    }
  }

  return count;
}
