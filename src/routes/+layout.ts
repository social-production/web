import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { getSettings } from '$lib/services/queries/account';
import { hydrateClientSettingsState } from '$lib/services/queries/account';
import { getBootstrap } from '$lib/services/queries/bootstrap';
import {
  clearBootstrapCache,
  isBootstrapCacheUsable,
  readBootstrapCache,
  writeBootstrapCache
} from '$lib/services/bootstrapCache';
import {
  clearAuthenticatedSession,
  hasAuthenticatedSession
} from '$lib/api/drivers/fastapi/auth';
import { syncUnreadCountsFromBootstrap } from '$lib/services/queries/inbox';
import { isNetworkLoadError, toLoadError } from '$lib/api/drivers/fastapi/client';
import {
  applyLocale,
  detectBrowserLocale,
  readLanguageCookie,
  resolveLocale,
  type SupportedLocale
} from '$lib/i18n/locale';
import { I18N_ENABLED } from '$lib/i18n/config';
import { setDisplayTimezone } from '$lib/stores/timezoneStore';
import type { LayoutLoad } from './$types';

export const ssr = false;

const protectedPrefixes = ['/personal', '/messages', '/notifications', '/settings', '/create'];
let didHydrateClientState = false;

export const load = (async ({ url, depends }) => {
  depends('app:bootstrap');

  if (browser && !didHydrateClientState) {
    await hydrateClientSettingsState();
    didHydrateClientState = true;
  }

  let bootstrap;
  try {
    bootstrap = await getBootstrap();
    if (browser && hasAuthenticatedSession() && !bootstrap.viewer) {
      clearAuthenticatedSession();
      clearBootstrapCache();
    }
    writeBootstrapCache(bootstrap);
  } catch (err) {
    const cached = readBootstrapCache();
    if (cached && isBootstrapCacheUsable(cached)) {
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
