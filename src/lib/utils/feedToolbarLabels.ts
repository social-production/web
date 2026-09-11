import { browser } from '$app/environment';

/** Show IconMenuButton trigger labels from this width up (icons-only below). */
export const FEED_TOOLBAR_LABEL_MQ = '(min-width: 720px)';

export function subscribeFeedToolbarLabels(onChange: (showLabels: boolean) => void): () => void {
  if (!browser) {
    return () => {};
  }

  const media = window.matchMedia(FEED_TOOLBAR_LABEL_MQ);
  const apply = () => onChange(media.matches);
  apply();
  media.addEventListener('change', apply);
  return () => media.removeEventListener('change', apply);
}
