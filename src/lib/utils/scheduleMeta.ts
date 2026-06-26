const PLACEHOLDER_LABELS = new Set(['tbd', 'not specified', 'to be determined']);

export function isImplementedScheduleLabel(label: string | null | undefined): boolean {
  const normalized = (label ?? '').trim();

  if (!normalized) {
    return false;
  }

  return !PLACEHOLDER_LABELS.has(normalized.toLowerCase());
}
