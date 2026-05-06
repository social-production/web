import { c as attr_class, d as ensure_array_like, f as bind_props } from "../../chunks/renderer.js";
import { P as PublicFeedCard } from "../../chunks/PublicFeedCard.js";
function PublicFeed($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let visibleItems;
    let items = $$props["items"];
    let activeFilter = "all";
    let activeSort = "popular";
    let activeWindow = "all";
    function matchesFilter(item, filter) {
      {
        return true;
      }
    }
    function itemTimestamp(item) {
      return +new Date(item.lastActivityAt);
    }
    function matchesWindow(item, window, referenceTime) {
      {
        return true;
      }
    }
    function compareItems(left, right, sort) {
      {
        return right.voteCount - left.voteCount || itemTimestamp(right) - itemTimestamp(left);
      }
    }
    items.reduce((max, item) => Math.max(max, itemTimestamp(item)), 0);
    visibleItems = items.filter((item) => matchesFilter()).filter((item) => matchesWindow()).slice().sort((left, right) => compareItems(left, right));
    $$renderer2.push(`<section class="feed-page svelte-6b4p6v"><div class="header-block svelte-6b4p6v"><h1 class="svelte-6b4p6v">Public</h1> <p class="svelte-6b4p6v">Public keeps the shared network stream: tagged projects, threads, and open standalone events.</p> <div class="divider svelte-6b4p6v"></div></div> <div class="filters svelte-6b4p6v"><button${attr_class("filter svelte-6b4p6v", void 0, { "active": activeFilter === "all" })} type="button">All</button> <button${attr_class("filter svelte-6b4p6v", void 0, { "active": activeFilter === "projects" })} type="button">Projects</button> <button${attr_class("filter svelte-6b4p6v", void 0, { "active": activeFilter === "threads" })} type="button">Threads</button> <button${attr_class("filter svelte-6b4p6v", void 0, { "active": activeFilter === "events" })} type="button">Events</button></div> <div class="controls-row svelte-6b4p6v"><label class="control-field svelte-6b4p6v"><span class="svelte-6b4p6v">Sort by</span> `);
    $$renderer2.select({ value: activeSort }, ($$renderer3) => {
      $$renderer3.option({ value: "popular" }, ($$renderer4) => {
        $$renderer4.push(`Most popular`);
      });
      $$renderer3.option({ value: "recent" }, ($$renderer4) => {
        $$renderer4.push(`Most recent`);
      });
    });
    $$renderer2.push(`</label> <label class="control-field svelte-6b4p6v"><span class="svelte-6b4p6v">Window</span> `);
    $$renderer2.select({ value: activeWindow }, ($$renderer3) => {
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
    });
    $$renderer2.push(`</label></div> <div class="stack svelte-6b4p6v">`);
    if (visibleItems.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<section class="empty-card svelte-6b4p6v"><p class="svelte-6b4p6v">No public items match this filter yet.</p></section>`);
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
