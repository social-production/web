export const HANDLE_MIN_LENGTH = 3;
export const HANDLE_MAX_LENGTH = 32;

const HANDLE_PATTERN = /^[A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*$/;

export const HANDLE_ERROR_GENERIC =
  'Use 3–32 characters: letters, numbers, hyphens, or underscores. No spaces, and no leading, trailing, or repeated separators.';

export function canonicalizeHandle(value: string): string {
  return value.trim().toLowerCase();
}

export function validateHandle(
  value: string,
  fieldLabel = 'Handle'
): { ok: true; display: string; canonical: string } | { ok: false; error: string } {
  const display = value.trim();
  if (!display) {
    return { ok: false, error: `${fieldLabel} is required` };
  }

  if (/\s/.test(display)) {
    return { ok: false, error: `${fieldLabel} cannot contain spaces` };
  }

  if (display.length < HANDLE_MIN_LENGTH || display.length > HANDLE_MAX_LENGTH) {
    return {
      ok: false,
      error: `${fieldLabel} must be ${HANDLE_MIN_LENGTH}–${HANDLE_MAX_LENGTH} characters`
    };
  }

  if (
    display.startsWith('-') ||
    display.startsWith('_') ||
    display.endsWith('-') ||
    display.endsWith('_') ||
    display.includes('--') ||
    display.includes('__') ||
    display.includes('-_') ||
    display.includes('_-')
  ) {
    return { ok: false, error: HANDLE_ERROR_GENERIC };
  }

  if (!HANDLE_PATTERN.test(display)) {
    return { ok: false, error: HANDLE_ERROR_GENERIC };
  }

  return { ok: true, display, canonical: canonicalizeHandle(display) };
}
