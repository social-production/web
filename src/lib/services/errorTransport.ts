/**
 * Provider-neutral error helpers. Drivers register implementations so feature
 * code never imports FastAPI client internals.
 */
export interface ErrorTransport {
  extractErrorMessage(err: unknown, fallback: string): string;
  isApiClientError(err: unknown): err is { status: number; body: unknown };
  isNetworkLoadError(err: unknown): boolean;
  /** Throws a load-compatible error; return type is `never`. */
  toLoadError(err: unknown, fallbackMessage?: string): never;
}

let activeTransport: ErrorTransport | null = null;

export function setErrorTransport(transport: ErrorTransport): void {
  activeTransport = transport;
}

export function getErrorTransport(): ErrorTransport {
  if (!activeTransport) {
    throw new Error('Error transport is not configured. Create an API driver first.');
  }
  return activeTransport;
}
