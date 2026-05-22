import { s as store_get, e as escape_html, a as ensure_array_like, u as unsubscribe_stores, d as bind_props } from "../../../chunks/renderer.js";
import { p as page } from "../../../chunks/stores.js";
import { P as PageHeader } from "../../../chunks/PageHeader.js";
import { P as PersonalFeedCard } from "../../../chunks/PersonalFeedCard.js";
import "../../../chunks/data.js";
function PersonalFeed($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let viewerId, referenceTime, visibleItems;
    let items = $$props["items"];
    const defaultPreferences = {
      scope: "following",
      filter: "all",
      sort: "popular",
      window: "all"
    };
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
    function matchesScope(item, scope) {
      if (scope === "following") {
        return item.feedSource !== "discovery";
      }
      return item.kind === "activity" ? item.feedSource !== "discovery" : true;
    }
    function matchesFilter(item, filter) {
      if (filter === "all") {
        return true;
      }
      if (filter === "activity") {
        return item.kind === "activity";
      }
      if (filter === "posts") {
        return item.kind === "post";
      }
      return item.kind === "activity" && item.subjectKind === "event";
    }
    function itemTimestamp(item) {
      return +new Date(item.createdAt);
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
      applyPreferences(store_get($$store_subs ??= {}, "$page", page).data.settings?.personalFeedPreferences);
    }
    referenceTime = Date.now();
    visibleItems = items.filter((item) => matchesScope(item, activeScope)).filter((item) => matchesFilter(item, activeFilter)).filter((item) => matchesWindow(item, activeWindow, referenceTime)).slice().sort((left, right) => compareItems(left, right, activeSort));
    $$renderer2.push(`<section class="feed-page svelte-1u8r7zn">`);
    PageHeader($$renderer2, {
      title: "Personal",
      description: "This timeline follows people instead of tags. Use it for direct social posting and followed-user public activity."
    });
    $$renderer2.push(`<!----> <section class="toolbar-card svelte-1u8r7zn"><div class="controls-row svelte-1u8r7zn">`);
    $$renderer2.select(
      {
        "aria-label": "Choose personal feed scope",
        value: activeScope,
        class: ""
      },
      ($$renderer3) => {
        $$renderer3.option({ value: "following" }, ($$renderer4) => {
          $$renderer4.push(`Following only`);
        });
        $$renderer3.option({ value: "popular" }, ($$renderer4) => {
          $$renderer4.push(`Following + popular`);
        });
      },
      "svelte-1u8r7zn"
    );
    $$renderer2.push(` `);
    $$renderer2.select(
      {
        "aria-label": "Filter personal feed",
        value: activeFilter,
        class: ""
      },
      ($$renderer3) => {
        $$renderer3.option({ value: "all" }, ($$renderer4) => {
          $$renderer4.push(`All items`);
        });
        $$renderer3.option({ value: "activity" }, ($$renderer4) => {
          $$renderer4.push(`Public activity`);
        });
        $$renderer3.option({ value: "posts" }, ($$renderer4) => {
          $$renderer4.push(`Posts`);
        });
        $$renderer3.option({ value: "events" }, ($$renderer4) => {
          $$renderer4.push(`Events`);
        });
      },
      "svelte-1u8r7zn"
    );
    $$renderer2.push(` `);
    $$renderer2.select(
      {
        "aria-label": "Sort personal feed by",
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
      "svelte-1u8r7zn"
    );
    $$renderer2.push(` `);
    $$renderer2.select(
      {
        "aria-label": "Personal feed time window",
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
      "svelte-1u8r7zn"
    );
    $$renderer2.push(`</div></section> <div class="stack svelte-1u8r7zn">`);
    if (visibleItems.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<section class="empty-card svelte-1u8r7zn"><p class="svelte-1u8r7zn">${escape_html(activeScope === "following" ? "No posts or activity from people you follow match this filter yet." : "No followed activity or popular public posts match this filter yet.")}</p></section>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<!--[-->`);
      const each_array = ensure_array_like(visibleItems);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let item = each_array[$$index];
        PersonalFeedCard($$renderer2, { item });
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
    PersonalFeed($$renderer2, { items: data.items });
    bind_props($$props, { data });
  });
}
export {
  _page as default
};
