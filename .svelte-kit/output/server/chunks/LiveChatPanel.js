import { f as fallback, s as store_get, u as unsubscribe_stores, d as bind_props, b as attr_class, e as escape_html, a as ensure_array_like, c as attr } from "./renderer.js";
import "@sveltejs/kit/internal";
import "./exports.js";
import "./utils.js";
import "@sveltejs/kit/internal/server";
import "./root.js";
import "./state.svelte.js";
import { p as page } from "./stores.js";
import { a as ReportMenu, b as ReportComposerModal } from "./RoundPlusButton.js";
import "./data.js";
function LiveChatPanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let flattenedComments, visibleMessages, viewerUsername;
    let comments = fallback($$props["comments"], () => [], true);
    let messages = fallback($$props["messages"], () => [], true);
    let subjectId = fallback($$props["subjectId"], "");
    let highlightedCommentId = fallback($$props["highlightedCommentId"], null);
    let title = fallback($$props["title"], "Discussion");
    let description = fallback($$props["description"], "");
    let placeholder = fallback($$props["placeholder"], "Write a message...");
    let submitLabel = fallback($$props["submitLabel"], "Send message");
    let emptyCopy = fallback($$props["emptyCopy"], "No chat messages yet.");
    let showHeader = fallback($$props["showHeader"], true);
    let embedded = fallback($$props["embedded"], false);
    let fitViewport = fallback($$props["fitViewport"], false);
    let variant = fallback($$props["variant"], "chat");
    let onSubmitMessage = fallback($$props["onSubmitMessage"], null);
    let draftMessage = "";
    let reportReason = "spam";
    let reportDetails = "";
    let reportPending = false;
    let revealedMessageIds = /* @__PURE__ */ new Set();
    function formatMessageTime(value) {
      const date = new Date(value);
      const deltaMs = Date.now() - date.getTime();
      if (Number.isNaN(date.getTime())) {
        return value;
      }
      const minutes = Math.max(Math.round(deltaMs / 6e4), 1);
      if (minutes < 60) {
        return `${minutes}m`;
      }
      const hours = Math.round(minutes / 60);
      if (hours < 24) {
        return `${hours}h`;
      }
      const days = Math.round(hours / 24);
      if (days < 7) {
        return `${days}d`;
      }
      const month = `${date.getMonth() + 1}`.padStart(2, "0");
      const day = `${date.getDate()}`.padStart(2, "0");
      const year = `${date.getFullYear()}`;
      return `${month}/${day}/${year}`;
    }
    function supportsHiddenToggle(message) {
      return message.report?.reason === "serious-harm" || message.report?.resolution === "hidden";
    }
    function messageBodyIsHidden(message) {
      return supportsHiddenToggle(message) && !revealedMessageIds.has(message.id);
    }
    function flattenComments(items) {
      const flattened = [];
      for (const item of items) {
        flattened.push({
          id: item.id,
          authorUsername: item.authorUsername,
          body: item.body,
          createdAt: item.createdAt,
          report: item.report ?? null
        });
        flattened.push(...flattenComments(item.replies));
      }
      return flattened;
    }
    flattenedComments = flattenComments(comments).sort((left, right) => +new Date(left.createdAt) - +new Date(right.createdAt));
    visibleMessages = messages.length > 0 ? messages.slice().sort((left, right) => +new Date(left.createdAt) - +new Date(right.createdAt)) : flattenedComments;
    viewerUsername = store_get($$store_subs ??= {}, "$page", page).data.bootstrap?.viewer?.username ?? null;
    `${subjectId || title}:${visibleMessages.length}`;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<section${attr_class("chat-panel svelte-6ibvcd", void 0, {
        "embedded": embedded,
        "fit-viewport": fitViewport && !embedded,
        "headerless": !showHeader,
        "message-variant": variant === "message"
      })}>`);
      if (showHeader) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<div class="chat-header svelte-6ibvcd"><div><h2 class="svelte-6ibvcd">${escape_html(title)}</h2> `);
        if (description) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<p class="svelte-6ibvcd">${escape_html(description)}</p>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--></div></div>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> <div class="chat-log svelte-6ibvcd"><div class="chat-log-stack svelte-6ibvcd">`);
      if (visibleMessages.length === 0) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<div class="empty-state svelte-6ibvcd">${escape_html(emptyCopy)}</div>`);
      } else {
        $$renderer3.push("<!--[-1-->");
        $$renderer3.push(`<!--[-->`);
        const each_array = ensure_array_like(visibleMessages);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let message = each_array[$$index];
          $$renderer3.push(`<article${attr("id", `comment-${message.id}`)}${attr_class("chat-message svelte-6ibvcd", void 0, {
            "highlighted": highlightedCommentId === message.id,
            "own": message.isOwn ?? viewerUsername === message.authorUsername
          })}><div class="message-copy svelte-6ibvcd"><div class="message-top-row svelte-6ibvcd">`);
          if (message.showAuthor ?? true) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<a class="author-link svelte-6ibvcd"${attr("href", `/profile/${message.authorUsername}`)}>${escape_html(message.authorUsername)}</a>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--> `);
          if (subjectId) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<div class="message-actions svelte-6ibvcd" aria-label="Message actions">`);
            ReportMenu($$renderer3, {
              blockedMessage: viewerUsername === message.authorUsername ? "You can't report yourself" : "",
              itemLabel: variant === "message" ? "message" : "comment",
              pending: reportPending,
              report: message.report ?? null
            });
            $$renderer3.push(`<!----></div>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--></div> `);
          if (supportsHiddenToggle(message)) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<button${attr("aria-expanded", revealedMessageIds.has(message.id))} class="hidden-toggle svelte-6ibvcd" type="button"><span class="hidden-plus svelte-6ibvcd">${escape_html(revealedMessageIds.has(message.id) ? "−" : "+")}</span> <span class="svelte-6ibvcd">${escape_html(revealedMessageIds.has(message.id) ? "Hide" : "Hidden")}</span></button>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--> <p${attr_class("svelte-6ibvcd", void 0, {
            "hidden-message-body": supportsHiddenToggle(message) && messageBodyIsHidden(message)
          })}>${escape_html(message.body)}</p></div> <span class="message-time svelte-6ibvcd">${escape_html(formatMessageTime(message.createdAt))}</span></article>`);
        }
        $$renderer3.push(`<!--]-->`);
      }
      $$renderer3.push(`<!--]--></div></div> `);
      ReportComposerModal($$renderer3, {
        itemLabel: variant === "message" ? "message" : "comment",
        open: false,
        pending: reportPending,
        get description() {
          return reportDetails;
        },
        set description($$value) {
          reportDetails = $$value;
          $$settled = false;
        },
        get reason() {
          return reportReason;
        },
        set reason($$value) {
          reportReason = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> <div class="composer-card svelte-6ibvcd"><div class="composer-input-shell svelte-6ibvcd"><textarea${attr("placeholder", placeholder)} rows="3" class="svelte-6ibvcd">`);
      const $$body = escape_html(draftMessage);
      if ($$body) {
        $$renderer3.push(`${$$body}`);
      }
      $$renderer3.push(`</textarea> <button class="primary-button svelte-6ibvcd" type="button">${escape_html(submitLabel)}</button></div></div></section>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    if ($$store_subs) unsubscribe_stores($$store_subs);
    bind_props($$props, {
      comments,
      messages,
      subjectId,
      highlightedCommentId,
      title,
      description,
      placeholder,
      submitLabel,
      emptyCopy,
      showHeader,
      embedded,
      fitViewport,
      variant,
      onSubmitMessage
    });
  });
}
export {
  LiveChatPanel as L
};
