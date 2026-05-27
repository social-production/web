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

export async function fetchSearch(query: string): Promise<SearchPageData> {
  const res = await apiClient.get<BackendSearchResponse>(
    `/search?q=${encodeURIComponent(query)}`
  );
  return {
    query,
    suggestedQueries: [],
    results: res.items.map(item => ({
      id: item.entity_id,
      kind: KIND_MAP[item.entity_type] ?? 'project',
      title: item.title,
      summary: item.summary,
      href: item.href,
      meta: item.meta
    }))
  };
}
