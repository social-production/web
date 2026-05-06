import { g as getPublicFeed } from "../../chunks/feeds.js";
const load = async () => {
  return {
    items: await getPublicFeed()
  };
};
export {
  load
};
