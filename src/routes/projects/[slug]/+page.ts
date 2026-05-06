import { error } from '@sveltejs/kit';
import { getProject } from '$lib/services/queries/details';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  const project = await getProject(params.slug);

  if (!project) {
    throw error(404, 'Project not found');
  }

  return { project };
}) satisfies PageLoad;