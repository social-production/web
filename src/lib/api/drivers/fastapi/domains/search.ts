import { apiClient } from '../client';
import type { SearchPageData, SearchResultKind } from '$lib/types/search';

interface BackendSearchItem {
  id: string;
  entity_type: string;
  entity_id: string;
  title: string;
  summary: string;
  meta: string;
  href: string;
}

interface BackendSearchResponse {
  total: number;
  items: BackendSearchItem[];
}

const KIND_MAP: Record<string, SearchResultKind> = {
  project: 'project',
  thread: 'thread',
  event: 'event',
  channel: 'channel',
  community: 'community',
  user: 'profile'
};

const DEFAULT_SUGGESTED_QUERIES = ['platform', 'community', 'project', 'event'];

function normalizeSearchHref(entityType: string, href: string): string {
  if (entityType === 'user' && href.startsWith('/users/')) {
    return href.replace(/^\/users\//, '/profile/');
  }

  return href;
}

function mapSearchItem(item: BackendSearchItem) {
  return {
    id: item.entity_id,
    kind: KIND_MAP[item.entity_type] ?? 'project',
    title: item.title,
    summary: item.summary,
    href: normalizeSearchHref(item.entity_type, item.href),
    meta: item.meta
  };
}

export async function fetchSearch(query: string): Promise<SearchPageData> {
  const trimmed = query.trim();

  if (!trimmed) {
    return {
      query: '',
      suggestedQueries: DEFAULT_SUGGESTED_QUERIES,
      results: []
    };
  }

  const res = await apiClient.get<BackendSearchResponse>(
    `/search?q=${encodeURIComponent(trimmed)}`
  );
  return {
    query: trimmed,
    suggestedQueries: [],
    results: res.items.map(mapSearchItem)
  };
}
