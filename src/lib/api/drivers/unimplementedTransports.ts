import type { ErrorTransport } from '$lib/services/errorTransport';
import type { SessionTransport, SessionRestoreResult } from '$lib/services/sessionTransport';
import { error as kitError } from '@sveltejs/kit';

/**
 * Shared stubs for providers that are registered but not implemented yet.
 * They fail loudly so missing work is obvious during smoke/check.
 */
export function createUnimplementedSessionTransport(provider: string): SessionTransport {
  const fail = (method: string): never => {
    throw new Error(`${provider} SessionTransport.${method} is not implemented yet.`);
  };

  return {
    refreshSession: async () => fail('refreshSession'),
    markAuthenticatedSession: () => fail('markAuthenticatedSession'),
    clearAuthenticatedSession: () => fail('clearAuthenticatedSession'),
    hasAuthenticatedSession: () => fail('hasAuthenticatedSession'),
    hasRememberedAuthCookie: () => fail('hasRememberedAuthCookie'),
    shouldAttemptSessionRefresh: () => fail('shouldAttemptSessionRefresh'),
    getCsrfToken: () => fail('getCsrfToken'),
    tryRestoreAuthenticatedSession: async (): Promise<SessionRestoreResult> =>
      fail('tryRestoreAuthenticatedSession')
  };
}

export function createUnimplementedErrorTransport(provider: string): ErrorTransport {
  return {
    extractErrorMessage(_err, fallback) {
      return `${provider} is not implemented: ${fallback}`;
    },
    isApiClientError(err: unknown): err is { status: number; body: unknown } {
      return (
        typeof err === 'object' &&
        err !== null &&
        'status' in err &&
        typeof (err as { status: unknown }).status === 'number'
      );
    },
    isNetworkLoadError() {
      return false;
    },
    toLoadError(_err, fallbackMessage = `${provider} backend is not implemented`): never {
      throw kitError(501, fallbackMessage);
    }
  };
}
