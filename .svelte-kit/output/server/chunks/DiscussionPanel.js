import { f as fallback, s as store_get, u as unsubscribe_stores, d as bind_props, c as attr, b as attr_class, e as escape_html, a as ensure_array_like } from "./renderer.js";
import "@sveltejs/kit/internal";
import "./exports.js";
import "./utils.js";
import "@sveltejs/kit/internal/server";
import "./root.js";
import "./state.svelte.js";
import { p as page } from "./stores.js";
import { V as VoteStrip } from "./VoteStrip.js";
import { a as ReportMenu, b as ReportComposerModal, R as RoundPlusButton } from "./RoundPlusButton.js";
import "./data.js";
import { a as formatRelativeTime } from "./time.js";
function DiscussionComment($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let isHighlighted, viewerUsername, supportsHiddenToggle, bodyIsHidden;
    let comment = $$props["comment"];
    let subjectId = $$props["subjectId"];
    let highlightedCommentId = fallback($$props["highlightedCommentId"], null);
    let reportModalOpen = false;
    let reportPending = false;
    let reportReason = "spam";
    let reportDescription = "";
    let revealHiddenBody = false;
    isHighlighted = highlightedCommentId === comment.id;
    viewerUsername = store_get($$store_subs ??= {}, "$page", page).data.bootstrap?.viewer?.username ?? null;
    supportsHiddenToggle = comment.report?.reason === "serious-harm" || comment.report?.resolution === "hidden";
    bodyIsHidden = supportsHiddenToggle && !revealHiddenBody;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<article${attr("id", `comment-${comment.id}`)}${attr_class("comment-card svelte-y3m4jm", void 0, { "highlighted": isHighlighted })}><div class="topline svelte-y3m4jm"><a class="author-link svelte-y3m4jm"${attr("href", `/profile/${comment.authorUsername}`)}>${escape_html(comment.authorUsername)}</a> <span class="svelte-y3m4jm">${escape_html(formatRelativeTime(comment.createdAt))}</span></div> `);
      if (supportsHiddenToggle) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<button${attr("aria-expanded", revealHiddenBody)} class="hidden-toggle svelte-y3m4jm" type="button"><span class="hidden-plus svelte-y3m4jm">${escape_html("+")}</span> <span>${escape_html("Hidden")}</span></button>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> `);
      if (!bodyIsHidden) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<p class="body svelte-y3m4jm">${escape_html(comment.body)}</p>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> <div class="actions-row svelte-y3m4jm">`);
      VoteStrip($$renderer3, { activeVote: comment.activeVote, count: comment.voteCount });
      $$renderer3.push(`<!----> <button class="reply-button svelte-y3m4jm" type="button">${escape_html("Reply")}</button> `);
      ReportMenu($$renderer3, {
        blockedMessage: viewerUsername === comment.authorUsername ? "You can't report yourself" : "",
        itemLabel: "comment",
        report: comment.report ?? null,
        pending: reportPending
      });
      $$renderer3.push(`<!----></div> `);
      {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> `);
      ReportComposerModal($$renderer3, {
        itemLabel: "comment",
        pending: reportPending,
        get description() {
          return reportDescription;
        },
        set description($$value) {
          reportDescription = $$value;
          $$settled = false;
        },
        get open() {
          return reportModalOpen;
        },
        set open($$value) {
          reportModalOpen = $$value;
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
      $$renderer3.push(`<!----> `);
      if (comment.replies.length > 0) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<div class="reply-stack svelte-y3m4jm"><!--[-->`);
        const each_array = ensure_array_like(comment.replies);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let reply = each_array[$$index];
          DiscussionComment($$renderer3, { comment: reply, subjectId, highlightedCommentId });
          $$renderer3.push(`<!---->`);
        }
        $$renderer3.push(`<!--]--></div>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--></article>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    if ($$store_subs) unsubscribe_stores($$store_subs);
    bind_props($$props, { comment, subjectId, highlightedCommentId });
  });
}
function DiscussionPanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    let highlightedCommentId = fallback($$props["highlightedCommentId"], null);
    let draftComment = "";
    let showComposer = false;
    function toggleComposer() {
      showComposer = !showComposer;
    }
    $$renderer2.push(`<section class="discussion-shell svelte-niep67" id="comments"><div class="composer-toggle-anchor svelte-niep67">`);
    RoundPlusButton($$renderer2, {
      active: showComposer,
      ariaLabel: "Add comment",
      action: toggleComposer
    });
    $$renderer2.push(`<!----></div> `);
    if (showComposer) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="composer-card svelte-niep67"><textarea rows="4" placeholder="Write a comment..." class="svelte-niep67">`);
      const $$body = escape_html(draftComment);
      if ($$body) {
        $$renderer2.push(`${$$body}`);
      }
      $$renderer2.push(`</textarea> <div class="composer-actions svelte-niep67"><button class="secondary-button svelte-niep67" type="button">Cancel</button> <button class="primary-button svelte-niep67" type="button">Add comment</button></div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="stack svelte-niep67">`);
    if (data.discussion.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="empty-card svelte-niep67"><p class="svelte-niep67">No comments yet.</p></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<!--[-->`);
      const each_array = ensure_array_like(data.discussion);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let comment = each_array[$$index];
        DiscussionComment($$renderer2, { comment, subjectId: data.id, highlightedCommentId });
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></section>`);
    bind_props($$props, { data, highlightedCommentId });
  });
}
export {
  DiscussionPanel as D
};
