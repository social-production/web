/**
 * Build-time product switches. Set them in `.env.local` or as Railway build args.
 * `true` / `false` are explicit. An empty value keeps the default.
 */
export function parseFlag(value: string | undefined, fallback: boolean): boolean {
  const raw = (value ?? '').trim().toLowerCase();
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return fallback;
}

/** New accounts can be created. Defaults on so local signup keeps working. */
export const SIGNUP_ENABLED = parseFlag(import.meta.env.VITE_SIGNUP_ENABLED, true);

/** Installable app: manifest, icons, and service worker. Defaults off until opted in. */
export const PWA_ENABLED = parseFlag(import.meta.env.VITE_PWA_ENABLED, false);

/** Browser push UI. The push backend is a later phase; the switch is ready now. */
export const PUSH_ENABLED = parseFlag(import.meta.env.VITE_PUSH_ENABLED, false);

/** Public Cloudflare Turnstile site key. Empty means signup does not show a captcha. */
export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ?? '';
