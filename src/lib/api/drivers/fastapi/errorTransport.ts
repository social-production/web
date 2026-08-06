import {
  extractErrorMessage,
  isApiClientError,
  isNetworkLoadError,
  toLoadError
} from './client';
import type { ErrorTransport } from '$lib/services/errorTransport';

export function createFastApiErrorTransport(): ErrorTransport {
  return {
    extractErrorMessage,
    isApiClientError,
    isNetworkLoadError,
    toLoadError(err, fallbackMessage = 'Something went wrong'): never {
      return toLoadError(err, fallbackMessage);
    }
  };
}
