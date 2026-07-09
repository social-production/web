import { searchKindLabels } from '$lib/features/search/searchKinds';
import type { SearchResultKind } from '$lib/types/search';
import { isImplementedScheduleLabel } from '$lib/utils/scheduleMeta';

export function formatSearchMeta(meta: string, kind: SearchResultKind): string {
  const trimmed = meta.trim();

  if (isImplementedScheduleLabel(trimmed)) {
    return trimmed;
  }

  return searchKindLabels[kind] ?? '';
}
