import { error } from "@sveltejs/kit";
import { a as getNotifications } from "../../../chunks/inbox.js";
const load = async () => {
  const notifications = await getNotifications();
  if (!notifications) {
    throw error(404, "Notifications not available");
  }
  return { notifications };
};
export {
  load
};
