import { currentAdapter } from '$lib/services/adapters';
import { confirmed } from '$lib/services/commands/confirm';
import type {
  CreateChannelInput,
  CreateCommunityInput,
  CreateEventInput,
  CreateHelpRequestInput,
  CreatePostInput,
  CreateProjectInput,
  CreateThreadInput,
} from '$lib/types/feed';

export function createProject(input: CreateProjectInput) {
  return confirmed(currentAdapter.createProject(input), 'Project created', false);
}

export function createThread(input: CreateThreadInput) {
  return confirmed(currentAdapter.createThread(input), 'Thread posted', false);
}

export function createEvent(input: CreateEventInput) {
  return confirmed(currentAdapter.createEvent(input), 'Event created');
}

export function createPost(input: CreatePostInput) {
  return confirmed(currentAdapter.createPost(input), 'Post published', false);
}

export function sharePostWithUser(postId: string, username: string) {
  return currentAdapter.sharePostWithUser(postId, username);
}

export function shareThreadWithUser(threadSlug: string, username: string) {
  return currentAdapter.shareThreadWithUser(threadSlug, username);
}

export function shareHelpRequestWithUser(helpRequestId: string, username: string) {
  return currentAdapter.shareHelpRequestWithUser(helpRequestId, username);
}

export function createChannel(input: CreateChannelInput) {
  return confirmed(currentAdapter.createChannel(input), 'Channel created', false);
}

export function createCommunity(input: CreateCommunityInput) {
  return confirmed(currentAdapter.createCommunity(input), 'Community created', false);
}

export function createHelpRequest(input: CreateHelpRequestInput) {
  return confirmed(currentAdapter.createHelpRequest(input), 'Help request posted');
}
