import { k as fallback, e as escape_html, d as ensure_array_like, b as attr, c as attr_class, f as bind_props, g as store_get, u as unsubscribe_stores } from "../../../../chunks/renderer.js";
import { p as page } from "../../../../chunks/stores.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/root.js";
import "../../../../chunks/state.svelte.js";
import "../../../../chunks/data.js";
import { a as formatRelativeTime } from "../../../../chunks/time.js";
import { D as DetailUpdateCard } from "../../../../chunks/DetailUpdateCard.js";
import { C as CountPill } from "../../../../chunks/CountPill.js";
import { S as SubjectTablet, T as Tablet } from "../../../../chunks/SubjectTablet.js";
import { T as TagList } from "../../../../chunks/TagList.js";
import { V as VoteStrip } from "../../../../chunks/VoteStrip.js";
function LiveChatPanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let messages;
    let comments = fallback($$props["comments"], () => [], true);
    let subjectId = $$props["subjectId"];
    let highlightedCommentId = fallback($$props["highlightedCommentId"], null);
    let title = fallback($$props["title"], "Discussion");
    let description = fallback($$props["description"], "");
    let placeholder = fallback($$props["placeholder"], "Write a message...");
    let submitLabel = fallback($$props["submitLabel"], "Send message");
    let emptyCopy = fallback($$props["emptyCopy"], "No chat messages yet.");
    let draftMessage = "";
    function flattenComments(items, depth = 0) {
      const flattened = [];
      for (const item of items) {
        flattened.push({
          id: item.id,
          authorUsername: item.authorUsername,
          body: item.body,
          createdAt: item.createdAt,
          depth
        });
        flattened.push(...flattenComments(item.replies, depth + 1));
      }
      return flattened;
    }
    messages = flattenComments(comments).sort((left, right) => +new Date(left.createdAt) - +new Date(right.createdAt));
    $$renderer2.push(`<section class="chat-panel svelte-w6zzuj"><div class="chat-header svelte-w6zzuj"><div><h2 class="svelte-w6zzuj">${escape_html(title)}</h2> `);
    if (description) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="svelte-w6zzuj">${escape_html(description)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div></div> <div class="chat-log svelte-w6zzuj">`);
    if (messages.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="empty-state svelte-w6zzuj">${escape_html(emptyCopy)}</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<!--[-->`);
      const each_array = ensure_array_like(messages);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let message = each_array[$$index];
        $$renderer2.push(`<article${attr("id", `comment-${message.id}`)}${attr_class("chat-message svelte-w6zzuj", void 0, { "highlighted": highlightedCommentId === message.id })}><div class="avatar-pill svelte-w6zzuj">${escape_html(message.authorUsername.slice(0, 2).toUpperCase())}</div> <div class="message-copy svelte-w6zzuj"><div class="message-topline svelte-w6zzuj"><a class="author-link svelte-w6zzuj"${attr("href", `/profile/${message.authorUsername}`)}>${escape_html(message.authorUsername)}</a> <span class="svelte-w6zzuj">${escape_html(formatRelativeTime(message.createdAt))}</span></div> <p class="svelte-w6zzuj">${escape_html(message.body)}</p></div></article>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div> <div class="composer-card svelte-w6zzuj"><textarea rows="3"${attr("placeholder", placeholder)} class="svelte-w6zzuj">`);
    const $$body = escape_html(draftMessage);
    if ($$body) {
      $$renderer2.push(`${$$body}`);
    }
    $$renderer2.push(`</textarea> <div class="composer-actions svelte-w6zzuj"><button class="primary-button svelte-w6zzuj" type="button">${escape_html(submitLabel)}</button></div></div></section>`);
    bind_props($$props, {
      comments,
      subjectId,
      highlightedCommentId,
      title,
      description,
      placeholder,
      submitLabel,
      emptyCopy
    });
  });
}
function EventDetailPage($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let managerToggleLabel;
    let data = $$props["data"];
    let activeTopTab = "overview";
    let selectedManagerInviteeId = "";
    let highlightedCommentId = null;
    let highlightedUpdateId = null;
    let lastRouteSignature = "";
    let managerTogglePending = false;
    let invitePending = false;
    function resolveEventTopTab(url) {
      return url.searchParams.get("tab") === "members" ? "members" : "overview";
    }
    function readCommentTarget(url) {
      if (url.hash.startsWith("#comment-")) {
        return url.hash.slice("#comment-".length) || null;
      }
      return url.searchParams.get("comment");
    }
    function readUpdateTarget(url) {
      if (url.hash.startsWith("#update-")) {
        return url.hash.slice("#update-".length) || null;
      }
      return url.searchParams.get("update");
    }
    function meetsConfidenceThreshold(member) {
      return !!member.confidenceReviewCount && (member.confidenceRatio ?? 0) >= 70;
    }
    {
      const routeSignature = `${store_get($$store_subs ??= {}, "$page", page).url.pathname}${store_get($$store_subs ??= {}, "$page", page).url.search}${store_get($$store_subs ??= {}, "$page", page).url.hash}`;
      if (routeSignature !== lastRouteSignature) {
        lastRouteSignature = routeSignature;
        highlightedCommentId = readCommentTarget(store_get($$store_subs ??= {}, "$page", page).url);
        highlightedUpdateId = readUpdateTarget(store_get($$store_subs ??= {}, "$page", page).url);
        activeTopTab = resolveEventTopTab(store_get($$store_subs ??= {}, "$page", page).url);
      }
    }
    if (!data.availableManagerInvitees.some((member) => member.id === selectedManagerInviteeId)) {
      selectedManagerInviteeId = data.availableManagerInvitees[0]?.id ?? "";
    }
    managerToggleLabel = !data.viewerCanToggleManagerNomination ? "Only public event members can become event managers" : data.viewerIsEventManager ? "Step back from event manager" : data.viewerIsManagerCandidate ? "Withdraw manager request" : "Become event manager";
    $$renderer2.push(`<section class="page svelte-q3tc8v"><section class="hero-card svelte-q3tc8v"><div class="header-row svelte-q3tc8v"><div class="chips svelte-q3tc8v">`);
    SubjectTablet($$renderer2, { kind: "event" });
    $$renderer2.push(`<!----> `);
    Tablet($$renderer2, {
      label: data.isPrivate ? "Private" : "Public",
      variant: "visibility"
    });
    $$renderer2.push(`<!----></div> <div class="tag-stack svelte-q3tc8v">`);
    TagList($$renderer2, { tags: data.channelTags });
    $$renderer2.push(`<!----> `);
    TagList($$renderer2, { tags: data.communityTags });
    $$renderer2.push(`<!----></div></div> <h1 class="svelte-q3tc8v">${escape_html(data.title)}</h1> <p class="overview-copy svelte-q3tc8v">${escape_html(data.description)}</p> <p class="location svelte-q3tc8v">${escape_html(data.timeLabel)} · ${escape_html(data.locationLabel)}</p> <section class="top-tab-row svelte-q3tc8v"><button${attr_class("tab-chip svelte-q3tc8v", void 0, { "active": activeTopTab === "overview" })} type="button">Overview</button> <button${attr_class("tab-chip svelte-q3tc8v", void 0, { "active": activeTopTab === "members" })} type="button">Members</button></section> `);
    if (activeTopTab === "overview") {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<section class="hero-body svelte-q3tc8v"><p class="svelte-q3tc8v">${escape_html(data.attendanceNote)}</p> <div class="meta-grid svelte-q3tc8v"><div class="meta-item svelte-q3tc8v"><strong class="svelte-q3tc8v">When</strong> <span class="svelte-q3tc8v">${escape_html(data.timeLabel)}</span></div> <div class="meta-item svelte-q3tc8v"><strong class="svelte-q3tc8v">Where</strong> <span class="svelte-q3tc8v">${escape_html(data.locationLabel)}</span></div> <div class="meta-item svelte-q3tc8v"><strong class="svelte-q3tc8v">Visibility</strong> <span class="svelte-q3tc8v">${escape_html(data.isPrivate ? "Private event" : "Public event")}</span></div></div> <section class="section-block svelte-q3tc8v"><div class="section-header compact-header svelte-q3tc8v"><h2 class="svelte-q3tc8v">Agenda</h2> <p class="svelte-q3tc8v">Events stay lightweight, so the agenda and updates sit in the overview card rather than breaking into separate tabs.</p></div> <div class="stack svelte-q3tc8v"><!--[-->`);
      const each_array = ensure_array_like(data.agenda);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let line = each_array[$$index];
        $$renderer2.push(`<div class="empty-card svelte-q3tc8v">${escape_html(line)}</div>`);
      }
      $$renderer2.push(`<!--]--></div></section> <section class="section-block svelte-q3tc8v" id="updates"><div class="section-header compact-header svelte-q3tc8v"><h2 class="svelte-q3tc8v">Updates</h2> <p class="svelte-q3tc8v">Event managers can post live logistics here without forcing the page back into a threaded discussion layout.</p></div> `);
      if (data.viewerIsEventManager) {
        $$renderer2.push("<!--[0-->");
        {
          $$renderer2.push("<!--[-1-->");
          $$renderer2.push(`<button class="primary-button svelte-q3tc8v" type="button">Create update</button>`);
        }
        $$renderer2.push(`<!--]-->`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="stack svelte-q3tc8v">`);
      if (data.updates.length === 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="empty-card svelte-q3tc8v"><p class="svelte-q3tc8v">No updates yet.</p></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<!--[-->`);
        const each_array_1 = ensure_array_like(data.updates);
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let update = each_array_1[$$index_1];
          DetailUpdateCard($$renderer2, { update, highlightedUpdateId });
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div></section></section>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<section class="members-panel svelte-q3tc8v"><div class="members-header svelte-q3tc8v"><div class="section-header compact-header svelte-q3tc8v"><h2 class="svelte-q3tc8v">Event managers</h2> <p class="svelte-q3tc8v">Managers can post updates, invite additional managers, and coordinate attendance directly from this page.</p></div> <button class="secondary-button svelte-q3tc8v"${attr("disabled", !data.viewerCanToggleManagerNomination || managerTogglePending, true)} type="button">${escape_html(managerToggleLabel)}</button></div> `);
      if (data.viewerCanInviteEventManagers && data.availableManagerInvitees.length > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="invite-shell svelte-q3tc8v"><label><span class="field-label svelte-q3tc8v">Invite a manager</span> `);
        $$renderer2.select(
          { value: selectedManagerInviteeId, class: "" },
          ($$renderer3) => {
            $$renderer3.push(`<!--[-->`);
            const each_array_2 = ensure_array_like(data.availableManagerInvitees);
            for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
              let member = each_array_2[$$index_2];
              $$renderer3.option({ value: member.id }, ($$renderer4) => {
                $$renderer4.push(`${escape_html(member.username)}`);
              });
            }
            $$renderer3.push(`<!--]-->`);
          },
          "svelte-q3tc8v"
        );
        $$renderer2.push(`</label> <button class="primary-button svelte-q3tc8v"${attr("disabled", invitePending, true)} type="button">Invite</button></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="stack svelte-q3tc8v">`);
      if (data.eventManagers.length === 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="empty-card svelte-q3tc8v"><p class="svelte-q3tc8v">No managers listed yet.</p></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<!--[-->`);
        const each_array_3 = ensure_array_like(data.eventManagers);
        for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
          let member = each_array_3[$$index_3];
          $$renderer2.push(`<div class="person-row confidence-row svelte-q3tc8v"><div class="person-copy svelte-q3tc8v"><a class="person-link svelte-q3tc8v"${attr("href", `/profile/${member.username}`)}><strong class="svelte-q3tc8v">${escape_html(member.username)}</strong></a> <div class="confidence-summary svelte-q3tc8v"><span${attr_class("svelte-q3tc8v", void 0, {
            "healthy": meetsConfidenceThreshold(member),
            "warning": !meetsConfidenceThreshold(member)
          })}>${escape_html(member.confidenceRatio)}% confidence</span> <span class="svelte-q3tc8v">${escape_html(member.confidenceReviewCount)} reviews</span></div></div> `);
          if (member.confidenceTargetId) {
            $$renderer2.push("<!--[0-->");
            VoteStrip($$renderer2, {
              activeVote: member.confidenceActiveVote ?? 0,
              count: member.confidenceVoteCount ?? 0
            });
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></div>`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div></section>`);
    }
    $$renderer2.push(`<!--]--> <div class="overview-footer-row svelte-q3tc8v">`);
    VoteStrip($$renderer2, { activeVote: data.activeVote, count: data.voteCount });
    $$renderer2.push(`<!----> `);
    CountPill($$renderer2, { label: `${data.goingCount} going` });
    $$renderer2.push(`<!----> <span class="footer-author-row svelte-q3tc8v"><a class="inline-link svelte-q3tc8v"${attr("href", `/profile/${data.createdByUsername}`)}>${escape_html(data.createdByUsername)}</a> · ${escape_html(formatRelativeTime(data.lastActivityAt))}</span></div></section> `);
    LiveChatPanel($$renderer2, {
      comments: data.discussion,
      description: data.discussionNote,
      emptyCopy: "No event chat yet.",
      highlightedCommentId,
      placeholder: "Message attendees...",
      subjectId: data.id,
      submitLabel: "Send message",
      title: "Event chat"
    });
    $$renderer2.push(`<!----></section>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
    bind_props($$props, { data });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    EventDetailPage($$renderer2, { data: data.event });
    bind_props($$props, { data });
  });
}
export {
  _page as default
};
