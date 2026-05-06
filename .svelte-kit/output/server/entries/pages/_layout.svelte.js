import { a as attr_style, b as attr, c as attr_class, e as escape_html, d as ensure_array_like, s as slot, u as unsubscribe_stores, f as bind_props, g as store_get, h as head } from "../../chunks/renderer.js";
import "@sveltejs/kit/internal";
import "../../chunks/exports.js";
import "../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../chunks/root.js";
import "../../chunks/state.svelte.js";
import { p as page } from "../../chunks/stores.js";
import { S as SubjectTablet } from "../../chunks/SubjectTablet.js";
import "../../chunks/data.js";
import { f as formatCalendarTime } from "../../chunks/time.js";
const brandIcon = "/_app/immutable/assets/app-icon-no-background-full-white.BUoRzi80.png";
function AppShell($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let bootstrap = $$props["bootstrap"];
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
    let leftRailOpen = false;
    let rightRailOpen = false;
    let pendingSubjectId = "";
    function isActive(href) {
      const pathname = store_get($$store_subs ??= {}, "$page", page).url.pathname;
      if (href === "/") {
        return pathname === "/";
      }
      return pathname === href || pathname.startsWith(`${href}/`);
    }
    $$renderer2.push(`<div class="shell svelte-qphds7"${attr_style(`--left-width: ${"0px"}; --right-width: ${"0px"};`)}><header class="topbar svelte-qphds7"><a class="brand svelte-qphds7" href="/"><span class="brand-mark svelte-qphds7"><img alt="" class="brand-icon svelte-qphds7"${attr("src", brandIcon)}/></span> <span><strong class="svelte-qphds7">Social Production</strong></span></a> <div class="panel-controls svelte-qphds7"><button${attr("aria-expanded", leftRailOpen)} class="panel-toggle svelte-qphds7"${attr("data-active", leftRailOpen)} type="button">Scope</button> <button${attr("aria-expanded", rightRailOpen)} class="panel-toggle svelte-qphds7"${attr("data-active", rightRailOpen)} type="button">Activity</button></div> <div class="toolbar-center svelte-qphds7"><a class="toolbar-search svelte-qphds7" href="/search"><span>Search projects, threads, events, and channels</span></a> <nav class="primary-nav svelte-qphds7" aria-label="Primary"><a${attr_class("nav-link svelte-qphds7", void 0, { "active-link": isActive("/") })} href="/">Public</a> <a${attr_class("nav-link svelte-qphds7", void 0, { "active-link": isActive("/personal") })}${attr("href", bootstrap.viewer ? "/personal" : "/onboarding")}>Personal</a> <a${attr_class("nav-link svelte-qphds7", void 0, { "active-link": isActive("/notifications") })}${attr("href", bootstrap.viewer ? "/notifications" : "/onboarding")}>Notifications <span class="svelte-qphds7">${escape_html(bootstrap.unreadCounts.notifications)}</span></a> <a${attr_class("nav-link svelte-qphds7", void 0, { "active-link": isActive("/messages") })}${attr("href", bootstrap.viewer ? "/messages" : "/onboarding")}>Messages <span class="svelte-qphds7">${escape_html(bootstrap.unreadCounts.messages)}</span></a></nav></div> <nav class="utility-nav svelte-qphds7" aria-label="Utilities"><a${attr_class("utility-link svelte-qphds7", void 0, { "active-link": isActive("/roadmap") })} href="/roadmap">Roadmap</a> `);
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
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="content-grid svelte-qphds7"><aside class="rail left-rail svelte-qphds7"${attr("data-open", leftRailOpen)}><div class="compact-rail-header svelte-qphds7"><h2>Scope</h2> <button class="close-rail svelte-qphds7" type="button">Close</button></div> <section class="rail-panel svelte-qphds7"><h2 class="svelte-qphds7">Create</h2> <p class="section-subtitle svelte-qphds7">${escape_html(railDescriptions.create)}</p> <div class="stack-links svelte-qphds7"><!--[-->`);
    const each_array = ensure_array_like(createLinks);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let link = each_array[$$index];
      $$renderer2.push(`<a${attr_class("rail-link create-link svelte-qphds7", void 0, { "active-link": isActive(link.href) })}${attr("href", bootstrap.viewer ? link.href : "/onboarding")}><span class="create-plus svelte-qphds7">+</span> ${escape_html(link.label)}</a>`);
    }
    $$renderer2.push(`<!--]--></div></section> `);
    if (bootstrap.directory.stewardship) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<section class="rail-panel svelte-qphds7"><h2 class="svelte-qphds7">Collective</h2> <p class="section-subtitle svelte-qphds7">${escape_html(railDescriptions.collective)}</p> <div class="stack-links svelte-qphds7"><a${attr_class("rail-link svelte-qphds7", void 0, {
        "active-link": isActive(bootstrap.directory.stewardship.href)
      })}${attr("href", bootstrap.directory.stewardship.href)}>${escape_html(bootstrap.directory.stewardship.label)}</a></div></section>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <section class="rail-panel svelte-qphds7"><h2 class="svelte-qphds7">Channels</h2> <p class="section-subtitle svelte-qphds7">${escape_html(railDescriptions.channels)}</p> <div class="stack-links svelte-qphds7"><!--[-->`);
    const each_array_1 = ensure_array_like(bootstrap.directory.channels);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let link = each_array_1[$$index_1];
      $$renderer2.push(`<a${attr_class("rail-link svelte-qphds7", void 0, { "active-link": isActive(link.href) })}${attr("href", link.href)}>${escape_html(link.label)}</a>`);
    }
    $$renderer2.push(`<!--]--></div></section> <section class="rail-panel svelte-qphds7"><h2 class="svelte-qphds7">Communities</h2> <p class="section-subtitle svelte-qphds7">${escape_html(railDescriptions.communities)}</p> <div class="stack-links svelte-qphds7"><!--[-->`);
    const each_array_2 = ensure_array_like(bootstrap.directory.communities);
    for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
      let link = each_array_2[$$index_2];
      $$renderer2.push(`<a${attr_class("rail-link svelte-qphds7", void 0, { "active-link": isActive(link.href) })}${attr("href", link.href)}>${escape_html(link.label)}</a>`);
    }
    $$renderer2.push(`<!--]--></div></section></aside> <main class="main-content svelte-qphds7"><div class="main-frame svelte-qphds7"><!--[-->`);
    slot($$renderer2, $$props, "default", {});
    $$renderer2.push(`<!--]--></div></main> <aside class="rail right-rail svelte-qphds7"${attr("data-open", rightRailOpen)}><div class="compact-rail-header svelte-qphds7"><h2>Project Activity &amp; Events</h2> <button class="close-rail svelte-qphds7" type="button">Close</button></div> <section class="rail-panel svelte-qphds7"><h2 class="svelte-qphds7">Project activity &amp; events</h2> <p class="section-subtitle svelte-qphds7">Production activity and event invites around your network, with the same quick join toggle on both.</p> <div class="snapshot-stack svelte-qphds7">`);
    if (bootstrap.activityRail.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="snapshot-row svelte-qphds7"><strong class="svelte-qphds7">No activity yet</strong> <span class="svelte-qphds7">Production updates and event invites will appear here once they are hydrated for your account.</span></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<!--[-->`);
      const each_array_3 = ensure_array_like(bootstrap.activityRail);
      for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
        let item = each_array_3[$$index_3];
        $$renderer2.push(`<div class="snapshot-row activity-row svelte-qphds7"><a class="activity-link svelte-qphds7"${attr("href", item.href)}><div class="activity-topline svelte-qphds7">`);
        SubjectTablet($$renderer2, {
          kind: item.kind,
          projectMode: item.projectMode ?? "productive"
        });
        $$renderer2.push(`<!----> <span class="snapshot-time svelte-qphds7">${escape_html(item.kind === "event" && item.timeLabel ? item.timeLabel : formatCalendarTime(item.createdAt))}</span></div> <strong class="svelte-qphds7">${escape_html(item.title)}</strong> <span class="svelte-qphds7">${escape_html(item.meta)}</span></a> <div class="event-footer svelte-qphds7"><span class="event-going svelte-qphds7">${escape_html(item.countLabel)}</span> <button${attr("aria-label", item.viewerIsParticipating ? `Leave ${item.title}` : `Join ${item.title}`)}${attr_class("attendance-button svelte-qphds7", void 0, { "attendance-state": item.viewerIsParticipating })}${attr("disabled", pendingSubjectId === item.subjectId, true)} type="button">${escape_html(item.viewerIsParticipating ? "Going" : "+")}</button></div></div>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></section></aside></div></div>`);
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
