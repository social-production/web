import { error } from "@sveltejs/kit";
import { g as getPlatformAssets } from "../../../../chunks/assets.js";
import { b as getPlatform } from "../../../../chunks/scopes.js";
const load = async () => {
  const [scope, assets] = await Promise.all([getPlatform(), getPlatformAssets()]);
  if (!scope || !assets) {
    throw error(404, "Platform assets not found");
  }
  return { scope, assets };
};
export {
  load
};
