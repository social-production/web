import { c as currentAdapter } from "./index2.js";
function getOnboarding() {
  return currentAdapter.getOnboarding();
}
function getSettings() {
  return currentAdapter.getSettings();
}
function getProfile(username) {
  return currentAdapter.getProfile(username);
}
export {
  getOnboarding as a,
  getProfile as b,
  getSettings as g
};
