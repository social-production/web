import { d as bind_props, c as attr, e as escape_html } from "./renderer.js";
import "@sveltejs/kit/internal";
import "./exports.js";
import "./utils.js";
import "@sveltejs/kit/internal/server";
import "./root.js";
import "./state.svelte.js";
import { A as AvatarBadge } from "./AvatarBadge.js";
import { C as CountPill } from "./CountPill.js";
import { F as FeedSurface } from "./FeedSurface.js";
import { L as LinkedPostBody } from "./LinkedPostBody.js";
import { S as SubjectTablet } from "./SubjectTablet.js";
import { V as VoteStrip } from "./VoteStrip.js";
import "./data.js";
import { a as formatRelativeTime } from "./time.js";
function PersonalPostCard($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let commentHref;
    let item = $$props["item"];
    function buildCommentHref(href) {
      const url = new URL(href, "https://socialproduction.local");
      url.searchParams.delete("comment");
      url.hash = "comments";
      return `${url.pathname}${url.search}${url.hash}`;
    }
    commentHref = buildCommentHref(item.href);
    FeedSurface($$renderer2, {
      href: item.href,
      tone: "personal",
      children: ($$renderer3) => {
        $$renderer3.push(`<div class="header-row svelte-sao0nw"><div class="identity-row svelte-sao0nw">`);
        AvatarBadge($$renderer3, { size: "sm", username: item.author.username });
        $$renderer3.push(`<!----> <div class="identity-copy svelte-sao0nw"><div class="name-line svelte-sao0nw"><a class="name svelte-sao0nw"${attr("href", `/profile/${item.author.username}`)}>${escape_html(item.author.username)}</a> `);
        SubjectTablet($$renderer3, { kind: "post" });
        $$renderer3.push(`<!----></div></div></div></div> `);
        LinkedPostBody($$renderer3, {
          body: item.body,
          links: item.linkedSubjects ?? [],
          variant: "feed"
        });
        $$renderer3.push(`<!----> <div class="footer svelte-sao0nw"><div class="engagement-row svelte-sao0nw">`);
        VoteStrip($$renderer3, { activeVote: item.activeVote, count: item.voteCount });
        $$renderer3.push(`<!----> <a class="comment-link svelte-sao0nw"${attr("href", commentHref)}>`);
        CountPill($$renderer3, { label: `${item.commentCount} comments` });
        $$renderer3.push(`<!----></a></div> <span>${escape_html(formatRelativeTime(item.createdAt))}</span></div>`);
      },
      $$slots: { default: true }
    });
    bind_props($$props, { item });
  });
}
export {
  PersonalPostCard as P
};
