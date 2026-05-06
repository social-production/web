import { error } from "@sveltejs/kit";
import { g as getMessages } from "../../../chunks/inbox.js";
const load = async () => {
  const messages = await getMessages();
  if (!messages) {
    throw error(404, "Messages not available");
  }
  return { messages };
};
export {
  load
};
