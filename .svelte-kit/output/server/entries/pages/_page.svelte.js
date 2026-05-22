import { s as store_get, e as escape_html, a as ensure_array_like, u as unsubscribe_stores, d as bind_props } from "../../chunks/renderer.js";
import { p as page } from "../../chunks/stores.js";
import { P as PageHeader } from "../../chunks/PageHeader.js";
import { P as PublicFeedCard } from "../../chunks/PublicFeedCard.js";
import "../../chunks/data.js";
function PublicFeed($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let viewerId, followedChannelSlugs, followedCommunitySlugs, viewerHasPlatformMembership, referenceTime, visibleItems;
    let items = $$props["items"];
    const defaultPreferences = { scope: "home", filter: "all", sort: "popular", window: "all" };
    let activeScope = defaultPreferences.scope;
    let activeFilter = defaultPreferences.filter;
    let activeSort = defaultPreferences.sort;
    let activeWindow = defaultPreferences.window;
    let lastHydratedViewerId = "";
    preferenceSignature(defaultPreferences);
    function preferenceSignature(preferences) {
      return [
        preferences.scope,
        preferences.filter,
        preferences.sort,
        preferences.window
      ].join(":");
    }
    function applyPreferences(preferences) {
      const next = { ...defaultPreferences, ...preferences ?? {} };
      activeScope = next.scope;
      activeFilter = next.filter;
      activeSort = next.sort;
      activeWindow = next.window;
      preferenceSignature(next);
    }
    function matchesScope(item, scope, followedChannelSlugs2, followedCommunitySlugs2, viewerHasPlatformMembership2) {
      if (scope === "global") {
        return true;
      }
      return item.channelTags.some((tag) => tag.slug === "platform" ? viewerHasPlatformMembership2 : followedChannelSlugs2.has(tag.slug)) || item.communityTags.some((tag) => followedCommunitySlugs2.has(tag.slug));
    }
    function slugSet(links) {
      return new Set((links ?? []).map((link) => link.slug));
    }
    function matchesFilter(item, filter) {
      if (filter === "all") {
        return true;
      }
      if (filter === "projects") {
        return item.kind === "project";
      }
      if (filter === "threads") {
        return item.kind === "thread";
      }
      return item.kind === "event";
    }
    function itemTimestamp(item) {
      return +new Date(item.lastActivityAt);
    }
    function timeWindowMs(window) {
      switch (window) {
        case "12h":
          return 12 * 60 * 60 * 1e3;
        case "1d":
          return 24 * 60 * 60 * 1e3;
        case "7d":
          return 7 * 24 * 60 * 60 * 1e3;
        case "1m":
          return 30 * 24 * 60 * 60 * 1e3;
        case "1y":
          return 365 * 24 * 60 * 60 * 1e3;
        default:
          return Number.POSITIVE_INFINITY;
      }
    }
    function matchesWindow(item, window, referenceTime2) {
      if (window === "all") {
        return true;
      }
      return referenceTime2 - itemTimestamp(item) <= timeWindowMs(window);
    }
    function compareItems(left, right, sort) {
      if (sort === "popular") {
        return right.voteCount - left.voteCount || itemTimestamp(right) - itemTimestamp(left);
      }
      return itemTimestamp(right) - itemTimestamp(left);
    }
    viewerId = store_get($$store_subs ??= {}, "$page", page).data.bootstrap?.viewer?.id ?? "";
    if (viewerId !== lastHydratedViewerId) {
      lastHydratedViewerId = viewerId;
      applyPreferences(store_get($$store_subs ??= {}, "$page", page).data.settings?.publicFeedPreferences);
    }
    followedChannelSlugs = slugSet(store_get($$store_subs ??= {}, "$page", page).data.bootstrap?.directory.channels);
    followedCommunitySlugs = slugSet(store_get($$store_subs ??= {}, "$page", page).data.bootstrap?.directory.communities);
    viewerHasPlatformMembership = !!store_get($$store_subs ??= {}, "$page", page).data.bootstrap?.directory.platform;
    if (!store_get($$store_subs ??= {}, "$page", page).data.bootstrap?.viewer && activeScope === "home") {
      activeScope = "global";
    }
    referenceTime = Date.now();
    visibleItems = items.filter((item) => matchesScope(item, activeScope, followedChannelSlugs, followedCommunitySlugs, viewerHasPlatformMembership)).filter((item) => matchesFilter(item, activeFilter)).filter((item) => matchesWindow(item, activeWindow, referenceTime)).slice().sort((left, right) => compareItems(left, right, activeSort));
    $$renderer2.push(`<section class="feed-page svelte-6b4p6v">`);
    PageHeader($$renderer2, {
      title: "Public",
      description: "Public keeps the shared network stream: tagged projects, threads, and open standalone events."
    });
    $$renderer2.push(`<!----> <section class="toolbar-card svelte-6b4p6v"><div class="controls-row svelte-6b4p6v">`);
    $$renderer2.select(
      {
        "aria-label": "Choose public feed scope",
        value: activeScope,
        class: ""
      },
      ($$renderer3) => {
        $$renderer3.option({ value: "home" }, ($$renderer4) => {
          $$renderer4.push(`Home`);
        });
        $$renderer3.option({ value: "global" }, ($$renderer4) => {
          $$renderer4.push(`Global`);
        });
      },
      "svelte-6b4p6v"
    );
    $$renderer2.push(` `);
    $$renderer2.select(
      {
        "aria-label": "Filter public feed",
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
      "svelte-6b4p6v"
    );
    $$renderer2.push(` `);
    $$renderer2.select(
      {
        "aria-label": "Sort public feed by",
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
      "svelte-6b4p6v"
    );
    $$renderer2.push(` `);
    $$renderer2.select(
      {
        "aria-label": "Public feed time window",
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
      "svelte-6b4p6v"
    );
    $$renderer2.push(`</div></section> <div class="stack svelte-6b4p6v">`);
    if (visibleItems.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<section class="empty-card svelte-6b4p6v"><p class="svelte-6b4p6v">${escape_html(activeScope === "home" ? "No items from your followed channels, communities, or platform membership match this filter yet." : "No public items match this filter yet.")}</p></section>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<!--[-->`);
      const each_array = ensure_array_like(visibleItems);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let item = each_array[$$index];
        PublicFeedCard($$renderer2, { item });
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></section>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
    bind_props($$props, { items });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    PublicFeed($$renderer2, { items: data.items });
    bind_props($$props, { data });
  });
}
export {
  _page as default
};
