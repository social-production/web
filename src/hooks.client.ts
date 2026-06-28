import type { HandleClientError } from '@sveltejs/kit';
import { dev } from '$app/environment';

export const handleError: HandleClientError = ({ error, status, message }) => {
  if (dev) {
    console.error(error);
  }

  if (typeof message === 'string' && message.trim()) {
    return { message };
  }

  if (error instanceof Error && error.message.trim()) {
    return { message: error.message };
  }

  if (status === 404) {
    return { message: 'That page could not be found.' };
  }

  return {
    message: 'Something went wrong while loading this page. Try reloading.'
  };
};
