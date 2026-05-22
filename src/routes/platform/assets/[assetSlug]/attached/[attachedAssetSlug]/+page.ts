import { error } from '@sveltejs/kit';
import { isAssetsSurfaceEnabled } from '$lib/config/features/phaseScope';
import { getPlatformAssets } from '$lib/services/queries/assets';
import { getBootstrap } from '$lib/services/queries/bootstrap';
import { getPlatform } from '$lib/services/queries/scopes';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  const [bootstrap, scope, assets] = await Promise.all([getBootstrap(), getPlatform(), getPlatformAssets()]);

  if (!isAssetsSurfaceEnabled(bootstrap.featureFlags)) {
    throw error(404, 'Platform assets not found');
  }

  if (!scope || !assets) {
    throw error(404, 'Platform assets not found');
  }

  const parentAsset = assets.landAssets.find((entry) => entry.slug === params.assetSlug);

  if (!parentAsset) {
    throw error(404, 'Parent land asset not found');
  }

  const asset = parentAsset.attachedAssets.find((entry) => entry.slug === params.attachedAssetSlug);

  if (!asset) {
    throw error(404, 'Attached asset not found');
  }

  return {
    scope,
    parentAsset,
    asset,
    featureOpen: assets.featureOpen
  };
}) satisfies PageLoad;
