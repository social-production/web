import { error } from "@sveltejs/kit";
import { g as getChannel } from "../../../../chunks/scopes.js";
const load = async ({ params }) => {
  const scope = await getChannel(params.slug);
  if (!scope) {
    throw error(404, "Channel not found");
  }
  return { scope };
};
export {
  load
};
