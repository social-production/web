import { goto, invalidateAll } from '$app/navigation';
import { clearFeedCache } from '$lib/services/feedCache';

/** Navigate to newly created content first, then refresh shell data in the background. */
export async function navigateAfterCreate(href: string) {
  clearFeedCache();
  await goto(href);
  void invalidateAll();
}
