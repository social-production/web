import { error } from "@sveltejs/kit";
import { c as getThread } from "../../../../chunks/details.js";
const load = async ({ params }) => {
  const thread = await getThread(params.slug);
  if (!thread) {
    throw error(404, "Thread not found");
  }
  return { thread };
};
export {
  load
};
