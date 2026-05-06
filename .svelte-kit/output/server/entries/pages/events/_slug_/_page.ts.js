import { error } from "@sveltejs/kit";
import { g as getEvent } from "../../../../chunks/details.js";
const load = async ({ params }) => {
  const event = await getEvent(params.slug);
  if (!event) {
    throw error(404, "Event not found");
  }
  return { event };
};
export {
  load
};
