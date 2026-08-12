import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

  if (event.url.protocol === 'https:') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Permissive baseline CSP for SvelteKit; tighten iteratively as inline usage is reduced.
  // Local Supabase is same-origin via the Vite proxy in DEV; keep explicit :54321 hosts as fallback
  // when VITE_SUPABASE_SAME_ORIGIN=false. Port wildcards are unreliable in some browsers.
  const connectSrc = [
    "'self'",
    'https:',
    'http://127.0.0.1:54321',
    'http://localhost:54321',
    'http://127.0.0.1:5173',
    'http://localhost:5173',
    'ws://127.0.0.1:5173',
    'ws://localhost:5173',
    'wss:'
  ].join(' ');

  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      `connect-src ${connectSrc}`,
      "worker-src blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  );

  return response;
};
