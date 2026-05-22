import { s as store_get, c as attr, e as escape_html, u as unsubscribe_stores, d as bind_props } from "../../../../chunks/renderer.js";
import { p as page } from "../../../../chunks/stores.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/root.js";
import "../../../../chunks/state.svelte.js";
import { D as DiscussionPanel } from "../../../../chunks/DiscussionPanel.js";
import { A as AvatarBadge } from "../../../../chunks/AvatarBadge.js";
import { L as LinkedPostBody } from "../../../../chunks/LinkedPostBody.js";
import { C as CountPill } from "../../../../chunks/CountPill.js";
import { R as ReportControl } from "../../../../chunks/ReportControl.js";
import { V as VoteStrip } from "../../../../chunks/VoteStrip.js";
import "../../../../chunks/data.js";
import { a as formatRelativeTime } from "../../../../chunks/time.js";
function PostDetailPage($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let highlightedCommentId;
    let data = $$props["data"];
    function readCommentTarget(url) {
      if (url.hash.startsWith("#comment-")) {
        return url.hash.slice("#comment-".length) || null;
      }
      return url.searchParams.get("comment");
    }
    highlightedCommentId = readCommentTarget(store_get($$store_subs ??= {}, "$page", page).url);
    $$renderer2.push(`<section class="page svelte-115v2zb"><section class="hero-card svelte-115v2zb"><div class="identity-row svelte-115v2zb"><div class="identity-main svelte-115v2zb">`);
    AvatarBadge($$renderer2, { size: "md", username: data.authorUsername });
    $$renderer2.push(`<!----> <div class="identity-copy svelte-115v2zb"><div class="name-line"><a class="inline-link svelte-115v2zb"${attr("href", `/profile/${data.authorUsername}`)}>${escape_html(data.authorUsername)}</a> <span class="chip post svelte-115v2zb">Post</span></div></div></div> `);
    ReportControl($$renderer2, {
      itemLabel: "post",
      report: data.report,
      ownerUsername: data.authorUsername,
      subjectId: data.id,
      targetId: data.id
    });
    $$renderer2.push(`<!----></div> `);
    LinkedPostBody($$renderer2, {
      body: data.body,
      links: data.linkedSubjects ?? [],
      variant: "detail"
    });
    $$renderer2.push(`<!----> <div class="engagement-row svelte-115v2zb"><div class="engagement-actions svelte-115v2zb">`);
    VoteStrip($$renderer2, { activeVote: data.activeVote, count: data.voteCount });
    $$renderer2.push(`<!----> `);
    CountPill($$renderer2, { label: `${data.commentCount} comments` });
    $$renderer2.push(`<!----></div> <span class="svelte-115v2zb">${escape_html(formatRelativeTime(data.createdAt))}</span></div></section> <section class="panel svelte-115v2zb">`);
    DiscussionPanel($$renderer2, { data, highlightedCommentId });
    $$renderer2.push(`<!----></section></section>`);
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
