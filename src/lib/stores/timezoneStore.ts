import { browser } from '$app/environment';
import { get, writable } from 'svelte/store';

function browserTimezone() {
  if (!browser) {
    return 'UTC';
  }

  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

export const displayTimezone = writable<string | null>(null);

export function getDisplayTimezone() {
  const value = get(displayTimezone);
  return value?.trim() || browserTimezone();
}

export function setDisplayTimezone(value: string | null) {
  displayTimezone.set(value?.trim() || null);
}

export function listDisplayTimezones() {
  const intlWithValues = Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] };
  if (typeof intlWithValues.supportedValuesOf === 'function') {
    return intlWithValues.supportedValuesOf('timeZone').slice().sort();
  }

  return [browserTimezone(), 'UTC', 'Europe/Amsterdam', 'America/New_York', 'America/Los_Angeles'];
}
