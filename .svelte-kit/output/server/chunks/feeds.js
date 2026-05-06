import { c as currentAdapter } from "./index2.js";
function getPublicFeed() {
  return currentAdapter.getPublicFeed();
}
function getPersonalFeed() {
  return currentAdapter.getPersonalFeed();
}
export {
  getPersonalFeed as a,
  getPublicFeed as g
};
