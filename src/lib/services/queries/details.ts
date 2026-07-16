import { currentAdapter } from '$lib/services/adapters';

export function getProject(slug: string) {
  return currentAdapter.getProject(slug);
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
