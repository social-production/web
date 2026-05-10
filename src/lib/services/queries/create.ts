import { currentAdapter } from '$lib/services/adapters';
import type {
  CreateChannelInput,
  CreateCommunityInput,
  CreateEventInput,
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

export function createEvent(input: CreateEventInput) {
  return currentAdapter.createEvent(input);
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