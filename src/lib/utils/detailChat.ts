import { fetchComments, mapComment } from '$lib/api/drivers/fastapi/domains/content';
import type { DetailComment } from '$lib/types/detail';

export async function refreshSubjectDiscussion(
  subjectType: 'project' | 'event',
  subjectId: string
): Promise<DetailComment[]> {
  const items = await fetchComments(subjectType, subjectId);
  return items.map(mapComment);
}
