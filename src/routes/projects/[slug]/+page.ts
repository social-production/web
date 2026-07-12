import { error } from '@sveltejs/kit';
import { getProject } from '$lib/services/queries/details';
import {
  extractErrorMessage,
  isApiClientError,
  isNetworkLoadError,
  toLoadError
} from '$lib/api/drivers/fastapi/client';
import type { PageLoad } from './$types';

export const ssr = false;

export const load = (async ({ params }) => {
  try {
    const project = await getProject(params.slug);

    if (!project) {
      throw error(404, 'Project not found');
    }

    return { project, loadError: null as string | null };
  } catch (err) {
    if (isApiClientError(err) && err.status >= 500) {
      return {
        project: null,
        loadError: extractErrorMessage(err, 'Could not load this project.')
      };
    }

    if (isNetworkLoadError(err)) {
      return {
        project: null,
        loadError: 'Could not load this project. Check your connection and try again.'
      };
    }

    toLoadError(err, 'Could not load this project.');
  }
}) satisfies PageLoad;
