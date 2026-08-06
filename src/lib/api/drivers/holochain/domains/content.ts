/**
 * Holochain `content` domain scaffold.
 * Responsibility: threads, posts, comments, votes, reports (explicit governance refs).
 * Replace stubs with real `web-holochain` calls mapped to `$lib/types/*`.
 */
import type { AppAdapter } from '$lib/services/adapters/types';
import { stubMethod } from '../../scaffold';

const provider = 'holochain' as const;
const domain = 'content' as const;

export const contentDomain: Partial<AppAdapter> = {
  getThread: stubMethod(provider, domain, 'getThread') as AppAdapter['getThread'],
  getPost: stubMethod(provider, domain, 'getPost') as AppAdapter['getPost'],
  createThread: stubMethod(provider, domain, 'createThread') as AppAdapter['createThread'],
  createPost: stubMethod(provider, domain, 'createPost') as AppAdapter['createPost'],
  setVote: stubMethod(provider, domain, 'setVote') as AppAdapter['setVote'],
  getComments: stubMethod(provider, domain, 'getComments') as AppAdapter['getComments'],
  addComment: stubMethod(provider, domain, 'addComment') as AppAdapter['addComment'],
  submitReport: stubMethod(provider, domain, 'submitReport') as AppAdapter['submitReport'],
  setReportVote: stubMethod(provider, domain, 'setReportVote') as AppAdapter['setReportVote'],
};

