import { f as bind_props, c as attr_class, b as attr, e as escape_html, d as ensure_array_like } from "../../../chunks/renderer.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/root.js";
import "../../../chunks/state.svelte.js";
import { F as FeedSurface } from "../../../chunks/FeedSurface.js";
import { S as SubjectTablet } from "../../../chunks/SubjectTablet.js";
import { T as TagList } from "../../../chunks/TagList.js";
import { a as formatRelativeTime } from "../../../chunks/time.js";
import "../../../chunks/data.js";
function NotificationCard($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let item = $$props["item"];
    FeedSurface($$renderer2, {
      href: item.href,
      tone: item.surface === "personal" ? "personal" : "public",
      children: ($$renderer3) => {
        $$renderer3.push(`<div${attr_class("notification-card svelte-zrp4gc", void 0, { "unread": item.isUnread })}><div class="topline svelte-zrp4gc">`);
        if (item.surface === "personal") {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="identity-row svelte-zrp4gc"><div class="kind-row svelte-zrp4gc">`);
          if (item.isUnread) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<span class="unread-dot svelte-zrp4gc"></span>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--> `);
          if (item.actorUsername) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<a class="actor-link svelte-zrp4gc"${attr("href", `/profile/${item.actorUsername}`)}>${escape_html(item.actorUsername)}</a>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--> `);
          if (item.actionLabel) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<span class="action svelte-zrp4gc">- ${escape_html(item.actionLabel)}</span>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--> `);
          SubjectTablet($$renderer3, {
            kind: item.subjectKind,
            projectMode: item.projectMode ?? "productive"
          });
          $$renderer3.push(`<!----></div></div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
          $$renderer3.push(`<div class="kind-row svelte-zrp4gc">`);
          if (item.isUnread) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<span class="unread-dot svelte-zrp4gc"></span>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--> `);
          SubjectTablet($$renderer3, {
            kind: item.subjectKind,
            projectMode: item.projectMode ?? "productive"
          });
          $$renderer3.push(`<!----></div>`);
        }
        $$renderer3.push(`<!--]--> <div class="tag-stack svelte-zrp4gc">`);
        TagList($$renderer3, { tags: item.channelTags });
        $$renderer3.push(`<!----> `);
        TagList($$renderer3, { tags: item.communityTags });
        $$renderer3.push(`<!----></div></div> `);
        if (item.title) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<p class="title-text svelte-zrp4gc">${escape_html(item.title)}</p>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (item.body) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<p class="body svelte-zrp4gc">${escape_html(item.body)}</p>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> <div class="footer svelte-zrp4gc"><span class="time svelte-zrp4gc">${escape_html(formatRelativeTime(item.createdAt))}</span> `);
        if (item.isUnread) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<button class="mark-read svelte-zrp4gc" type="button">Mark read</button>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--></div></div>`);
      },
      $$slots: { default: true }
    });
    bind_props($$props, { item });
  });
}
function NotificationsPage($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    $$renderer2.push(`<section class="page svelte-17ebsfj"><section class="hero-card svelte-17ebsfj"><div class="hero-topline svelte-17ebsfj"><div><h1 class="svelte-17ebsfj">Notifications</h1> <p class="svelte-17ebsfj">Project activity and event invites now come from the shared mock state instead of page-local placeholders.</p></div> <button class="secondary-button svelte-17ebsfj" type="button">Mark all read</button></div></section> <div class="stack svelte-17ebsfj"><!--[-->`);
    const each_array = ensure_array_like(data.items);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let item = each_array[$$index];
      NotificationCard($$renderer2, { item });
    }
    $$renderer2.push(`<!--]--></div></section>`);
    bind_props($$props, { data });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    NotificationsPage($$renderer2, { data: data.notifications });
    bind_props($$props, { data });
  });
}
export {
  _page as default
};
