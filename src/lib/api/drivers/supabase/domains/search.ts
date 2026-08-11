import { apiClient } from '../client';
import type { AppAdapter } from '$lib/services/adapters/types';
import type { SearchPageData, SearchResultKind } from '$lib/types/search';

const DEFAULT_SUGGESTED_QUERIES = ['platform', 'community', 'project', 'event'];

const KIND_MAP: Record<string, SearchResultKind> = {
  project: 'project',
  thread: 'thread',
  event: 'event',
  channel: 'channel',
  community: 'community',
  user: 'profile',
  profile: 'profile'
};

export async function fetchSearch(
  query: string,
  options?: { entityTypes?: Array<'project' | 'event' | 'thread' | 'channel' | 'community' | 'user'>; limit?: number }
): Promise<SearchPageData> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { query: '', suggestedQueries: DEFAULT_SUGGESTED_QUERIES, results: [] };
  }
  const params = new URLSearchParams({ q: trimmed });
  if (options?.limit) params.set('limit', String(options.limit));
  for (const entityType of options?.entityTypes ?? []) {
    params.append('entity_types', entityType);
  }
  const res = await apiClient.get<{
    total?: number;
    items?: Array<{
      id?: string;
      entityType?: string;
      entity_type?: string;
      entityId?: string;
      entity_id?: string;
      title: string;
      summary?: string;
      meta?: string;
      href: string;
      kind?: SearchResultKind;
    }>;
    results?: SearchPageData['results'];
    suggestedQueries?: string[];
  }>(`/search?${params}`);

  if (res.results) {
    return {
      query: trimmed,
      suggestedQueries: res.suggestedQueries ?? [],
      results: res.results
    };
  }

  return {
    query: trimmed,
    suggestedQueries: [],
    results: (res.items ?? []).map((item) => {
      const entityType = item.entityType ?? item.entity_type ?? item.kind ?? 'project';
      const id = item.entityId ?? item.entity_id ?? item.id ?? '';
      const href =
        entityType === 'user' && item.href.startsWith('/users/')
          ? item.href.replace(/^\/users\//, '/profile/')
          : item.href;
      return {
        id,
        kind: KIND_MAP[entityType] ?? (item.kind as SearchResultKind) ?? 'project',
        title: item.title,
        summary: item.summary ?? '',
        href,
        meta: item.meta ?? ''
      };
    })
  };
}

export const searchDomain: Partial<AppAdapter> = {
  getSearch: fetchSearch
};
