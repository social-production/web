import { k as fallback, b as attr, c as attr_class, e as escape_html, d as ensure_array_like, f as bind_props } from "./renderer.js";
import "@sveltejs/kit/internal";
import "./exports.js";
import "./utils.js";
import "@sveltejs/kit/internal/server";
import "./root.js";
import "./state.svelte.js";
import { V as VoteStrip } from "./VoteStrip.js";
import "./data.js";
import { a as formatRelativeTime } from "./time.js";
function ThreadedComment($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let isHighlighted;
    let comment = $$props["comment"];
    let subjectId = $$props["subjectId"];
    let highlightedCommentId = fallback($$props["highlightedCommentId"], null);
    isHighlighted = highlightedCommentId === comment.id;
    $$renderer2.push(`<article${attr("id", `comment-${comment.id}`)}${attr_class("comment-card svelte-wqbny1", void 0, { "highlighted": isHighlighted })}><div class="topline svelte-wqbny1"><a class="author-link svelte-wqbny1"${attr("href", `/profile/${comment.authorUsername}`)}>${escape_html(comment.authorUsername)}</a> <span class="svelte-wqbny1">${escape_html(formatRelativeTime(comment.createdAt))}</span></div> <p class="body svelte-wqbny1">${escape_html(comment.body)}</p> <div class="actions-row svelte-wqbny1">`);
    VoteStrip($$renderer2, { activeVote: comment.activeVote, count: comment.voteCount });
    $$renderer2.push(`<!----> <button class="reply-button svelte-wqbny1" type="button">${escape_html("Reply")}</button></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (comment.replies.length > 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="reply-stack svelte-wqbny1"><!--[-->`);
      const each_array = ensure_array_like(comment.replies);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let reply = each_array[$$index];
        ThreadedComment($$renderer2, { comment: reply, subjectId, highlightedCommentId });
        $$renderer2.push(`<!---->`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></article>`);
    bind_props($$props, { comment, subjectId, highlightedCommentId });
  });
}
export {
  ThreadedComment as T
};
