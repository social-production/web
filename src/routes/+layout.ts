import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { getSettings } from '$lib/services/queries/account';
import { hydrateClientSettingsState } from '$lib/services/queries/account';
import { getBootstrap } from '$lib/services/queries/bootstrap';
import { syncUnreadCountsFromBootstrap } from '$lib/services/queries/inbox';
import { getStoredToken } from '$lib/api/drivers/fastapi/auth';
import { isNetworkLoadError, toLoadError } from '$lib/api/drivers/fastapi/client';
import {
  applyLocale,
  detectBrowserLocale,
  readLanguageCookie,
  resolveLocale,
  type SupportedLocale
} from '$lib/i18n/locale';
import { I18N_ENABLED } from '$lib/i18n/config';
import type { BootstrapPayload } from '$lib/types/bootstrap';
import type { LayoutLoad } from './$types';

export const ssr = false;

const protectedPrefixes = ['/personal', '/messages', '/notifications', '/settings', '/create'];
let didHydrateClientState = false;

function bootstrapCacheKey(): string {
  const token = getStoredToken();
  return token ? `sp_bootstrap_cache_${token.slice(-24)}` : 'sp_bootstrap_cache_anon';
}

function readBootstrapCache(): BootstrapPayload | null {
  if (!browser) {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(bootstrapCacheKey());
    return raw ? (JSON.parse(raw) as BootstrapPayload) : null;
  } catch {
    return null;
  }
}

function writeBootstrapCache(payload: BootstrapPayload) {
  if (!browser) {
    return;
  }

  try {
    sessionStorage.setItem(bootstrapCacheKey(), JSON.stringify(payload));
  } catch {
    // ignore quota errors
  }
}

export const load = (async ({ url, depends }) => {
  depends('app:bootstrap');

  if (browser && !didHydrateClientState) {
    await hydrateClientSettingsState();
    didHydrateClientState = true;
  }

  let bootstrap: BootstrapPayload;
  try {
    bootstrap = await getBootstrap();
    writeBootstrapCache(bootstrap);
  } catch (err) {
    const cached = readBootstrapCache();
    if (cached) {
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
  }

  return {
    bootstrap,
    settings,
    locale
  };
}) satisfies LayoutLoad;
