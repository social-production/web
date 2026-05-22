import { e as escape_html, a as ensure_array_like, b as attr_class, c as attr, s as store_get, u as unsubscribe_stores, d as bind_props, f as fallback, g as attr_style, h as slot, i as head } from "../../chunks/renderer.js";
import "@sveltejs/kit/internal";
import "../../chunks/exports.js";
import "../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../chunks/root.js";
import "../../chunks/state.svelte.js";
import { p as page } from "../../chunks/stores.js";
import { C as CountBadge } from "../../chunks/CountBadge.js";
import { S as SubjectTablet } from "../../chunks/SubjectTablet.js";
import "../../chunks/data.js";
import { f as formatCalendarTime } from "../../chunks/time.js";
const brandIcon = "/_app/immutable/assets/app-icon-no-background-full-white.BUoRzi80.png";
function LeftRailPanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let collectiveLink;
    let bootstrap = $$props["bootstrap"];
    let compact = fallback($$props["compact"], false);
    let isActive = $$props["isActive"];
    let closePanels = $$props["closePanels"];
    const createLinks = [
      { href: "/create/post", label: "Post" },
      { href: "/create/thread", label: "Thread" },
      { href: "/create/project", label: "Project" },
      { href: "/create/event", label: "Event" },
      { href: "/create/community", label: "Community" },
      { href: "/create/channel", label: "Channel" }
    ];
    const railDescriptions = {
      create: "Start a new production, service, or discussion surface.",
      collective: "Shared governance and common platform work.",
      channels: "Topic-based discovery across projects, threads, and events.",
      communities: "Social coordination spaces around shared work."
    };
    collectiveLink = bootstrap.directory.platform ?? { slug: "platform", label: "Platform", href: "/platform" };
    if (compact) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="compact-rail-header svelte-1uqfbpd"><h2>Left Rail</h2> <button class="close-rail svelte-1uqfbpd" type="button">Close</button></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <section class="rail-panel svelte-1uqfbpd"><h2 class="svelte-1uqfbpd">Create</h2> <p class="section-subtitle svelte-1uqfbpd">${escape_html(railDescriptions.create)}</p> <div class="stack-links svelte-1uqfbpd"><!--[-->`);
    const each_array = ensure_array_like(createLinks);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let link = each_array[$$index];
      $$renderer2.push(`<a${attr_class("rail-link create-link svelte-1uqfbpd", void 0, { "active-link": isActive(link.href) })}${attr("href", bootstrap.viewer ? link.href : "/onboarding")}><span class="create-plus svelte-1uqfbpd">+</span> ${escape_html(link.label)}</a>`);
    }
    $$renderer2.push(`<!--]--></div></section> <section class="rail-panel svelte-1uqfbpd"><h2 class="svelte-1uqfbpd">Collective</h2> <p class="section-subtitle svelte-1uqfbpd">${escape_html(railDescriptions.collective)}</p> <div class="stack-links svelte-1uqfbpd"><a${attr_class("rail-link svelte-1uqfbpd", void 0, {
      "active-link": store_get($$store_subs ??= {}, "$page", page).url.pathname === collectiveLink.href
    })}${attr("href", collectiveLink.href)}>${escape_html(collectiveLink.label)}</a> <a${attr_class("rail-link svelte-1uqfbpd", void 0, {
      "active-link": store_get($$store_subs ??= {}, "$page", page).url.pathname === "/platform/assets" || store_get($$store_subs ??= {}, "$page", page).url.pathname.startsWith("/platform/assets/")
    })} href="/platform/assets"><span>Assets</span> <span${attr_class(`feature-pill ${bootstrap.featureFlags.assets ? "open" : "closed"}`, "svelte-1uqfbpd")}>${escape_html(bootstrap.featureFlags.assets ? "Open" : "Closed")}</span></a></div></section> <section class="rail-panel svelte-1uqfbpd"><h2 class="svelte-1uqfbpd">Channels</h2> <p class="section-subtitle svelte-1uqfbpd">${escape_html(railDescriptions.channels)}</p> <div class="stack-links svelte-1uqfbpd"><!--[-->`);
    const each_array_1 = ensure_array_like(bootstrap.directory.channels);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let link = each_array_1[$$index_1];
      $$renderer2.push(`<a${attr_class("rail-link svelte-1uqfbpd", void 0, { "active-link": isActive(link.href) })}${attr("href", link.href)}>${escape_html(link.label)}</a>`);
    }
    $$renderer2.push(`<!--]--></div></section> <section class="rail-panel svelte-1uqfbpd"><h2 class="svelte-1uqfbpd">Communities</h2> <p class="section-subtitle svelte-1uqfbpd">${escape_html(railDescriptions.communities)}</p> <div class="stack-links svelte-1uqfbpd"><!--[-->`);
    const each_array_2 = ensure_array_like(bootstrap.directory.communities);
    for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
      let link = each_array_2[$$index_2];
      $$renderer2.push(`<a${attr_class("rail-link svelte-1uqfbpd", void 0, { "active-link": isActive(link.href) })}${attr("href", link.href)}>${escape_html(link.label)}</a>`);
    }
    $$renderer2.push(`<!--]--></div></section>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
    bind_props($$props, { bootstrap, compact, isActive, closePanels });
  });
}
function RightRailPanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let activityItems, requestItems;
    let compact = fallback($$props["compact"], false);
    let items = fallback($$props["items"], () => [], true);
    let pendingSubjectId = "";
    function usesRoleCommitment(item) {
      return (item.kind === "project" || item.kind === "event") && !!item.activityId;
    }
    function isRailActionActive(item) {
      if (usesRoleCommitment(item)) {
        return !!item.viewerAssignedRoleLabel;
      }
      return !!item.viewerIsParticipating;
    }
    function isRailActionDisabled(item) {
      return usesRoleCommitment(item) && !item.viewerAssignedRoleLabel && item.hasOpenRole === false;
    }
    activityItems = items.filter((item) => item.kind !== "request");
    requestItems = items.filter((item) => item.kind === "request");
    if (compact) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="compact-rail-header svelte-1n3ckhp"><h2>Activity, Events &amp; Requests</h2> <button class="close-rail svelte-1n3ckhp" type="button">Close</button></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <section class="rail-panel svelte-1n3ckhp"><section class="rail-section svelte-1n3ckhp"><h2 class="svelte-1n3ckhp">Project Activity &amp; Events</h2> <p class="section-subtitle svelte-1n3ckhp">Project activity and related events from your memberships and scopes.</p> <div${attr_class("snapshot-stack svelte-1n3ckhp", void 0, { "snapshot-scroll": activityItems.length > 5 })}>`);
    if (activityItems.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="snapshot-row svelte-1n3ckhp"><strong class="svelte-1n3ckhp">No activity yet</strong> <span class="svelte-1n3ckhp">Tagged project activity, invites, and related events will appear here when they match your memberships.</span></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<!--[-->`);
      const each_array = ensure_array_like(activityItems);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let item = each_array[$$index];
        $$renderer2.push(`<article class="snapshot-row activity-row svelte-1n3ckhp"><button class="activity-open-button svelte-1n3ckhp" type="button"><div class="activity-topline svelte-1n3ckhp">`);
        SubjectTablet($$renderer2, {
          kind: item.kind === "event" ? "event" : "project",
          projectMode: item.projectMode ?? "productive"
        });
        $$renderer2.push(`<!----> <span class="snapshot-time svelte-1n3ckhp">${escape_html(item.kind === "event" && item.timeLabel ? item.timeLabel : formatCalendarTime(item.createdAt))}</span></div> <strong class="svelte-1n3ckhp">${escape_html(item.title)}</strong> <span class="svelte-1n3ckhp">${escape_html(item.meta)}</span></button> <div class="event-footer svelte-1n3ckhp"><span class="event-going svelte-1n3ckhp">${escape_html(item.countLabel)}</span> <button${attr("aria-label", usesRoleCommitment(item) ? item.viewerAssignedRoleLabel ? `Leave ${item.title}` : `Open ${item.title}` : item.viewerIsParticipating ? `Leave ${item.title}` : `Join ${item.title}`)}${attr_class("attendance-button svelte-1n3ckhp", void 0, { "attendance-state": isRailActionActive(item) })}${attr("disabled", pendingSubjectId === item.subjectId || isRailActionDisabled(item), true)} type="button">`);
        if (usesRoleCommitment(item)) {
          $$renderer2.push("<!--[0-->");
          if (item.viewerAssignedRoleLabel) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`Going`);
          } else if (item.hasOpenRole === false) {
            $$renderer2.push("<!--[1-->");
            $$renderer2.push(`Full`);
          } else {
            $$renderer2.push("<!--[-1-->");
            $$renderer2.push(`+`);
          }
          $$renderer2.push(`<!--]-->`);
        } else {
          $$renderer2.push("<!--[-1-->");
          $$renderer2.push(`${escape_html(item.viewerIsParticipating ? "Going" : "+")}`);
        }
        $$renderer2.push(`<!--]--></button></div></article>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></section> <section class="rail-section rail-section-requests svelte-1n3ckhp"><h2 class="svelte-1n3ckhp">Requests</h2> <p class="section-subtitle svelte-1n3ckhp">Open service requests from projects you help run.</p> <div${attr_class("snapshot-stack svelte-1n3ckhp", void 0, { "snapshot-scroll": requestItems.length > 5 })}>`);
    if (requestItems.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="snapshot-row svelte-1n3ckhp"><strong class="svelte-1n3ckhp">No open requests</strong> <span class="svelte-1n3ckhp">Service requests you can review will appear here and open the matching project card.</span></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<!--[-->`);
      const each_array_1 = ensure_array_like(requestItems);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let item = each_array_1[$$index_1];
        $$renderer2.push(`<article class="snapshot-row activity-row request-row svelte-1n3ckhp"><button class="activity-open-button svelte-1n3ckhp" type="button"><div class="activity-topline svelte-1n3ckhp">`);
        SubjectTablet($$renderer2, {
          kind: "project",
          projectMode: item.projectMode ?? "collective-service"
        });
        $$renderer2.push(`<!----> <span class="snapshot-time svelte-1n3ckhp">${escape_html(formatCalendarTime(item.createdAt))}</span></div> <strong class="svelte-1n3ckhp">${escape_html(item.title)}</strong> <span class="svelte-1n3ckhp">${escape_html(item.meta)}</span> `);
        if (item.countLabel) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<span class="event-going request-detail svelte-1n3ckhp">${escape_html(item.countLabel)}</span>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></button></article>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></section></section>`);
    bind_props($$props, { compact, items });
  });
}
function AppShell($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let bootstrap = $$props["bootstrap"];
    let isCompact = true;
    let leftRailOpen = false;
    let rightRailOpen = false;
    let toolbarQuery = "";
    let topbarHeight = 53;
    let compactContentOffset = 0;
    function isActive(href) {
      const pathname = store_get($$store_subs ??= {}, "$page", page).url.pathname;
      if (href === "/") {
        return pathname === "/";
      }
      return pathname === href || pathname.startsWith(`${href}/`);
    }
    function closeCompactPanels() {
      {
        leftRailOpen = false;
        rightRailOpen = false;
      }
    }
    if (store_get($$store_subs ??= {}, "$page", page).url.pathname === "/search") {
      toolbarQuery = store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("q") ?? "";
    }
    $$renderer2.push(`<div class="shell svelte-qphds7"${attr_style(`--left-width: ${leftRailOpen && !isCompact ? "262px" : "0px"}; --right-width: ${rightRailOpen && !isCompact ? "292px" : "0px"}; --topbar-height: ${topbarHeight}px; --compact-content-offset: ${compactContentOffset}px; --main-frame-max-width: ${"none"};`)}><header class="topbar svelte-qphds7"><a class="brand svelte-qphds7" href="/"><span class="brand-mark svelte-qphds7"><img alt="" class="brand-icon svelte-qphds7"${attr("src", brandIcon)}/></span> <span><strong class="svelte-qphds7">Social Production</strong></span></a> <div class="panel-controls svelte-qphds7"><button aria-label="Toggle left rail"${attr("aria-expanded", leftRailOpen)} class="panel-toggle svelte-qphds7"${attr("data-active", leftRailOpen)} type="button"><span aria-hidden="true" class="panel-toggle-icon svelte-qphds7">|&lt;</span></button> <button aria-label="Toggle right rail"${attr("aria-expanded", rightRailOpen)} class="panel-toggle svelte-qphds7"${attr("data-active", rightRailOpen)} type="button"><span aria-hidden="true" class="panel-toggle-icon svelte-qphds7">>|</span></button></div> <div class="toolbar-center svelte-qphds7"><form class="toolbar-search svelte-qphds7" role="search"><input aria-label="Search"${attr("value", toolbarQuery)} class="toolbar-search-input svelte-qphds7" placeholder="Search projects, threads, events, and channels" type="search"/></form> <nav class="primary-nav svelte-qphds7" aria-label="Primary"><a${attr_class("nav-link svelte-qphds7", void 0, { "active-link": isActive("/") })} href="/">Public</a> <a${attr_class("nav-link svelte-qphds7", void 0, { "active-link": isActive("/personal") })}${attr("href", bootstrap.viewer ? "/personal" : "/onboarding")}>Personal</a> <a${attr_class("nav-link svelte-qphds7", void 0, { "active-link": isActive("/notifications") })}${attr("href", bootstrap.viewer ? "/notifications" : "/onboarding")}>Notifications `);
    if (bootstrap.unreadCounts.notifications > 0) {
      $$renderer2.push("<!--[0-->");
      CountBadge($$renderer2, { count: bootstrap.unreadCounts.notifications });
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></a> <a${attr_class("nav-link svelte-qphds7", void 0, { "active-link": isActive("/messages") })}${attr("href", bootstrap.viewer ? "/messages" : "/onboarding")}>Messages `);
    if (bootstrap.unreadCounts.messages > 0) {
      $$renderer2.push("<!--[0-->");
      CountBadge($$renderer2, { count: bootstrap.unreadCounts.messages });
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></a></nav></div> <nav class="utility-nav svelte-qphds7" aria-label="Utilities"><a${attr_class("utility-link svelte-qphds7", void 0, { "active-link": isActive("/about") || isActive("/roadmap") })} href="/about">About</a> `);
    if (bootstrap.viewer) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<a${attr_class("utility-link svelte-qphds7", void 0, {
        "active-link": isActive(`/profile/${bootstrap.viewer.username}`)
      })}${attr("href", `/profile/${bootstrap.viewer.username}`)}>${escape_html(bootstrap.viewer.username)}</a> <a aria-label="Settings"${attr_class("gear-button svelte-qphds7", void 0, { "active-link": isActive("/settings") })} href="/settings"><svg aria-hidden="true" viewBox="0 0 24 24" class="gear-icon svelte-qphds7"><path d="M10.3 2h3.4l.5 2.4c.5.2 1 .4 1.5.6l2.1-1.2 2.4 2.4-1.2 2.1c.2.5.4 1 .6 1.5L22 10.3v3.4l-2.4.5c-.2.5-.4 1-.6 1.5l1.2 2.1-2.4 2.4-2.1-1.2c-.5.2-1 .4-1.5.6L13.7 22h-3.4l-.5-2.4c-.5-.2-1-.4-1.5-.6l-2.1 1.2-2.4-2.4 1.2-2.1c-.2-.5-.4-1-.6-1.5L2 13.7v-3.4l2.4-.5c.2-.5.4-1 .6-1.5L3.8 6.2l2.4-2.4 2.1 1.2c.5-.2 1-.4 1.5-.6L10.3 2Zm1.7 6.2A3.8 3.8 0 1 0 12 15.8 3.8 3.8 0 0 0 12 8.2Z" fill="currentColor"></path></svg></a>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<a class="utility-link svelte-qphds7" href="/onboarding">Signup/Login</a>`);
    }
    $$renderer2.push(`<!--]--></nav></header> `);
    if (leftRailOpen || rightRailOpen) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button aria-label="Close side panels" class="rail-backdrop svelte-qphds7"></button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="content-grid svelte-qphds7"><aside class="rail left-rail svelte-qphds7"${attr("data-open", leftRailOpen)}>`);
    LeftRailPanel($$renderer2, {
      bootstrap,
      compact: isCompact,
      isActive,
      closePanels: closeCompactPanels
    });
    $$renderer2.push(`<!----></aside> <main class="main-content svelte-qphds7"><div class="main-frame svelte-qphds7"><!--[-->`);
    slot($$renderer2, $$props, "default", {});
    $$renderer2.push(`<!--]--></div></main> <aside class="rail right-rail svelte-qphds7"${attr("data-open", rightRailOpen)}>`);
    RightRailPanel($$renderer2, { compact: isCompact, items: bootstrap.activityRail });
    $$renderer2.push(`<!----></aside></div></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
    bind_props($$props, { bootstrap });
  });
}
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    head("12qhfyh", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Social Production Web</title>`);
      });
      $$renderer3.push(`<meta name="description" content="Phase 1 Social Production frontend with a development adapter and the first Public and Personal routes."/>`);
    });
    AppShell($$renderer2, {
      bootstrap: data.bootstrap,
      children: ($$renderer3) => {
        $$renderer3.push(`<!--[-->`);
        slot($$renderer3, $$props, "default", {});
        $$renderer3.push(`<!--]-->`);
      },
      $$slots: { default: true }
    });
    bind_props($$props, { data });
  });
}
export {
  _layout as default
};
