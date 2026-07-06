import { goto, invalidateAll } from '$app/navigation';

/** Navigate to newly created content first, then refresh shell data in the background. */
export async function navigateAfterCreate(href: string) {
  await goto(href);
  void invalidateAll();
}
