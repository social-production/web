import type { RequestHandler } from './$types';
import { proxyToSupabase } from '$lib/server/supabaseProxy';

const handler: RequestHandler = ({ request, params }) => {
  const rest = params.path ?? '';
  return proxyToSupabase(request, '/auth/v1', rest);
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
