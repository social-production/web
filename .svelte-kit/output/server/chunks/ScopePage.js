import { g as store_get, d as ensure_array_like, e as escape_html, b as attr, c as attr_class, u as unsubscribe_stores, f as bind_props } from "./renderer.js";
import { b as browser } from "./render-context.js";
import "@sveltejs/kit/internal";
import "./exports.js";
import "./utils.js";
import "@sveltejs/kit/internal/server";
import "./root.js";
import "./state.svelte.js";
import { p as page } from "./stores.js";
import "./VoteStrip.js";
import "./data.js";
import { P as PublicFeedCard } from "./PublicFeedCard.js";
function ScopePage($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let filteredFeed, shareInviteLink;
    let scope = $$props["scope"];
    let activePanel = "feed";
    let activeFilter = "all";
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
    filteredFeed = scope.feed.filter((item) => matchesFilter());
    shareInviteLink = scope.membership.inviteLink && browser && scope.membership.inviteLink.startsWith("/") ? `${window.location.origin}${scope.membership.inviteLink}` : scope.membership.inviteLink ?? "";
    {
      const inviteParam = store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("invite") ?? "";
      if (inviteParam && inviteParam !== lastInviteParam && !scope.membership.viewerIsMember) {
        inviteDraft = inviteParam;
        inviteFeedback = "";
        inviteFeedbackTone = "soft";
      }
      lastInviteParam = inviteParam;
    }
    $$renderer2.push(`<section class="scope-page svelte-1f5lsr8"><section class="header-card svelte-1f5lsr8"><div class="header-topline svelte-1f5lsr8"><div class="badge-row svelte-1f5lsr8"><!--[-->`);
    const each_array = ensure_array_like(scope.badges);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let badge = each_array[$$index];
      $$renderer2.push(`<span class="badge svelte-1f5lsr8">${escape_html(badge)}</span>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="membership-row svelte-1f5lsr8"><span class="member-count svelte-1f5lsr8">${escape_html(scope.membership.memberCount)} members</span> <button${attr("aria-label", scope.membership.viewerIsMember ? `Leave ${scope.title}` : `Join ${scope.title}`)}${attr_class("membership-button svelte-1f5lsr8", void 0, { "active": scope.membership.viewerIsMember })}${attr("disabled", !scope.membership.viewerCanToggleMembership || membershipPending, true)} type="button">+</button></div></div> <div class="header-copy svelte-1f5lsr8"><h1 class="svelte-1f5lsr8">${escape_html(scope.title)}</h1> <p class="svelte-1f5lsr8">${escape_html(scope.description)}</p> `);
    if (scope.note) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="note svelte-1f5lsr8">${escape_html(scope.note)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    if (scope.membership.joinPolicy === "invite_only") {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<section class="invite-card svelte-1f5lsr8">`);
      if (scope.membership.viewerIsMember && shareInviteLink) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="invite-copy svelte-1f5lsr8"><h2 class="svelte-1f5lsr8">Invite link</h2> <p>Share this link when you want to bring someone into this closed community.</p></div> <div class="invite-actions svelte-1f5lsr8"><input${attr("aria-label", `${scope.title} invite link`)} readonly="" type="text"${attr("value", shareInviteLink)} class="svelte-1f5lsr8"/> <button class="tab-chip svelte-1f5lsr8" type="button">Copy link</button></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<div class="invite-copy svelte-1f5lsr8"><h2 class="svelte-1f5lsr8">Use invite link</h2> <p>Paste a closed-community invite link or invite code to join and unlock the feed.</p></div> <div class="invite-actions svelte-1f5lsr8"><input${attr("aria-label", `${scope.title} invite link input`)}${attr("value", inviteDraft)} placeholder="Paste invite link or invite code" type="text" class="svelte-1f5lsr8"/> <button class="tab-chip svelte-1f5lsr8"${attr("disabled", !inviteDraft.trim() || invitePending, true)} type="button">Join with invite</button></div>`);
      }
      $$renderer2.push(`<!--]--> `);
      if (inviteFeedback) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<p${attr_class("invite-feedback svelte-1f5lsr8", void 0, { "warning": inviteFeedbackTone === "warning" })}>${escape_html(inviteFeedback)}</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></section>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></section> <section class="toolbar-card svelte-1f5lsr8"><div class="toolbar-block"><div class="chip-row svelte-1f5lsr8"><button${attr_class("tab-chip svelte-1f5lsr8", void 0, { "active": activeFilter === "all" })} type="button">All</button> <button${attr_class("tab-chip svelte-1f5lsr8", void 0, { "active": activeFilter === "projects" })} type="button">Projects</button> <button${attr_class("tab-chip svelte-1f5lsr8", void 0, { "active": activeFilter === "threads" })} type="button">Threads</button> <button${attr_class("tab-chip svelte-1f5lsr8", void 0, { "active": activeFilter === "events" })} type="button">Events</button></div></div> <div class="toolbar-block align-end svelte-1f5lsr8"><div class="chip-row svelte-1f5lsr8"><button${attr_class("tab-chip svelte-1f5lsr8", void 0, { "active": activePanel === "moderators" })} type="button">${escape_html(scope.moderationLabel)}</button></div></div></section> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="stack svelte-1f5lsr8">`);
      if (!scope.membership.viewerCanSeeFeed) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<section class="info-card svelte-1f5lsr8"><p class="svelte-1f5lsr8">${escape_html(scope.membership.hiddenFeedCopy ?? "This feed is only visible to members.")}</p></section>`);
      } else if (filteredFeed.length === 0) {
        $$renderer2.push("<!--[1-->");
        $$renderer2.push(`<section class="info-card svelte-1f5lsr8"><p class="svelte-1f5lsr8">${escape_html(scope.emptyFeedText)}</p></section>`);
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
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></section>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
    bind_props($$props, { scope });
  });
}
export {
  ScopePage as S
};
