import { redirect } from "@sveltejs/kit";
import { g as getSettings } from "../../chunks/account.js";
import { c as currentAdapter } from "../../chunks/index2.js";
function getBootstrap() {
  return currentAdapter.getBootstrap();
}
const protectedPrefixes = ["/personal", "/messages", "/notifications", "/settings", "/create"];
const load = async ({ url }) => {
  const bootstrap = await getBootstrap();
  if (!bootstrap.viewer && protectedPrefixes.some((prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`))) {
    throw redirect(307, "/onboarding");
  }
  const settings = bootstrap.viewer ? await getSettings() : null;
  return {
    bootstrap,
    settings
  };
};
export {
  load
};
