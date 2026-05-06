import { c as currentAdapter } from "./index2.js";
function getProject(slug) {
  return currentAdapter.getProject(slug);
}
function getThread(slug) {
  return currentAdapter.getThread(slug);
}
function getPost(id) {
  return currentAdapter.getPost(id);
}
function getEvent(slug) {
  return currentAdapter.getEvent(slug);
}
export {
  getPost as a,
  getProject as b,
  getThread as c,
  getEvent as g
};
