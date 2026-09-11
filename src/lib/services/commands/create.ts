import { currentAdapter } from '$lib/services/adapters';
import { requestActivityRailRefresh } from '$lib/services/queries/bootstrap';
import type {
  CreateChannelInput,
  CreateCommunityInput,
  CreateEventInput,
  CreateHelpRequestInput,
  CreatePostInput,
  CreateProjectInput,
  CreateThreadInput
} from '$lib/types/feed';

export function createProject(input: CreateProjectInput) {
  return currentAdapter.createProject(input);
}

export function createThread(input: CreateThreadInput) {
  return currentAdapter.createThread(input);
}

export async function createEvent(input: CreateEventInput) {
  const result = await currentAdapter.createEvent(input);
  if (result.ok) {
    requestActivityRailRefresh();
  }
  return result;
}

export function createPost(input: CreatePostInput) {
  return currentAdapter.createPost(input);
}

export function createChannel(input: CreateChannelInput) {
  return currentAdapter.createChannel(input);
}

export function createCommunity(input: CreateCommunityInput) {
  return currentAdapter.createCommunity(input);
}

export async function createHelpRequest(input: CreateHelpRequestInput) {
  const result = await currentAdapter.createHelpRequest(input);
  if (result.ok) {
    requestActivityRailRefresh();
  }
  return result;
}
