import { fetchComments, mapComment } from '$lib/api/drivers/fastapi/domains/content';
import type { DetailComment } from '$lib/types/detail';

export type DiscussionSubjectType = 'project' | 'event' | 'help_request';

export async function refreshSubjectDiscussion(
  subjectType: DiscussionSubjectType,
  subjectId: string
): Promise<DetailComment[]> {
  const items = await fetchComments(subjectType, subjectId);
  return items.map(mapComment);
}
