import { c as currentAdapter } from "./index2.js";
function getChannel(slug) {
  return currentAdapter.getChannel(slug);
}
function getCommunity(slug) {
  return currentAdapter.getCommunity(slug);
}
function getPlatform() {
  return currentAdapter.getPlatform();
}
export {
  getCommunity as a,
  getPlatform as b,
  getChannel as g
};
