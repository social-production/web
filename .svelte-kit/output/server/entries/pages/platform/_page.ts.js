import { error } from "@sveltejs/kit";
import { b as getPlatform } from "../../../chunks/scopes.js";
const load = async () => {
  const scope = await getPlatform();
  if (!scope) {
    throw error(404, "Platform not found");
  }
  return { scope };
};
export {
  load
};
