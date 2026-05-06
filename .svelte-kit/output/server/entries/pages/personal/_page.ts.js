import { a as getPersonalFeed } from "../../../chunks/feeds.js";
const load = async () => {
  return {
    items: await getPersonalFeed()
  };
};
export {
  load
};
