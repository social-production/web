export function commitSingleSuggestion(
  event: KeyboardEvent,
  suggestions: string[],
  handler: (value: string) => void
) {
  if (event.key === 'Enter' && suggestions.length === 1) {
    event.preventDefault();
    handler(suggestions[0]);
  }
}

export function mergeScopeOptions<T extends { slug: string }>(...groups: T[][]) {
  const seen = new Set<string>();
  const merged: T[] = [];

  for (const group of groups) {
    for (const item of group) {
      if (!seen.has(item.slug)) {
        seen.add(item.slug);
        merged.push(item);
      }
    }
  }

  return merged;
}
