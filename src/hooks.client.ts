import type { HandleClientError } from '@sveltejs/kit';
import { dev } from '$app/environment';

const MAX_CLIENT_ERROR_MESSAGE_LENGTH = 200;

function sanitizeClientMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (trimmed.startsWith('<') || trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return 'Something went wrong while loading this page. Try reloading.';
  }

  if (trimmed.length <= MAX_CLIENT_ERROR_MESSAGE_LENGTH) {
    return trimmed;
  }

  return `${trimmed.slice(0, MAX_CLIENT_ERROR_MESSAGE_LENGTH - 1)}…`;
}

export const handleError: HandleClientError = ({ error, status, message }) => {
  if (dev) {
    console.error(error);
  }

  if (typeof message === 'string' && message.trim()) {
    return { message: sanitizeClientMessage(message) };
  }

  if (error instanceof Error && error.message.trim()) {
    return { message: sanitizeClientMessage(error.message) };
  }

  if (status === 404) {
    return { message: 'That page could not be found.' };
  }

  return {
    message: 'Something went wrong while loading this page. Try reloading.'
  };
};
