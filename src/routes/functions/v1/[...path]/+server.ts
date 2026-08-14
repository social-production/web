import type { RequestHandler } from './$types';
import { proxyToSupabase } from '$lib/server/supabaseProxy';

export const prerender = false;

const handler: RequestHandler = ({ request, params }) => {
  return proxyToSupabase(request, '/functions/v1', params.path);
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
