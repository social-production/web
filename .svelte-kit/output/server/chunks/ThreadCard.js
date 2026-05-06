import { f as bind_props, b as attr, e as escape_html } from "./renderer.js";
import "@sveltejs/kit/internal";
import "./exports.js";
import "./utils.js";
import "@sveltejs/kit/internal/server";
import "./root.js";
import "./state.svelte.js";
import { C as CountPill } from "./CountPill.js";
import { F as FeedSurface } from "./FeedSurface.js";
import { S as SubjectTablet } from "./SubjectTablet.js";
import { T as TagList } from "./TagList.js";
import { V as VoteStrip } from "./VoteStrip.js";
import "./data.js";
import { d as describeActivityTime } from "./time.js";
function ThreadCard($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let orderedTags;
    let item = $$props["item"];
    orderedTags = [...item.channelTags, ...item.communityTags];
    FeedSurface($$renderer2, {
      href: item.href,
      tone: "public",
      children: ($$renderer3) => {
        $$renderer3.push(`<div class="header-row svelte-1cv8a2t">`);
        SubjectTablet($$renderer3, { kind: "thread" });
        $$renderer3.push(`<!----> <div class="tag-stack svelte-1cv8a2t">`);
        TagList($$renderer3, { columns: 4, tags: orderedTags });
        $$renderer3.push(`<!----></div></div> <a class="title svelte-1cv8a2t"${attr("href", item.href)}>${escape_html(item.title)}</a> <p class="body svelte-1cv8a2t">${escape_html(item.body)}</p> <div class="footer svelte-1cv8a2t"><div class="engagement-row svelte-1cv8a2t">`);
        VoteStrip($$renderer3, { activeVote: item.activeVote, count: item.voteCount });
        $$renderer3.push(`<!----> `);
        CountPill($$renderer3, { label: `${item.commentCount} replies` });
        $$renderer3.push(`<!----></div> <div class="footer-meta svelte-1cv8a2t"><span><a class="inline-link svelte-1cv8a2t"${attr("href", `/profile/${item.authorUsername}`)}>${escape_html(item.authorUsername)}</a> · <span class="activity-stamp">${escape_html(describeActivityTime(item.createdAt, item.createdAt))}</span></span></div></div>`);
      },
      $$slots: { default: true }
    });
    bind_props($$props, { item });
  });
}
export {
  ThreadCard as T
};
