import { g as store_get, e as escape_html, b as attr, d as ensure_array_like, u as unsubscribe_stores, f as bind_props } from "../../../../chunks/renderer.js";
import { p as page } from "../../../../chunks/stores.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/root.js";
import "../../../../chunks/state.svelte.js";
import { T as ThreadedComment } from "../../../../chunks/ThreadedComment.js";
import { C as CountPill } from "../../../../chunks/CountPill.js";
import { S as SubjectTablet } from "../../../../chunks/SubjectTablet.js";
import { T as TagList } from "../../../../chunks/TagList.js";
import { V as VoteStrip } from "../../../../chunks/VoteStrip.js";
import "../../../../chunks/data.js";
import { a as formatRelativeTime } from "../../../../chunks/time.js";
function ThreadDetailPage($$renderer, $$props) {
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
    $$renderer2.push(`<section class="page svelte-10csimf"><section class="hero-card svelte-10csimf"><div class="header-row svelte-10csimf">`);
    SubjectTablet($$renderer2, { kind: "thread" });
    $$renderer2.push(`<!----> <div class="tag-stack svelte-10csimf">`);
    TagList($$renderer2, { tags: data.channelTags });
    $$renderer2.push(`<!----> `);
    TagList($$renderer2, { tags: data.communityTags });
    $$renderer2.push(`<!----></div></div> <h1 class="svelte-10csimf">${escape_html(data.title)}</h1> <p class="svelte-10csimf">${escape_html(data.body)}</p> <div class="engagement-row svelte-10csimf">`);
    VoteStrip($$renderer2, { activeVote: data.activeVote, count: data.voteCount });
    $$renderer2.push(`<!----> `);
    CountPill($$renderer2, { label: `${data.commentCount} replies` });
    $$renderer2.push(`<!----> <span class="svelte-10csimf"><a class="inline-link svelte-10csimf"${attr("href", `/profile/${data.authorUsername}`)}>${escape_html(data.authorUsername)}</a> · ${escape_html(formatRelativeTime(data.lastActivityAt))}</span></div></section> <section class="panel svelte-10csimf"><h2 class="svelte-10csimf">Discussion</h2> <p class="svelte-10csimf">${escape_html(data.discussionNote)}</p> <div class="composer-card svelte-10csimf"><textarea rows="4" placeholder="Write a comment..." class="svelte-10csimf">`);
    const $$body = escape_html(draftComment);
    if ($$body) {
      $$renderer2.push(`${$$body}`);
    }
    $$renderer2.push(`</textarea> <div class="composer-actions svelte-10csimf"><button class="primary-button svelte-10csimf" type="button">Add comment</button></div></div> <div class="stack svelte-10csimf">`);
    if (data.discussion.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="reply-row svelte-10csimf"><p class="svelte-10csimf">No comments yet.</p></div>`);
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
    ThreadDetailPage($$renderer2, { data: data.thread });
    bind_props($$props, { data });
  });
}
export {
  _page as default
};
