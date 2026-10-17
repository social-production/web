import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// Short profile links (/u/name) go to the profile page.
export const load = (({ params }) => {
  throw redirect(308, `/profile/${encodeURIComponent(params.username)}`);
}) satisfies PageLoad;
