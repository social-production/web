import { c as currentAdapter } from "./index2.js";
function getNotifications() {
  return currentAdapter.getNotifications();
}
function getMessages() {
  return currentAdapter.getMessages();
}
export {
  getNotifications as a,
  getMessages as g
};
