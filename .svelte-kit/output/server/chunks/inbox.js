import { c as currentAdapter } from "./index2.js";
function getNotifications() {
  return currentAdapter.getNotifications();
}
function getMessages() {
  return currentAdapter.getMessages();
}
function sendMessage(threadId, body) {
  return currentAdapter.sendMessage(threadId, body);
}
export {
  getNotifications as a,
  getMessages as g,
  sendMessage as s
};
