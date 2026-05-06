import { g as store_get, b as attr, e as escape_html, d as ensure_array_like, u as unsubscribe_stores, f as bind_props } from "../../../../chunks/renderer.js";
import { p as page } from "../../../../chunks/stores.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/root.js";
import "../../../../chunks/state.svelte.js";
import { T as ThreadedComment } from "../../../../chunks/ThreadedComment.js";
import { A as AvatarBadge } from "../../../../chunks/AvatarBadge.js";
import { C as CountPill } from "../../../../chunks/CountPill.js";
import { V as VoteStrip } from "../../../../chunks/VoteStrip.js";
import "../../../../chunks/data.js";
import { a as formatRelativeTime } from "../../../../chunks/time.js";
function PostDetailPage($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let highlightedCommentId;
    let data = $$props["data"];
    let draftComment = "";
    function readCommentTarget(url) {
      if (url.hash.startsWith("#comment-")) {
        return url.hash.slice("#comment-".length) || null;
      }
      return url.searchParams.get("comment");
    }
    highlightedCommentId = readCommentTarget(store_get($$store_subs ??= {}, "$page", page).url);
    $$renderer2.push(`<section class="page svelte-115v2zb"><section class="hero-card svelte-115v2zb"><div class="identity-row svelte-115v2zb">`);
    AvatarBadge($$renderer2, { size: "md", username: data.authorUsername });
    $$renderer2.push(`<!----> <div class="identity-copy svelte-115v2zb"><div class="name-line"><a class="inline-link svelte-115v2zb"${attr("href", `/profile/${data.authorUsername}`)}>${escape_html(data.authorUsername)}</a></div> <div class="chip-row svelte-115v2zb"><span class="chip post svelte-115v2zb">Post</span> <span class="chip audience svelte-115v2zb">${escape_html(data.audience === "followers" ? "Followers only" : "Public")}</span></div></div></div> <p class="body svelte-115v2zb">${escape_html(data.body)}</p> <div class="engagement-row svelte-115v2zb">`);
    VoteStrip($$renderer2, { activeVote: data.activeVote, count: data.voteCount });
    $$renderer2.push(`<!----> `);
    CountPill($$renderer2, { label: `${data.commentCount} comments` });
    $$renderer2.push(`<!----> <span class="svelte-115v2zb">${escape_html(formatRelativeTime(data.createdAt))}</span></div></section> <section class="panel svelte-115v2zb"><h2 class="svelte-115v2zb">Discussion</h2> <p class="svelte-115v2zb">${escape_html(data.discussionNote)}</p> <div class="composer-card svelte-115v2zb"><textarea rows="4" placeholder="Write a comment..." class="svelte-115v2zb">`);
    const $$body = escape_html(draftComment);
    if ($$body) {
      $$renderer2.push(`${$$body}`);
    }
    $$renderer2.push(`</textarea> <div class="composer-actions svelte-115v2zb"><button class="primary-button svelte-115v2zb" type="button">Add comment</button></div></div> <div class="stack svelte-115v2zb">`);
    if (data.discussion.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="comment-row svelte-115v2zb"><p class="svelte-115v2zb">No comments yet.</p></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<!--[-->`);
      const each_array = ensure_array_like(data.discussion);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let comment = each_array[$$index];
        ThreadedComment($$renderer2, { comment, subjectId: data.id, highlightedCommentId });
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></section></section>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
    bind_props($$props, { data });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    PostDetailPage($$renderer2, { data: data.post });
    bind_props($$props, { data });
  });
}
export {
  _page as default
};
