import type { Handle } from '@sveltejs/kit';
import { rewriteProxiedSetCookie } from '$lib/server/rewriteSetCookie';

const API_PREFIX = '/api';

function apiProxyTarget(): string | null {
  const raw = process.env.API_PROXY_TARGET?.trim() || process.env.VITE_API_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, '');
}

async function proxyApi(event: Parameters<Handle>[0]['event']): Promise<Response> {
  const target = apiProxyTarget();
  if (!target) {
    return new Response('API proxy is not configured', { status: 502 });
  }

  const upstreamPath = event.url.pathname.slice(API_PREFIX.length) || '/';
  const upstreamUrl = `${target}${upstreamPath}${event.url.search}`;
  const headers = new Headers(event.request.headers);
  headers.delete('host');
  headers.delete('content-length');

  const init: RequestInit & { duplex?: 'half' } = {
    method: event.request.method,
    headers,
    redirect: 'manual'
  };
  if (event.request.method !== 'GET' && event.request.method !== 'HEAD') {
    init.body = event.request.body;
    init.duplex = 'half';
  }

  const upstream = await fetch(upstreamUrl, init);
  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (key === 'set-cookie' || key === 'content-encoding' || key === 'content-length') return;
    responseHeaders.append(key, value);
  });
  for (const cookie of upstream.headers.getSetCookie()) {
    responseHeaders.append('set-cookie', rewriteProxiedSetCookie(cookie));
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders
  });
}

export const handle: Handle = async ({ event, resolve }) => {
  if (event.url.pathname === API_PREFIX || event.url.pathname.startsWith(`${API_PREFIX}/`)) {
    return proxyApi(event);
  }

  const response = await resolve(event);

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(self), geolocation=(self)');

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
      "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://basemaps.cartocdn.com https://demotiles.maplibre.org",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob:",
      "font-src 'self' data: https://fonts.gstatic.com https://basemaps.cartocdn.com https://demotiles.maplibre.org",
      `connect-src ${connectSrc}`,
      "worker-src 'self' blob:",
      "frame-src https://challenges.cloudflare.com",
      "child-src 'self' blob: https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  );

  return response;
};
