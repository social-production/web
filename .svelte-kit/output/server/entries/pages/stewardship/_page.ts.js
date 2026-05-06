import { error } from "@sveltejs/kit";
import { b as getStewardship } from "../../../chunks/scopes.js";
const load = async () => {
  const scope = await getStewardship();
  if (!scope) {
    throw error(404, "Stewardship not found");
  }
  return { scope };
};
export {
  load
};
