import { e as escape_html, d as ensure_array_like, c as attr_class, b as attr, f as bind_props } from "../../../chunks/renderer.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/root.js";
import "../../../chunks/state.svelte.js";
import { A as AvatarBadge } from "../../../chunks/AvatarBadge.js";
import { a as formatRelativeTime } from "../../../chunks/time.js";
import "../../../chunks/data.js";
function MessagesPage($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let activeThread;
    let data = $$props["data"];
    let activeThreadId = data.activeThreadId ?? null;
    let draftMessage = "";
    activeThread = data.threads.find((thread) => thread.id === activeThreadId) ?? null;
    $$renderer2.push(`<section class="page svelte-1vfruch"><section class="messages-shell svelte-1vfruch"><section class="messages-swipe-row svelte-1vfruch"><aside class="left-rail svelte-1vfruch"><h2 class="svelte-1vfruch">Direct</h2> <button class="rail-button active svelte-1vfruch" type="button">Inbox</button> <button class="rail-button svelte-1vfruch" type="button">Requests</button> <button class="rail-button svelte-1vfruch" type="button">Archive</button></aside> <section class="center-panel svelte-1vfruch">`);
    if (activeThread) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<header class="chat-header svelte-1vfruch"><button class="secondary-button svelte-1vfruch" type="button">All chats</button> <div class="chat-identity svelte-1vfruch">`);
      AvatarBadge($$renderer2, { size: "md", username: activeThread.participant.username });
      $$renderer2.push(`<!----> <div><h1 class="svelte-1vfruch">${escape_html(activeThread.participant.username)}</h1> <p class="svelte-1vfruch">Direct messages</p></div></div> `);
      if (activeThread.unreadCount > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<button class="secondary-button svelte-1vfruch" type="button">Mark read</button>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></header> <div class="conversation-stack svelte-1vfruch"><!--[-->`);
      const each_array = ensure_array_like(activeThread.messages);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let message = each_array[$$index];
        $$renderer2.push(`<article${attr_class("message-row svelte-1vfruch", void 0, { "own": message.isOwn })}>`);
        AvatarBadge($$renderer2, { size: "sm", username: message.sender.username });
        $$renderer2.push(`<!----> <div class="message-copy"><div class="meta-row svelte-1vfruch"><a${attr("href", `/profile/${message.sender.username}`)} class="svelte-1vfruch">${escape_html(message.sender.username)}</a> <span class="svelte-1vfruch">${escape_html(formatRelativeTime(message.createdAt))}</span></div> <p class="svelte-1vfruch">${escape_html(message.body)}</p></div></article>`);
      }
      $$renderer2.push(`<!--]--></div> <footer class="composer-shell svelte-1vfruch"><textarea id="message-body" placeholder="Write a message..." rows="3" class="svelte-1vfruch">`);
      const $$body = escape_html(draftMessage);
      if ($$body) {
        $$renderer2.push(`${$$body}`);
      }
      $$renderer2.push(`</textarea> <button class="primary-button svelte-1vfruch" type="button">Send</button></footer>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<header class="list-header svelte-1vfruch"><h1 class="svelte-1vfruch">Messages</h1> <p class="svelte-1vfruch">List-first inbox. Open a row to enter chat.</p></header> <div class="thread-list svelte-1vfruch"><!--[-->`);
      const each_array_1 = ensure_array_like(data.threads);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let thread = each_array_1[$$index_1];
        $$renderer2.push(`<button class="thread-row svelte-1vfruch" type="button">`);
        AvatarBadge($$renderer2, { size: "md", username: thread.participant.username });
        $$renderer2.push(`<!----> <div class="thread-copy svelte-1vfruch"><div class="thread-meta svelte-1vfruch"><h3 class="svelte-1vfruch">${escape_html(thread.participant.username)}</h3> <span class="svelte-1vfruch">${escape_html(formatRelativeTime(thread.lastMessageAt))}</span></div> <p class="svelte-1vfruch">${escape_html(thread.preview)}</p></div> `);
        if (thread.unreadCount > 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<span class="unread-pill svelte-1vfruch">${escape_html(thread.unreadCount)}</span>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></button>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></section> <aside class="right-rail svelte-1vfruch"><h2 class="svelte-1vfruch">Context</h2> `);
    if (activeThread) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="context-stack svelte-1vfruch">`);
      AvatarBadge($$renderer2, { size: "md", username: activeThread.participant.username });
      $$renderer2.push(`<!----> <p class="svelte-1vfruch">${escape_html(activeThread.participant.username)}</p> <p class="svelte-1vfruch">${escape_html(activeThread.messages.length)} total messages in this thread.</p></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<p class="svelte-1vfruch">Select a conversation to open the chat box.</p>`);
    }
    $$renderer2.push(`<!--]--></aside></section></section></section>`);
    bind_props($$props, { data });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    MessagesPage($$renderer2, { data: data.messages });
    bind_props($$props, { data });
  });
}
export {
  _page as default
};
