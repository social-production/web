import { d as bind_props, c as attr, e as escape_html, g as attr_style } from "./renderer.js";
import "@sveltejs/kit/internal";
import "./exports.js";
import "./utils.js";
import "@sveltejs/kit/internal/server";
import "./root.js";
import "./state.svelte.js";
import { A as AvatarBadge } from "./AvatarBadge.js";
import { C as CountPill } from "./CountPill.js";
import { F as FeedSurface } from "./FeedSurface.js";
import { S as SubjectTablet } from "./SubjectTablet.js";
import { T as TagList } from "./TagList.js";
import { V as VoteStrip } from "./VoteStrip.js";
import "./data.js";
import { a as formatRelativeTime } from "./time.js";
import { P as PersonalPostCard } from "./PersonalPostCard.js";
function PersonalActivityCard($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let orderedTags, commentHref, verbLabel;
    let item = $$props["item"];
    function buildCommentHref(href, subjectKind) {
      const url = new URL(href, "https://socialproduction.local");
      url.searchParams.delete("comment");
      url.searchParams.delete("update");
      url.hash = "";
      if (subjectKind === "project" || subjectKind === "event") {
        url.searchParams.set("tab", "chat");
        return `${url.pathname}${url.search}`;
      }
      url.hash = "comments";
      return `${url.pathname}${url.search}${url.hash}`;
    }
    orderedTags = [...item.channelTags, ...item.communityTags];
    commentHref = buildCommentHref(item.href, item.subjectKind);
    verbLabel = item.actionLabel || "Created";
    FeedSurface($$renderer2, {
      href: item.href,
      tone: "personal",
      children: ($$renderer3) => {
        $$renderer3.push(`<div class="header-row svelte-fedfq1"><div class="identity-row svelte-fedfq1">`);
        AvatarBadge($$renderer3, { size: "sm", username: item.author.username });
        $$renderer3.push(`<!----> <div class="identity-copy svelte-fedfq1"><div class="name-line svelte-fedfq1"><a class="name svelte-fedfq1"${attr("href", `/profile/${item.author.username}`)}>${escape_html(item.author.username)}</a> <span class="action svelte-fedfq1">- ${escape_html(verbLabel)}</span> `);
        SubjectTablet($$renderer3, {
          kind: item.subjectKind,
          projectMode: item.subjectProjectMode ?? "productive"
        });
        $$renderer3.push(`<!----></div></div></div> <div class="tag-stack svelte-fedfq1">`);
        TagList($$renderer3, { columns: 4, tags: orderedTags });
        $$renderer3.push(`<!----></div></div> <a class="title svelte-fedfq1"${attr("href", item.href)}>${escape_html(item.title)}</a> <p class="body svelte-fedfq1">${escape_html(item.body)}</p> `);
        if (item.subjectKind === "project" && item.subjectFundProgress) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="fund-progress-card svelte-fedfq1"><div class="fund-progress-copy svelte-fedfq1"><strong>${escape_html(item.subjectFundProgress.title)}</strong> <span>${escape_html(item.subjectFundProgress.raisedLabel)} raised · target ${escape_html(item.subjectFundProgress.targetLabel)}</span> <strong>${escape_html(item.subjectFundProgress.progressPercent)}%</strong></div> <div class="progress-rail svelte-fedfq1"><div class="progress-fill svelte-fedfq1"${attr_style(`width: ${item.subjectFundProgress.progressPercent}%`)}></div></div></div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> <div class="footer svelte-fedfq1"><div class="engagement-row svelte-fedfq1">`);
        VoteStrip($$renderer3, { activeVote: item.activeVote, count: item.voteCount });
        $$renderer3.push(`<!----> <a class="comment-link svelte-fedfq1"${attr("href", commentHref)}>`);
        CountPill($$renderer3, { label: `${item.commentCount} comments` });
        $$renderer3.push(`<!----></a></div> <span>${escape_html(formatRelativeTime(item.createdAt))}</span></div>`);
      },
      $$slots: { default: true }
    });
    bind_props($$props, { item });
  });
}
function PersonalFeedCard($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let item = $$props["item"];
    if (item.kind === "post") {
      $$renderer2.push("<!--[0-->");
      PersonalPostCard($$renderer2, { item });
    } else {
      $$renderer2.push("<!--[-1-->");
      PersonalActivityCard($$renderer2, { item });
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { item });
  });
}
export {
  PersonalFeedCard as P
};
