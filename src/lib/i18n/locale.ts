import { browser } from '$app/environment';
import { cookieName, getLocale, setLocale } from '$lib/paraglide/runtime.js';

export const LANGUAGE_COOKIE = cookieName;
export const SUPPORTED_LOCALES = ['en', 'nl'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export function normalizeLocale(value: string | null | undefined): SupportedLocale {
  const normalized = value?.trim().toLowerCase() ?? '';
  if (normalized.startsWith('nl')) {
    return 'nl';
  }
  return 'en';
}

export function detectBrowserLocale(): SupportedLocale {
  if (!browser) {
    return 'en';
  }

  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const language of languages) {
    const locale = normalizeLocale(language);
    if (locale === 'nl') {
      return 'nl';
    }
  }

  return 'en';
}

export function readLanguageCookie(): SupportedLocale | null {
  if (!browser) {
    return null;
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${LANGUAGE_COOKIE}=([^;]*)`));
  if (!match) {
    return null;
  }

  return normalizeLocale(decodeURIComponent(match[1]));
}

export function applyLocale(locale: SupportedLocale) {
  setLocale(locale, { reload: false });

  if (browser) {
    document.documentElement.lang = locale;
  }
}

export function resolveLocale(options: {
  accountLanguage?: string | null;
  cookieLanguage?: SupportedLocale | null;
  browserLanguage?: SupportedLocale;
}): SupportedLocale {
  if (options.accountLanguage) {
    return normalizeLocale(options.accountLanguage);
  }

  if (options.cookieLanguage) {
    return options.cookieLanguage;
  }

  return options.browserLanguage ?? 'en';
}

export function currentLocale(): SupportedLocale {
  return normalizeLocale(getLocale());
}
