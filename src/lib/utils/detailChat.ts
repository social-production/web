import { currentAdapter } from '$lib/services/adapters';
import type { DetailComment } from '$lib/types/detail';

export type DiscussionSubjectType = 'project' | 'event' | 'help_request';

export async function refreshSubjectDiscussion(
  subjectType: DiscussionSubjectType,
  subjectId: string
): Promise<DetailComment[]> {
  return currentAdapter.getComments(subjectType, subjectId);
}

export function getSubjectDiscussion(
  subjectType: string,
  subjectId: string
): Promise<DetailComment[]> {
  return currentAdapter.getComments(subjectType, subjectId);
}
