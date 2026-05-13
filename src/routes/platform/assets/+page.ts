import { error } from '@sveltejs/kit';
import { getPlatformAssets } from '$lib/services/queries/assets';
import { getPlatform } from '$lib/services/queries/scopes';
import type { PageLoad } from './$types';

export const load = (async () => {
  const [scope, assets] = await Promise.all([getPlatform(), getPlatformAssets()]);

  if (!scope || !assets) {
    throw error(404, 'Platform assets not found');
  }

  return { scope, assets };
}) satisfies PageLoad;