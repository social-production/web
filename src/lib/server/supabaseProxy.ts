const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
  'content-encoding',
  'accept-encoding'
]);

const SKIP_REQUEST_HEADERS = new Set([...HOP_BY_HOP, 'cookie']);

const SKIP_RESPONSE_HEADERS = new Set([
  ...HOP_BY_HOP,
  'set-cookie',
  'content-encoding',
  'content-length'
]);

function supabaseOrigin(): string {
  return (import.meta.env.VITE_SUPABASE_URL ?? 'http://127.0.0.1:54321').replace(/\/$/, '');
}

export function restPath(path: string | string[] | undefined): string {
  if (Array.isArray(path)) return path.filter(Boolean).join('/');
  return path?.replace(/^\/+/, '') ?? '';
}

export async function proxyToSupabase(
  request: Request,
  prefix: '/functions/v1' | '/auth/v1',
  rest: string | string[] | undefined
): Promise<Response> {
  const target = `${supabaseOrigin()}${prefix}/${restPath(rest)}${new URL(request.url).search}`;
  const headers = new Headers();
  for (const [key, value] of request.headers.entries()) {
    if (SKIP_REQUEST_HEADERS.has(key.toLowerCase())) continue;
    headers.set(key, value);
  }

  const init: RequestInit & { duplex?: 'half' } = {
    method: request.method,
    headers,
    redirect: 'manual'
  };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
    init.duplex = 'half';
  }

  const upstream = await fetch(target, init);
  // Materialize the body so we never forward a gzip stream with a leftover
  // Content-Encoding header (Vercel fetch decompresses; copying that header
  // makes the browser fail JSON.parse on a 200).
  const body = await upstream.arrayBuffer();
  const responseHeaders = new Headers();
  for (const [key, value] of upstream.headers.entries()) {
    if (SKIP_RESPONSE_HEADERS.has(key.toLowerCase())) continue;
    responseHeaders.set(key, value);
  }
  if (!responseHeaders.has('content-type') && body.byteLength > 0) {
    responseHeaders.set('content-type', 'application/json');
  }
  return new Response(body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders
  });
}
