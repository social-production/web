import { showAuthActionNotice } from '$lib/stores/authActionNotice';
import type { ViewerSummary } from '$lib/types/bootstrap';

export function requireViewer(
  viewer: ViewerSummary | null | undefined,
  message?: string
): boolean {
  if (viewer) {
    return true;
  }

  showAuthActionNotice(message);
  return false;
}
