import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { getSettings } from '$lib/services/queries/account';
import { hydrateClientSettingsState } from '$lib/services/queries/account';
import { getBootstrap } from '$lib/services/queries/bootstrap';
import {
  clearBootstrapCache,
  isBootstrapCacheUsable,
  readPublicBootstrapCache,
  writeBootstrapCache
} from '$lib/services/bootstrapCache';
import {
  clearAuthenticatedSession,
  hasRememberedAuthCookie,
  tryRestoreAuthenticatedSession,
  type SessionRestoreResult
} from '$lib/services/session';
import { syncUnreadCountsFromBootstrap } from '$lib/services/queries/inbox';
import { isNetworkLoadError, toLoadError } from '$lib/services/errors';
import {
  applyLocale,
  detectBrowserLocale,
  readLanguageCookie,
  resolveLocale,
  type SupportedLocale
} from '$lib/i18n/locale';
import { I18N_ENABLED } from '$lib/i18n/config';
import { setDisplayTimezone } from '$lib/stores/timezoneStore';
import type { BootstrapPayload } from '$lib/types/bootstrap';
import type { LayoutLoad } from './$types';

export const ssr = false;

const protectedPrefixes = ['/personal', '/messages', '/notifications', '/settings', '/create'];
let didHydrateClientState = false;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function loadBootstrapWithRetry(): Promise<BootstrapPayload> {
  const maxAttempts = browser ? 3 : 1;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await getBootstrap();
    } catch (err) {
      lastError = err;
      if (!isNetworkLoadError(err) || attempt === maxAttempts - 1) {
        throw err;
      }
      await sleep(500);
    }
  }

  throw lastError;
}

function shouldClearSessionAfterBootstrap(
  restoreResult: SessionRestoreResult,
  bootstrap: BootstrapPayload
): boolean {
  if (bootstrap.viewer) {
    return false;
  }

  if (restoreResult === 'auth-failed') {
    return true;
  }

  return !hasRememberedAuthCookie();
}

export const load = (async ({ url, depends }) => {
  depends('app:bootstrap');

  if (browser && !didHydrateClientState) {
    await hydrateClientSettingsState();
    didHydrateClientState = true;
  }

  let restoreResult: SessionRestoreResult = 'skipped';
  if (browser) {
    restoreResult = await tryRestoreAuthenticatedSession();
  }

  let bootstrap: BootstrapPayload;
  try {
    bootstrap = await loadBootstrapWithRetry();
    if (browser && shouldClearSessionAfterBootstrap(restoreResult, bootstrap)) {
      clearAuthenticatedSession();
      if (!hasRememberedAuthCookie()) {
        clearBootstrapCache();
      }
    }
    writeBootstrapCache(bootstrap);
  } catch (err) {
    const cached = readPublicBootstrapCache();
    if (cached && isBootstrapCacheUsable(cached)) {
      if (shouldClearSessionAfterBootstrap(restoreResult, { ...cached, viewer: null })) {
        clearAuthenticatedSession();
      }
      bootstrap = cached;
    } else {
      toLoadError(err, 'Could not reach the server. Check your connection and try again.');
    }
  }

  syncUnreadCountsFromBootstrap(bootstrap.unreadCounts);

  if (
    !bootstrap.viewer &&
    protectedPrefixes.some((prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`))
  ) {
    throw redirect(307, '/onboarding');
  }

  let settings = null;
  let settingsLoadFailedOnNetwork = false;
  if (bootstrap.viewer) {
    try {
      settings = await getSettings();
    } catch (err) {
      if (isNetworkLoadError(err)) {
        settingsLoadFailedOnNetwork = true;
      } else {
        toLoadError(err, 'Could not load account settings.');
      }
    }
  }

  if (bootstrap.viewer && !settings && !settingsLoadFailedOnNetwork) {
    throw redirect(307, '/onboarding');
  }

  const locale: SupportedLocale = I18N_ENABLED
    ? resolveLocale({
        accountLanguage: settings?.preferredLanguage ?? null,
        cookieLanguage: browser ? readLanguageCookie() : null,
        browserLanguage: browser ? detectBrowserLocale() : 'en'
      })
    : 'en';

  if (browser) {
    applyLocale(locale);
    setDisplayTimezone(settings?.displayTimezone ?? null);
  }

  return {
    bootstrap,
    settings,
    locale
  };
}) satisfies LayoutLoad;
