import { e as escape_html, c as attr_class, d as ensure_array_like, f as bind_props } from "../../../../chunks/renderer.js";
import { P as PersonalFeedCard } from "../../../../chunks/PersonalFeedCard.js";
function ProfilePage($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let visibleFeed;
    let data = $$props["data"];
    let activeFilter = "all";
    let activePeopleList = null;
    let sortMode = "newest";
    function matchesFilter(item, filter) {
      {
        return true;
      }
    }
    visibleFeed = data.feed.filter((item) => matchesFilter()).slice().sort((left, right) => {
      return +new Date(right.createdAt) - +new Date(left.createdAt);
    });
    data.following;
    $$renderer2.push(`<section class="page svelte-ac6l9j"><section class="hero-card svelte-ac6l9j"><div class="hero-topline svelte-ac6l9j"><div><span class="eyebrow svelte-ac6l9j">Profile</span> <h1 class="svelte-ac6l9j">${escape_html(data.username)}</h1></div> <div class="stats-row svelte-ac6l9j"><button${attr_class("stat-chip svelte-ac6l9j", void 0, { "active": activePeopleList === "followers" })} type="button"><strong class="svelte-ac6l9j">${escape_html(data.followersCount)}</strong> <span class="svelte-ac6l9j">Followers</span></button> <button${attr_class("stat-chip svelte-ac6l9j", void 0, { "active": activePeopleList === "following" })} type="button"><strong class="svelte-ac6l9j">${escape_html(data.followingCount)}</strong> <span class="svelte-ac6l9j">Following</span></button></div></div> `);
    if (data.bio) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="svelte-ac6l9j">${escape_html(data.bio)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></section> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <section class="toolbar-card svelte-ac6l9j"><div class="toolbar-group svelte-ac6l9j"><button${attr_class("toolbar-button svelte-ac6l9j", void 0, { "active": activeFilter === "all" })} type="button">All</button> <button${attr_class("toolbar-button svelte-ac6l9j", void 0, { "active": activeFilter === "public" })} type="button">Public</button> <button${attr_class("toolbar-button svelte-ac6l9j", void 0, { "active": activeFilter === "personal" })} type="button">Personal</button></div> <div class="toolbar-group svelte-ac6l9j"><span class="toolbar-label svelte-ac6l9j">Sort</span> <button${attr_class("toolbar-button svelte-ac6l9j", void 0, { "active": sortMode === "newest" })} type="button">Newest</button> <button${attr_class("toolbar-button svelte-ac6l9j", void 0, { "active": sortMode === "top" })} type="button">Top</button></div></section> <section class="feed-stack svelte-ac6l9j">`);
    if (visibleFeed.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<section class="empty-card svelte-ac6l9j"><p class="svelte-ac6l9j">${escape_html("No activity matches this view yet.")}</p></section>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<!--[-->`);
      const each_array_1 = ensure_array_like(visibleFeed);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let item = each_array_1[$$index_1];
        PersonalFeedCard($$renderer2, { item });
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></section></section>`);
    bind_props($$props, { data });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    ProfilePage($$renderer2, { data: data.profile });
    bind_props($$props, { data });
  });
}
export {
  _page as default
};
