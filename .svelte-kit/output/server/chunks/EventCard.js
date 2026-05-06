import { f as bind_props, b as attr, e as escape_html } from "./renderer.js";
import "@sveltejs/kit/internal";
import "./exports.js";
import "./utils.js";
import "@sveltejs/kit/internal/server";
import "./root.js";
import "./state.svelte.js";
import { C as CountPill } from "./CountPill.js";
import { F as FeedSurface } from "./FeedSurface.js";
import { S as SubjectTablet, T as Tablet } from "./SubjectTablet.js";
import { T as TagList } from "./TagList.js";
import { V as VoteStrip } from "./VoteStrip.js";
import "./data.js";
import { d as describeActivityTime } from "./time.js";
function EventCard($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let orderedTags;
    let item = $$props["item"];
    orderedTags = [...item.channelTags, ...item.communityTags];
    FeedSurface($$renderer2, {
      href: item.href,
      tone: "public",
      children: ($$renderer3) => {
        $$renderer3.push(`<div class="header-row svelte-622zm9"><div class="chips svelte-622zm9">`);
        SubjectTablet($$renderer3, { kind: "event" });
        $$renderer3.push(`<!----> `);
        Tablet($$renderer3, {
          label: item.isPrivate ? "Private" : "Public",
          variant: "visibility"
        });
        $$renderer3.push(`<!----></div> <div class="tag-stack svelte-622zm9">`);
        TagList($$renderer3, { columns: 4, tags: orderedTags });
        $$renderer3.push(`<!----></div></div> <a class="title svelte-622zm9"${attr("href", item.href)}>${escape_html(item.title)}</a> <p class="body svelte-622zm9">${escape_html(item.description)}</p> <p class="location svelte-622zm9">${escape_html(item.timeLabel)} · ${escape_html(item.locationLabel)}</p> <div class="footer svelte-622zm9"><div class="engagement-row svelte-622zm9">`);
        VoteStrip($$renderer3, { activeVote: item.activeVote, count: item.voteCount });
        $$renderer3.push(`<!----> `);
        CountPill($$renderer3, { label: `${item.commentCount} comments` });
        $$renderer3.push(`<!----></div> <div class="footer-meta svelte-622zm9"><span><a class="inline-link svelte-622zm9"${attr("href", `/profile/${item.createdByUsername}`)}>${escape_html(item.createdByUsername)}</a> · ${escape_html(item.goingCount)} going · <span class="activity-stamp">${escape_html(describeActivityTime(item.createdAt, item.lastActivityAt))}</span></span></div></div>`);
      },
      $$slots: { default: true }
    });
    bind_props($$props, { item });
  });
}
export {
  EventCard as E
};
