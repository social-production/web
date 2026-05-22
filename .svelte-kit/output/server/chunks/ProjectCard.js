import { d as bind_props, c as attr, e as escape_html, g as attr_style } from "./renderer.js";
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
import { i as isPersonalServiceProject } from "./data.js";
import { d as describeActivityTime } from "./time.js";
/* empty css                                          */
function ProjectCard($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let orderedTags, participantLabel;
    let item = $$props["item"];
    orderedTags = [...item.channelTags, ...item.communityTags];
    participantLabel = isPersonalServiceProject(item.projectMode) ? item.memberCount === 1 ? "follower" : "followers" : item.memberCount === 1 ? "member" : "members";
    FeedSurface($$renderer2, {
      href: item.href,
      tone: "public",
      children: ($$renderer3) => {
        $$renderer3.push(`<div class="header-row svelte-wojjl0"><div class="chips svelte-wojjl0">`);
        SubjectTablet($$renderer3, { kind: "project", projectMode: item.projectMode });
        $$renderer3.push(`<!----> `);
        Tablet($$renderer3, { label: item.stage, variant: "stage" });
        $$renderer3.push(`<!----></div> <div class="tag-stack svelte-wojjl0">`);
        TagList($$renderer3, { columns: 4, tags: orderedTags });
        $$renderer3.push(`<!----></div></div> <a class="title svelte-wojjl0"${attr("href", item.href)}>${escape_html(item.title)}</a> <p class="summary svelte-wojjl0">${escape_html(item.summary)}</p> `);
        if (item.latestDescription) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<p class="latest-summary svelte-wojjl0">Latest: ${escape_html(item.latestDescription)}</p>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (item.fundProgress) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="fund-progress-card svelte-wojjl0"><div class="fund-progress-copy svelte-wojjl0"><strong>${escape_html(item.fundProgress.title)}</strong> <span>${escape_html(item.fundProgress.raisedLabel)} raised · target ${escape_html(item.fundProgress.targetLabel)}</span> <strong>${escape_html(item.fundProgress.progressPercent)}%</strong></div> <div class="progress-rail svelte-wojjl0"><div class="progress-fill svelte-wojjl0"${attr_style(`width: ${item.fundProgress.progressPercent}%`)}></div></div></div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> <div class="footer svelte-wojjl0"><div class="engagement-row svelte-wojjl0">`);
        VoteStrip($$renderer3, { activeVote: item.activeVote, count: item.voteCount });
        $$renderer3.push(`<!----> <a class="comment-link svelte-wojjl0"${attr("href", `${item.href}?tab=chat`)}>`);
        CountPill($$renderer3, { label: `${item.commentCount} comments` });
        $$renderer3.push(`<!----></a></div> <div class="footer-meta svelte-wojjl0"><span><a class="inline-link svelte-wojjl0"${attr("href", `/profile/${item.authorUsername}`)}>${escape_html(item.authorUsername)}</a> · ${escape_html(item.memberCount)} ${escape_html(participantLabel)} · <span class="activity-stamp">${escape_html(describeActivityTime(item.createdAt, item.lastActivityAt))}</span></span></div></div>`);
      },
      $$slots: { default: true }
    });
    bind_props($$props, { item });
  });
}
export {
  ProjectCard as P
};
