/** API path prefixes proxied to the FastAPI backend in local dev. */
export const backendProxyPaths = [
  '/auth',
  '/bootstrap',
  '/onboarding',
  '/feeds',
  '/content',
  '/projects',
  '/events',
  '/governance',
  '/messages',
  '/notifications',
  '/users',
  '/search',
  '/scopes',
  '/platform',
  '/board',
  '/feedback',
  '/healthz',
  '/readyz',
  '/locations'
] as const;
