import { e as escape_html, c as attr, d as bind_props, s as store_get, u as unsubscribe_stores } from "../../../../chunks/renderer.js";
import { p as page } from "../../../../chunks/stores.js";
import { D as DiscussionPanel } from "../../../../chunks/DiscussionPanel.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/root.js";
import "../../../../chunks/state.svelte.js";
import { C as CountPill } from "../../../../chunks/CountPill.js";
import { R as ReportControl } from "../../../../chunks/ReportControl.js";
import { S as SubjectTablet } from "../../../../chunks/SubjectTablet.js";
import { T as TagList } from "../../../../chunks/TagList.js";
import { V as VoteStrip } from "../../../../chunks/VoteStrip.js";
import "../../../../chunks/data.js";
import { a as formatRelativeTime } from "../../../../chunks/time.js";
function ThreadOverviewPanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let combinedTags;
    let data = $$props["data"];
    combinedTags = [...data.channelTags, ...data.communityTags];
    $$renderer2.push(`<section class="overview-shell svelte-hs96yq"><div class="header-row svelte-hs96yq"><div class="chips svelte-hs96yq">`);
    SubjectTablet($$renderer2, { kind: "thread" });
    $$renderer2.push(`<!----></div> <div class="header-actions svelte-hs96yq">`);
    TagList($$renderer2, { tags: combinedTags });
    $$renderer2.push(`<!----> `);
    ReportControl($$renderer2, {
      itemLabel: "thread",
      report: data.report,
      ownerUsername: data.authorUsername,
      subjectId: data.id,
      targetId: data.id
    });
    $$renderer2.push(`<!----></div></div> <h1 class="svelte-hs96yq">${escape_html(data.title)}</h1> <p class="overview-copy svelte-hs96yq">${escape_html(data.body)}</p> <div class="overview-footer-row svelte-hs96yq">`);
    VoteStrip($$renderer2, { activeVote: data.activeVote, count: data.voteCount });
    $$renderer2.push(`<!----> `);
    CountPill($$renderer2, { label: `${data.commentCount} comments` });
    $$renderer2.push(`<!----> <span class="footer-author-row svelte-hs96yq"><a class="inline-link svelte-hs96yq"${attr("href", `/profile/${data.authorUsername}`)}>${escape_html(data.authorUsername)}</a> · ${escape_html(formatRelativeTime(data.lastActivityAt))}</span></div></section>`);
    bind_props($$props, { data });
  });
}
function ThreadDetailPage($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let data = $$props["data"];
    let highlightedCommentId = null;
    function readCommentTarget(url) {
      if (url.hash.startsWith("#comment-")) {
        return url.hash.slice("#comment-".length) || null;
      }
      return url.searchParams.get("comment");
    }
    highlightedCommentId = readCommentTarget(store_get($$store_subs ??= {}, "$page", page).url);
    $$renderer2.push(`<section class="page svelte-10csimf"><section class="hero-card svelte-10csimf"><section class="section-card svelte-10csimf">`);
    ThreadOverviewPanel($$renderer2, { data });
    $$renderer2.push(`<!----></section> <section class="section-card svelte-10csimf">`);
    DiscussionPanel($$renderer2, { data, highlightedCommentId });
    $$renderer2.push(`<!----></section></section></section>`);
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
