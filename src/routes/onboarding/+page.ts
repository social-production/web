import { getOnboarding } from '$lib/services/queries/account';
import type { PageLoad } from './$types';

export const load = (async () => {
  return {
    onboarding: await getOnboarding()
  };
}) satisfies PageLoad;