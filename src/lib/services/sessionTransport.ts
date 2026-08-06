export type RefreshSessionFn = () => Promise<boolean>;

export type SessionRestoreResult = 'restored' | 'skipped' | 'auth-failed' | 'transient-failure';

/**
 * Provider-neutral session/auth transport.
 * FastAPI implements cookie/CSRF refresh; future providers can swap this.
 */
export interface SessionTransport {
  refreshSession: RefreshSessionFn;
  markAuthenticatedSession(): void;
  clearAuthenticatedSession(): void;
  hasAuthenticatedSession(): boolean;
  hasRememberedAuthCookie(): boolean;
  shouldAttemptSessionRefresh(): boolean;
  getCsrfToken(): string | null;
  tryRestoreAuthenticatedSession(): Promise<SessionRestoreResult>;
}

let activeTransport: SessionTransport | null = null;

export function setSessionTransport(transport: SessionTransport): void {
  activeTransport = transport;
}

export function getSessionTransport(): SessionTransport {
  if (!activeTransport) {
    throw new Error('Session transport is not configured. Create an API driver first.');
  }
  return activeTransport;
}
