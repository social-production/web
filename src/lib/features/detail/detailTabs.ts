export type DetailTabId = 'context' | 'participation' | 'chat' | 'links' | 'history';

export function detailTabFromParam(value: string | null): DetailTabId | null {
  if (value === 'overview' || value === 'context' || value === 'details') return 'context';
  if (
    value === 'participation' ||
    value === 'chat' ||
    value === 'links' ||
    value === 'history'
  ) {
    return value;
  }
  return null;
}
