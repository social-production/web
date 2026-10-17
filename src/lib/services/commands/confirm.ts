import { requestActivityRailRefresh } from '$lib/services/queries/bootstrap';
import { errorMessage } from '$lib/services/errors';
import { showToast } from '$lib/stores/toast';

function failed(result: unknown) {
  return Boolean(result && typeof result === 'object' && (result as { ok?: unknown }).ok === false);
}

/**
 * Confirm a finished action with a toast, and refresh the rail when counts may have moved.
 * Pass `null` when the screen already shows the change (e.g. Take role turning into Leave role).
 */
export async function confirmed<T>(
  action: Promise<T>,
  message: string | null,
  refreshRail = true
): Promise<T> {
  let result: T;
  try {
    result = await action;
  } catch (err) {
    // Say why it was refused (e.g. "Voting opens after…") instead of failing silently.
    showToast(errorMessage(err, 'That did not go through. Try again.'), 'error');
    throw err;
  }
  if (failed(result)) return result;
  if (refreshRail) requestActivityRailRefresh();
  if (message) showToast(message);
  return result;
}
