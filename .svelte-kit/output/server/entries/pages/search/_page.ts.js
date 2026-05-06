import { c as currentAdapter } from "../../../chunks/index2.js";
function getSearch(query) {
  return currentAdapter.getSearch(query);
}
const load = async ({ url }) => {
  return {
    search: await getSearch(url.searchParams.get("q") ?? "")
  };
};
export {
  load
};
