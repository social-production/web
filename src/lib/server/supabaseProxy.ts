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
  'content-length'
]);

function supabaseOrigin(): string {
  return (import.meta.env.VITE_SUPABASE_URL ?? 'http://127.0.0.1:54321').replace(/\/$/, '');
}

export async function proxyToSupabase(
  request: Request,
  prefix: '/functions/v1' | '/auth/v1',
  rest: string
): Promise<Response> {
  const target = `${supabaseOrigin()}${prefix}/${rest}${new URL(request.url).search}`;
  const headers = new Headers();
  for (const [key, value] of request.headers.entries()) {
    if (HOP_BY_HOP.has(key.toLowerCase())) continue;
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
  const responseHeaders = new Headers();
  for (const [key, value] of upstream.headers.entries()) {
    if (HOP_BY_HOP.has(key.toLowerCase())) continue;
    responseHeaders.set(key, value);
  }
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders
  });
}
