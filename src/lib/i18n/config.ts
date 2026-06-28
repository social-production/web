/** When false, the app always uses English regardless of browser or saved preference. */
export const I18N_ENABLED = false;

export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English', enabled: true },
  { value: 'nl', label: 'Nederlands', enabled: false }
] as const;
