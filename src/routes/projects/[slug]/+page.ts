import { getProject } from '$lib/services/queries/details';
import { extractErrorMessage, isApiClientError, isNetworkLoadError } from '$lib/services/errors';
import type { PageLoad } from './$types';

export const ssr = false;

function projectLoadError(err: unknown, fallback: string): { project: null; loadError: string } {
  return {
    project: null,
    loadError: extractErrorMessage(err, fallback)
  };
}

export const load = (async ({ params, depends }) => {
  depends('app:bootstrap');
  depends(`app:project:${params.slug}`);

  try {
    const project = await getProject(params.slug);

    if (!project) {
      return {
        project: null,
        loadError:
          'This project is no longer available. It may have been removed by community moderation.'
      };
    }

    return { project, loadError: null as string | null };
  } catch (err) {
    if (isApiClientError(err) && err.status === 404) {
      return {
        project: null,
        loadError:
          'This project is no longer available. It may have been removed by community moderation.'
      };
    }

    if (isNetworkLoadError(err)) {
      return {
        project: null,
        loadError: 'Could not load this project. Check your connection and try again.'
      };
    }

    return projectLoadError(err, 'Could not load this project.');
  }
}) satisfies PageLoad;
