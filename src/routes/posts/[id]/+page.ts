import { error } from '@sveltejs/kit';
import { getPost } from '$lib/services/queries/details';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  const post = await getPost(params.id);

  if (!post) {
    throw error(404, 'Post not found');
  }

  return { post };
}) satisfies PageLoad;