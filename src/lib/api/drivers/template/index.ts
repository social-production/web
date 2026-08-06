import type { AppAdapter } from '$lib/services/adapters/types';
import type { ErrorTransport } from '$lib/services/errorTransport';
import type { SessionTransport, SessionRestoreResult } from '$lib/services/sessionTransport';
import { error as kitError } from '@sveltejs/kit';
import { PROVIDER_REQUIRED_DOMAINS } from '../registry';

/**
 * Template / scaffold driver for new backend providers.
 *
 * Copy this folder to `src/lib/api/drivers/<name>/` and replace throws with real
 * transport + domain implementations. Every AppAdapter method fails loudly until filled in.
 */

export function createTemplateSessionTransport(provider = 'template'): SessionTransport {
  const fail = (method: string): never => {
    throw new Error(`${provider} SessionTransport.${method} is not implemented`);
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

export function createTemplateErrorTransport(provider = 'template'): ErrorTransport {
  return {
    extractErrorMessage(_err, fallback) {
      return `${provider}: ${fallback}`;
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
    toLoadError(_err, fallbackMessage = `${provider} is not configured`): never {
      throw kitError(501, fallbackMessage);
    }
  };
}

function notImplemented(provider: string, method: string): never {
  throw new Error(
    [
      `${provider} driver: ${method} is not implemented.`,
      `Implement domains under src/lib/api/drivers/${provider}/domains/.`,
      `Required domains: ${PROVIDER_REQUIRED_DOMAINS.join(', ')}.`
    ].join(' ')
  );
}

export function createTemplateDriver(provider = 'template'): AppAdapter {
  return new Proxy({} as AppAdapter, {
    get(_target, prop: string | symbol) {
      if (typeof prop !== 'string') {
        return undefined;
      }
      return async (..._args: unknown[]) => notImplemented(provider, prop);
    }
  });
}

/** Checklist exported for docs / tooling. */
export const TEMPLATE_DOMAIN_CHECKLIST = PROVIDER_REQUIRED_DOMAINS.map((domain) => ({
  domain,
  pathHint: `domains/${domain}.ts`,
  status: 'todo' as const
}));
