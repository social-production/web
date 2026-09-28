import { getFeedbackPage } from '$lib/services/queries/feedback';
import type { FeedbackFilter, FeedbackSort } from '$lib/types/feedback';
import type { PageLoad } from './$types';

function normalizeFilter(value: string | null | undefined): FeedbackFilter {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized === 'bugs' || normalized === 'suggestions') {
    return normalized;
  }
  return 'all';
}

function normalizeSort(value: string | null | undefined): FeedbackSort {
  return (value ?? '').trim().toLowerCase() === 'recent' ? 'recent' : 'trending';
}

export const load = (async ({ url }) => {
  const page = await getFeedbackPage({
    filter: normalizeFilter(url.searchParams.get('filter')),
    sort: normalizeSort(url.searchParams.get('sort')),
    limit: 100,
    offset: 0,
  });

  return { page };
}) satisfies PageLoad;
