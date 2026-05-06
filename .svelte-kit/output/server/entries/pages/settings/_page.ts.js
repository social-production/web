import { error } from "@sveltejs/kit";
import { g as getSettings } from "../../../chunks/account.js";
const load = async () => {
  const settings = await getSettings();
  if (!settings) {
    throw error(404, "Settings not available");
  }
  return { settings };
};
export {
  load
};
