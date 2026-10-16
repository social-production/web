import { requestActivityRailRefresh } from '$lib/services/queries/bootstrap';
import { showToast } from '$lib/stores/toast';

function failed(result: unknown) {
  return Boolean(result && typeof result === 'object' && (result as { ok?: unknown }).ok === false);
}

/** Confirm a finished action with a toast, and refresh the rail when counts may have moved. */
export async function confirmed<T>(
  action: Promise<T>,
  message: string,
  refreshRail = true
): Promise<T> {
  const result = await action;
  if (failed(result)) return result;
  if (refreshRail) requestActivityRailRefresh();
  showToast(message);
  return result;
}
