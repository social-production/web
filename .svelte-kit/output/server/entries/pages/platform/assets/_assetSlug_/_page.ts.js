import { error } from "@sveltejs/kit";
import { g as getPlatformAssets } from "../../../../../chunks/assets.js";
import { b as getPlatform } from "../../../../../chunks/scopes.js";
const load = async ({ params }) => {
  const [scope, assets] = await Promise.all([getPlatform(), getPlatformAssets()]);
  if (!scope || !assets) {
    throw error(404, "Platform assets not found");
  }
  const asset = assets.landAssets.find((entry) => entry.slug === params.assetSlug);
  if (!asset) {
    throw error(404, "Land asset not found");
  }
  return {
    scope,
    asset,
    featureOpen: assets.featureOpen
  };
};
export {
  load
};
