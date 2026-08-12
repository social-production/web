import { invalidate } from '$app/navigation';

export function invalidateProjectDetail(slug: string, includeBootstrap = false) {
  const refreshes: Promise<void>[] = [invalidate(`app:project:${slug}`)];
  if (includeBootstrap) {
    refreshes.push(invalidate('app:bootstrap'));
  }
  return Promise.all(refreshes);
}

export function invalidateEventDetail(slug: string, includeBootstrap = false) {
  const refreshes: Promise<void>[] = [invalidate(`app:event:${slug}`)];
  if (includeBootstrap) {
    refreshes.push(invalidate('app:bootstrap'));
  }
  return Promise.all(refreshes);
}

export function invalidateDetail(
  kind: 'project' | 'event',
  slug: string,
  includeBootstrap = false
) {
  return kind === 'project'
    ? invalidateProjectDetail(slug, includeBootstrap)
    : invalidateEventDetail(slug, includeBootstrap);
}
