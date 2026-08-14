import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { getSettings, hydrateClientSettingsState } from '$lib/services/queries/account';
import { getBootstrap } from '$lib/services/queries/bootstrap';
import {
  clearBootstrapCache,
  consumeStaleBootstrapServe,
  isBootstrapCacheConsistentWithAuth,
  isBootstrapCacheUsable,
  readBootstrapCacheRecord,
  readPublicBootstrapCache,
  writeBootstrapCache
} from '$lib/services/bootstrapCache';
import {
  clearAuthenticatedSession,
  hasRememberedAuthCookie,
  tryRestoreAuthenticatedSession,
  type SessionRestoreResult
} from '$lib/services/session';
import { syncUnreadCountsFromBootstrap } from '$lib/services/commands/inbox';
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
import type { SettingsPageData } from '$lib/types/account';
import type { BootstrapPayload } from '$lib/types/bootstrap';
import type { LayoutLoad } from './$types';
import { measureAsync } from '$lib/utils/performanceDebug';

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

function finishLayout(
  bootstrap: BootstrapPayload,
  settings: SettingsPageData | null,
  servedFromCache: boolean
) {
  syncUnreadCountsFromBootstrap(bootstrap.unreadCounts);

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
    locale,
    servedFromCache
  };
}

export const load = (async ({ url, depends }) => {
  depends('app:bootstrap');

  if (browser && !didHydrateClientState) {
    await hydrateClientSettingsState();
    didHydrateClientState = true;
  }

  const rememberedAuth = browser && hasRememberedAuthCookie();
  const cachedRecord = browser ? readBootstrapCacheRecord() : null;
  const canServeStale =
    browser &&
    Boolean(cachedRecord) &&
    isBootstrapCacheConsistentWithAuth(cachedRecord!.bootstrap, rememberedAuth) &&
    consumeStaleBootstrapServe();

  if (canServeStale && cachedRecord) {
    if (
      !cachedRecord.bootstrap.viewer &&
      protectedPrefixes.some((prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`))
    ) {
      throw redirect(307, '/onboarding');
    }

    return finishLayout(cachedRecord.bootstrap, cachedRecord.settings, true);
  }

  const restorePromise: Promise<SessionRestoreResult> = browser
    ? measureAsync('layout:session-restore', tryRestoreAuthenticatedSession)
    : Promise.resolve('skipped');

  let restoreResult: SessionRestoreResult = 'skipped';
  let bootstrap: BootstrapPayload;
  let settings: SettingsPageData | null = null;

  try {
    const settingsPromise = rememberedAuth
      ? getSettings().catch((err) => {
          if (isNetworkLoadError(err)) {
            return null;
          }
          throw err;
        })
      : null;

    const [restored, bootstrapped] = await Promise.all([
      restorePromise,
      measureAsync('layout:bootstrap', loadBootstrapWithRetry)
    ]);
    restoreResult = restored;
    bootstrap = bootstrapped;

    if (restoreResult === 'restored' && !bootstrap.viewer) {
      bootstrap = await measureAsync('layout:bootstrap-after-restore', loadBootstrapWithRetry);
    }

    if (browser && shouldClearSessionAfterBootstrap(restoreResult, bootstrap)) {
      clearAuthenticatedSession();
      if (!hasRememberedAuthCookie()) {
        clearBootstrapCache();
      }
    }

    if (bootstrap.viewer) {
      if (settingsPromise) {
        try {
          settings = await measureAsync('layout:settings-overlapped', () => settingsPromise);
        } catch (err) {
          toLoadError(err, 'Could not load account settings.');
        }
      } else {
        try {
          settings = await measureAsync('layout:settings', getSettings);
        } catch (err) {
          if (!isNetworkLoadError(err)) {
            toLoadError(err, 'Could not load account settings.');
          }
        }
      }
    }

    writeBootstrapCache(bootstrap, settings);
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

  if (
    !bootstrap.viewer &&
    protectedPrefixes.some((prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`))
  ) {
    throw redirect(307, '/onboarding');
  }

  return finishLayout(bootstrap, settings, false);
}) satisfies LayoutLoad;
