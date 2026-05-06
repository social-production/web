import { error } from "@sveltejs/kit";
import { a as getCommunity } from "../../../../chunks/scopes.js";
const load = async ({ params }) => {
  const scope = await getCommunity(params.slug);
  if (!scope) {
    throw error(404, "Community not found");
  }
  return { scope };
};
export {
  load
};
