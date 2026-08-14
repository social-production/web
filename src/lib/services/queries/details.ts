import { currentAdapter } from '$lib/services/adapters';

export function getProject(slug: string) {
  return currentAdapter.getProject(slug);
}

export function getProjectHistory(slug: string) {
  return currentAdapter.getProjectHistory(slug);
}

export function getProjectLinks(slug: string) {
  return currentAdapter.getProjectLinks(slug);
}

export function getThread(slug: string) {
  return currentAdapter.getThread(slug);
}

export function getPost(id: string) {
  return currentAdapter.getPost(id);
}

export function getHelpRequest(id: string) {
  return currentAdapter.getHelpRequest(id);
}

export function getEvent(slug: string) {
  return currentAdapter.getEvent(slug);
}

export function getEventHistory(slug: string) {
  return currentAdapter.getEventHistory(slug);
}

export function getEventLinks(slug: string) {
  return currentAdapter.getEventLinks(slug);
}
