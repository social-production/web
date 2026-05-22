import { s as store_get, a as ensure_array_like, e as escape_html, c as attr, b as attr_class, u as unsubscribe_stores, d as bind_props } from "./renderer.js";
import { b as browser } from "./render-context.js";
import "@sveltejs/kit/internal";
import "./exports.js";
import "./utils.js";
import "@sveltejs/kit/internal/server";
import "./root.js";
import "./state.svelte.js";
import { p as page } from "./stores.js";
import { P as PublicFeedCard } from "./PublicFeedCard.js";
import "./data.js";
function DirectoryFeedLayout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let showRolePanel, filteredFeed, shareInviteLink, inviteButtonActive;
    let pageData = $$props["pageData"];
    let activeFilter = "all";
    let activeSort = "popular";
    let activeWindow = "all";
    let showBoardPanel = false;
    let showInvitePanel = false;
    let membershipPending = false;
    let inviteDraft = "";
    let invitePending = false;
    let inviteFeedback = "";
    let inviteFeedbackTone = "soft";
    let lastInviteParam = "";
    function matchesFilter(item, filter) {
      {
        return true;
      }
    }
    function itemTimestamp(item) {
      return +new Date(item.lastActivityAt);
    }
    function matchesWindow(item, window2, referenceTime) {
      {
        return true;
      }
    }
    function compareItems(left, right, sort) {
      {
        return right.voteCount - left.voteCount || itemTimestamp(right) - itemTimestamp(left);
      }
    }
    showRolePanel = pageData.kind === "platform" && ((pageData.boardMembers?.length ?? 0) > 0 || (pageData.boardCandidates?.length ?? 0) > 0 || (pageData.boardFeatureFrames?.length ?? 0) > 0);
    pageData.feed.reduce((max, item) => Math.max(max, itemTimestamp(item)), 0);
    filteredFeed = pageData.feed.filter((item) => matchesFilter()).filter((item) => matchesWindow()).slice().sort((left, right) => compareItems(left, right));
    shareInviteLink = pageData.membership.inviteLink && browser && pageData.membership.inviteLink.startsWith("/") ? `${window.location.origin}${pageData.membership.inviteLink}` : pageData.membership.inviteLink ?? "";
    {
      const inviteParam = store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("invite") ?? "";
      if (inviteParam && inviteParam !== lastInviteParam && !pageData.membership.viewerIsMember) {
        inviteDraft = inviteParam;
        inviteFeedback = "";
        inviteFeedbackTone = "soft";
        showInvitePanel = true;
      }
      lastInviteParam = inviteParam;
    }
    inviteButtonActive = pageData.membership.joinPolicy === "invite_only" ? showInvitePanel : pageData.membership.viewerIsMember;
    $$renderer2.push(`<section class="directory-page svelte-14wv86k"><section class="header-card svelte-14wv86k"><div class="header-topline svelte-14wv86k"><div class="badge-row svelte-14wv86k"><!--[-->`);
    const each_array = ensure_array_like(pageData.badges);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let badge = each_array[$$index];
      $$renderer2.push(`<span class="badge svelte-14wv86k">${escape_html(badge)}</span>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="membership-row svelte-14wv86k"><span class="member-count svelte-14wv86k">${escape_html(pageData.membership.memberCount)} members</span> `);
    if (pageData.membership.joinPolicy === "invite_only" && pageData.membership.viewerIsMember) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button class="tab-chip svelte-14wv86k"${attr("disabled", membershipPending, true)} type="button">Leave</button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <button${attr("aria-label", pageData.membership.joinPolicy === "invite_only" ? showInvitePanel ? `Hide invite panel for ${pageData.title}` : `Open invite panel for ${pageData.title}` : pageData.membership.viewerIsMember ? `Leave ${pageData.title}` : `Join ${pageData.title}`)}${attr_class("membership-button svelte-14wv86k", void 0, { "active": inviteButtonActive })}${attr(
      "disabled",
      pageData.membership.joinPolicy === "invite_only" ? false : !pageData.membership.viewerCanToggleMembership || membershipPending,
      true
    )} type="button">+</button></div></div> <div class="header-copy svelte-14wv86k"><h1 class="svelte-14wv86k">${escape_html(pageData.title)}</h1> <p class="svelte-14wv86k">${escape_html(pageData.description)}</p> `);
    if (pageData.note) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="note svelte-14wv86k">${escape_html(pageData.note)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    if (showRolePanel) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="header-actions svelte-14wv86k"><button${attr_class("tab-chip svelte-14wv86k", void 0, { "active": showBoardPanel })} type="button">Board members</button></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (pageData.membership.joinPolicy === "invite_only" && showInvitePanel) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<section class="invite-card svelte-14wv86k">`);
      if (pageData.membership.viewerIsMember && shareInviteLink) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="invite-copy svelte-14wv86k"><h2 class="svelte-14wv86k">Invite link</h2> <p class="svelte-14wv86k">Share this link when you want to bring someone into this closed community.</p></div> <div class="invite-actions svelte-14wv86k"><input${attr("aria-label", `${pageData.title} invite link`)} readonly="" type="text"${attr("value", shareInviteLink)} class="svelte-14wv86k"/> <button class="tab-chip svelte-14wv86k" type="button">Copy link</button></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<div class="invite-copy svelte-14wv86k"><h2 class="svelte-14wv86k">Use invite link</h2> <p class="svelte-14wv86k">Paste a closed-community invite link or invite code to join and unlock the feed.</p></div> <div class="invite-actions svelte-14wv86k"><input${attr("aria-label", `${pageData.title} invite link input`)}${attr("value", inviteDraft)} placeholder="Paste invite link or invite code" type="text" class="svelte-14wv86k"/> <button class="tab-chip svelte-14wv86k"${attr("disabled", !inviteDraft.trim() || invitePending, true)} type="button">Join with invite</button></div>`);
      }
      $$renderer2.push(`<!--]--> `);
      if (inviteFeedback) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<p${attr_class("invite-feedback svelte-14wv86k", void 0, { "warning": inviteFeedbackTone === "warning" })}>${escape_html(inviteFeedback)}</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></section>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></section> `);
    if (pageData.membership.viewerCanSeeFeed) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<section class="toolbar-card svelte-14wv86k"><div class="controls-row svelte-14wv86k">`);
      $$renderer2.select(
        {
          "aria-label": `Filter ${pageData.title} feed`,
          value: activeFilter,
          class: ""
        },
        ($$renderer3) => {
          $$renderer3.option({ value: "all" }, ($$renderer4) => {
            $$renderer4.push(`All items`);
          });
          $$renderer3.option({ value: "projects" }, ($$renderer4) => {
            $$renderer4.push(`Projects`);
          });
          $$renderer3.option({ value: "threads" }, ($$renderer4) => {
            $$renderer4.push(`Threads`);
          });
          $$renderer3.option({ value: "events" }, ($$renderer4) => {
            $$renderer4.push(`Events`);
          });
        },
        "svelte-14wv86k"
      );
      $$renderer2.push(` `);
      $$renderer2.select(
        {
          "aria-label": `Sort ${pageData.title} feed by`,
          value: activeSort,
          class: ""
        },
        ($$renderer3) => {
          $$renderer3.option({ value: "popular" }, ($$renderer4) => {
            $$renderer4.push(`Most popular`);
          });
          $$renderer3.option({ value: "recent" }, ($$renderer4) => {
            $$renderer4.push(`Most recent`);
          });
        },
        "svelte-14wv86k"
      );
      $$renderer2.push(` `);
      $$renderer2.select(
        {
          "aria-label": `${pageData.title} feed time window`,
          value: activeWindow,
          class: ""
        },
        ($$renderer3) => {
          $$renderer3.option({ value: "12h" }, ($$renderer4) => {
            $$renderer4.push(`Last 12 hours`);
          });
          $$renderer3.option({ value: "1d" }, ($$renderer4) => {
            $$renderer4.push(`1 day`);
          });
          $$renderer3.option({ value: "7d" }, ($$renderer4) => {
            $$renderer4.push(`7 days`);
          });
          $$renderer3.option({ value: "1m" }, ($$renderer4) => {
            $$renderer4.push(`1 month`);
          });
          $$renderer3.option({ value: "1y" }, ($$renderer4) => {
            $$renderer4.push(`1 year`);
          });
          $$renderer3.option({ value: "all" }, ($$renderer4) => {
            $$renderer4.push(`All time`);
          });
        },
        "svelte-14wv86k"
      );
      $$renderer2.push(`</div></section>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="stack svelte-14wv86k">`);
    if (!pageData.membership.viewerCanSeeFeed) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<section class="info-card svelte-14wv86k"><p class="svelte-14wv86k">${escape_html(pageData.membership.hiddenFeedCopy ?? "This feed is only visible to members.")}</p></section>`);
    } else if (filteredFeed.length === 0) {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<section class="info-card svelte-14wv86k"><p class="svelte-14wv86k">${escape_html(pageData.emptyFeedText)}</p></section>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<!--[-->`);
      const each_array_1 = ensure_array_like(filteredFeed);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let item = each_array_1[$$index_1];
        PublicFeedCard($$renderer2, { item });
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></section>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
    bind_props($$props, { pageData });
  });
}
export {
  DirectoryFeedLayout as D
};
