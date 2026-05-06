import { c as currentAdapter } from "./index2.js";
function getChannel(slug) {
  return currentAdapter.getChannel(slug);
}
function getCommunity(slug) {
  return currentAdapter.getCommunity(slug);
}
function getStewardship() {
  return currentAdapter.getStewardship();
}
export {
  getCommunity as a,
  getStewardship as b,
  getChannel as g
};
