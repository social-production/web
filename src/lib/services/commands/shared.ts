import { currentAdapter } from '$lib/services/adapters';

export function addComment(
  subjectId: string,
  body: string,
  parentId?: string,
  subjectType?: 'thread' | 'post' | 'event' | 'project' | 'help_request'
) {
  return currentAdapter.addComment(subjectId, body, parentId, subjectType);
}

export function submitReport(subjectId: string, targetId: string, reason: string, details: string) {
  return currentAdapter.submitReport(subjectId, targetId, reason, details);
}

export function setReportVote(targetId: string, vote: 'yes' | 'no') {
  return currentAdapter.setReportVote(targetId, vote);
}

export function commitHelpRequestRole(helpRequestId: string, roleId: string) {
  return currentAdapter.commitHelpRequestRole(helpRequestId, roleId);
}

export function uncommitHelpRequestRole(helpRequestId: string, roleId: string) {
  return currentAdapter.uncommitHelpRequestRole(helpRequestId, roleId);
}
