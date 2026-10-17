import '$lib/api/drivers';
import { getErrorTransport } from '$lib/services/errorTransport';

export function extractErrorMessage(err: unknown, fallback: string): string {
  return getErrorTransport().extractErrorMessage(err, fallback);
}

/** The reason to show for a failed action: the API's detail, or a thrown Error's message. */
export function errorMessage(err: unknown, fallback: string): string {
  const fromApi = extractErrorMessage(err, '');
  if (fromApi) return fromApi;
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}

export function isApiClientError(err: unknown): err is { status: number; body: unknown } {
  return getErrorTransport().isApiClientError(err);
}

export function isNetworkLoadError(err: unknown): boolean {
  return getErrorTransport().isNetworkLoadError(err);
}

export function toLoadError(err: unknown, fallbackMessage?: string): never {
  return getErrorTransport().toLoadError(err, fallbackMessage);
}
