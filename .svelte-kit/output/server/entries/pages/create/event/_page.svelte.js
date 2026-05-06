import "clsx";
import { g as store_get, u as unsubscribe_stores, c as attr_class, b as attr, e as escape_html, d as ensure_array_like } from "../../../../chunks/renderer.js";
import { p as page } from "../../../../chunks/stores.js";
import { E as EventCard } from "../../../../chunks/EventCard.js";
import { C as CreateFlowLayout, a as CreatePanel } from "../../../../chunks/CreatePanel.js";
import { s as selectedTags, c as channelOptions, a as communityOptions } from "../../../../chunks/options.js";
function CreateEventPage($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let viewer, previewItem, canSubmit;
    let title = "Transit Fare Protest Rally";
    let description = "A one-off public rally with speakers, sign-making, and a short station march.";
    let timeLabel = "Apr 12, 1:00 PM";
    let locationLabel = "East Market Station Plaza";
    let isPrivate = false;
    let selectedChannelIds = ["mutual-aid"];
    let selectedCommunityIds = ["east-market-makers"];
    viewer = store_get($$store_subs ??= {}, "$page", page).data.bootstrap?.viewer ?? null;
    previewItem = viewer ? {
      kind: "event",
      id: "event-preview",
      slug: "event-preview",
      href: "#",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      title: title.trim() || "Untitled event",
      description: description.trim() || "Describe the one-off gathering, who it is for, and what should happen.",
      isPrivate,
      channelTags: selectedTags(selectedChannelIds, channelOptions, "channel"),
      communityTags: selectedTags(selectedCommunityIds, communityOptions, "community"),
      createdByUsername: viewer.username,
      timeLabel: timeLabel.trim() || "Time not set",
      locationLabel: locationLabel.trim() || "Location not set",
      voteCount: 0,
      activeVote: 0,
      commentCount: 0,
      goingCount: 1,
      lastActivityAt: (/* @__PURE__ */ new Date()).toISOString()
    } : null;
    canSubmit = title.trim().length > 0 && description.trim().length > 0 && timeLabel.trim().length > 0 && locationLabel.trim().length > 0;
    CreateFlowLayout($$renderer2, {
      $$slots: {
        primary: ($$renderer3) => {
          {
            CreatePanel($$renderer3, {
              title: "Event setup",
              description: "Choose whether the event lives on Public or Personal, add optional tags, and invite specific people directly when you need a tighter audience.",
              children: ($$renderer4) => {
                $$renderer4.push(`<form class="form-stack svelte-1bjugoy"><div><span class="field-label svelte-1bjugoy">Visibility</span> <div class="chip-row svelte-1bjugoy"><button type="button"${attr_class("toggle-chip", void 0, { "active": !isPrivate })}>Public</button> <button type="button"${attr_class("toggle-chip", void 0, { "active": isPrivate })}>Private</button></div></div> <label><span class="field-label svelte-1bjugoy">Event title</span> <input${attr("value", title)}/></label> <label><span class="field-label svelte-1bjugoy">Time label</span> <input${attr("value", timeLabel)}/></label> <label><span class="field-label svelte-1bjugoy">Location</span> <input${attr("value", locationLabel)}/></label> <label><span class="field-label svelte-1bjugoy">Description</span> <textarea rows="4">`);
                const $$body = escape_html(description);
                if ($$body) {
                  $$renderer4.push(`${$$body}`);
                }
                $$renderer4.push(`</textarea></label> <div><span class="field-label svelte-1bjugoy">Channel tags</span> <div class="chip-row wrap-row svelte-1bjugoy"><!--[-->`);
                const each_array = ensure_array_like(channelOptions);
                for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                  let option = each_array[$$index];
                  $$renderer4.push(`<button type="button"${attr_class("toggle-chip", void 0, { "active": selectedChannelIds.includes(option.slug) })}>${escape_html(option.label)}</button>`);
                }
                $$renderer4.push(`<!--]--></div></div> <div><span class="field-label svelte-1bjugoy">Community tags</span> <div class="chip-row wrap-row svelte-1bjugoy"><!--[-->`);
                const each_array_1 = ensure_array_like(communityOptions);
                for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
                  let option = each_array_1[$$index_1];
                  $$renderer4.push(`<button type="button"${attr_class("toggle-chip", void 0, { "active": selectedCommunityIds.includes(option.slug) })}>${escape_html(option.label)}</button>`);
                }
                $$renderer4.push(`<!--]--></div></div> `);
                {
                  $$renderer4.push("<!--[-1-->");
                }
                $$renderer4.push(`<!--]--> <div class="button-row"><button class="button-primary"${attr("disabled", !canSubmit, true)} type="submit">Create Event</button> <button class="button-ghost" type="button">Save Draft</button></div> `);
                {
                  $$renderer4.push("<!--[-1-->");
                }
                $$renderer4.push(`<!--]--></form>`);
              },
              $$slots: { default: true }
            });
          }
        },
        secondary: ($$renderer3) => {
          {
            CreatePanel($$renderer3, {
              title: "Live preview",
              description: "Shows how the event will appear in feeds and search.",
              surface: "transparent",
              children: ($$renderer4) => {
                if (previewItem) {
                  $$renderer4.push("<!--[0-->");
                  EventCard($$renderer4, { item: previewItem });
                } else {
                  $$renderer4.push("<!--[-1-->");
                }
                $$renderer4.push(`<!--]-->`);
              },
              $$slots: { default: true }
            });
            $$renderer3.push(`<!----> `);
            CreatePanel($$renderer3, {
              title: "Visibility rule",
              description: "How discovery works in this frontend slice.",
              children: ($$renderer4) => {
                $$renderer4.push(`<p class="helper-text">`);
                {
                  $$renderer4.push("<!--[-1-->");
                  $$renderer4.push(`Public events can be untagged or tagged. Tags help them appear inside channels, communities, and the broader Public feed.`);
                }
                $$renderer4.push(`<!--]--></p>`);
              },
              $$slots: { default: true }
            });
            $$renderer3.push(`<!---->`);
          }
        }
      }
    });
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function _page($$renderer) {
  CreateEventPage($$renderer);
}
export {
  _page as default
};
