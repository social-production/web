import { error } from "@sveltejs/kit";
import { b as getProfile } from "../../../../chunks/account.js";
const load = async ({ params }) => {
  const profile = await getProfile(params.username);
  if (!profile) {
    throw error(404, "Profile not found");
  }
  return { profile };
};
export {
  load
};
