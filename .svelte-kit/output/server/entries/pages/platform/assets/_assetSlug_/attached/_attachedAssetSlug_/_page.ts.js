import { error } from "@sveltejs/kit";
import { g as getPlatformAssets } from "../../../../../../../chunks/assets.js";
import { b as getPlatform } from "../../../../../../../chunks/scopes.js";
const load = async ({ params }) => {
  const [scope, assets] = await Promise.all([getPlatform(), getPlatformAssets()]);
  if (!scope || !assets) {
    throw error(404, "Platform assets not found");
  }
  const parentAsset = assets.landAssets.find((entry) => entry.slug === params.assetSlug);
  if (!parentAsset) {
    throw error(404, "Parent land asset not found");
  }
  const asset = parentAsset.attachedAssets.find((entry) => entry.slug === params.attachedAssetSlug);
  if (!asset) {
    throw error(404, "Attached asset not found");
  }
  return {
    scope,
    parentAsset,
    asset,
    featureOpen: assets.featureOpen
  };
};
export {
  load
};
