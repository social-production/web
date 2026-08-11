import type { ErrorTransport } from '$lib/services/errorTransport';
import {
  extractErrorMessage,
  isApiClientError,
  isNetworkLoadError,
  toLoadError
} from './client';

export function createSupabaseErrorTransport(): ErrorTransport {
  return {
    extractErrorMessage,
    isApiClientError,
    isNetworkLoadError,
    toLoadError(err, fallbackMessage = 'Something went wrong'): never {
      return toLoadError(err, fallbackMessage);
    }
  };
}
