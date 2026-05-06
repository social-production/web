import "clsx";
import { g as store_get, u as unsubscribe_stores, b as attr, e as escape_html, d as ensure_array_like } from "../../../../chunks/renderer.js";
import { p as page } from "../../../../chunks/stores.js";
import { T as ThreadCard } from "../../../../chunks/ThreadCard.js";
import { C as CreateFlowLayout, a as CreatePanel } from "../../../../chunks/CreatePanel.js";
import { b as splitCommaValues, m as makeTagRef, a as communityOptions } from "../../../../chunks/options.js";
function CreateThreadPage($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let viewer, previewItem, canSubmit;
    let title = "How should we coordinate first-round retrofit walkthroughs?";
    let body = "Looking for a discussion space that stays separate from the project logistics view so people can compare options without cluttering the project page.";
    let primaryTagType = "Channel";
    let primaryTagValue = "Housing & Build";
    let additionalChannels = "";
    let taggedCommunities = "";
    viewer = store_get($$store_subs ??= {}, "$page", page).data.bootstrap?.viewer ?? null;
    previewItem = viewer ? {
      kind: "thread",
      id: "thread-preview",
      slug: "thread-preview",
      href: "#",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      title: title.trim() || "Untitled thread",
      body: body.trim() || "Describe the question or comparison you want people to discuss.",
      authorUsername: viewer.username,
      channelTags: [
        ...primaryTagValue.trim() ? [makeTagRef(primaryTagValue.trim(), "channel")] : [],
        ...splitCommaValues(additionalChannels).map((value) => makeTagRef(value, "channel"))
      ],
      communityTags: [
        ...[],
        ...splitCommaValues(taggedCommunities).map((value) => makeTagRef(value, "community"))
      ],
      voteCount: 0,
      activeVote: 0,
      commentCount: 0,
      lastActivityAt: (/* @__PURE__ */ new Date()).toISOString()
    } : null;
    canSubmit = title.trim().length > 0 && primaryTagValue.trim().length > 0;
    CreateFlowLayout($$renderer2, {
      $$slots: {
        primary: ($$renderer3) => {
          {
            CreatePanel($$renderer3, {
              title: "Thread setup",
              description: "Start the discussion, choose a primary discovery tag, and add optional tags for wider reach.",
              children: ($$renderer4) => {
                $$renderer4.push(`<form class="form-stack svelte-cf76oo"><label><span class="field-label svelte-cf76oo">Thread title</span> <input${attr("value", title)}/></label> <label><span class="field-label svelte-cf76oo">Primary tag type</span> `);
                $$renderer4.select({ value: primaryTagType }, ($$renderer5) => {
                  $$renderer5.option({ value: "Channel" }, ($$renderer6) => {
                    $$renderer6.push(`Channel`);
                  });
                  $$renderer5.option({ value: "Community" }, ($$renderer6) => {
                    $$renderer6.push(`Community`);
                  });
                });
                $$renderer4.push(`</label> <label><span class="field-label svelte-cf76oo">${escape_html("Primary channel tag")}</span> <input${attr("value", primaryTagValue)}${attr("list", "thread-channels")}/> <datalist id="thread-channels"><!--[-->`);
                const each_array = ensure_array_like(["Housing & Build", "Mutual Aid", "Energy Retrofit"]);
                for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                  let option = each_array[$$index];
                  $$renderer4.option({ value: option }, ($$renderer5) => {
                  });
                }
                $$renderer4.push(`<!--]--></datalist> <datalist id="thread-communities"><!--[-->`);
                const each_array_1 = ensure_array_like(communityOptions);
                for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
                  let option = each_array_1[$$index_1];
                  $$renderer4.option({ value: option.label }, ($$renderer5) => {
                  });
                }
                $$renderer4.push(`<!--]--></datalist></label> <label><span class="field-label svelte-cf76oo">Additional channel tags</span> <input${attr("value", additionalChannels)} placeholder="Comma-separated"/></label> <label><span class="field-label svelte-cf76oo">Community tags</span> <input${attr("value", taggedCommunities)} placeholder="Comma-separated"/></label> <label><span class="field-label svelte-cf76oo">Opening post</span> <textarea rows="5">`);
                const $$body = escape_html(body);
                if ($$body) {
                  $$renderer4.push(`${$$body}`);
                }
                $$renderer4.push(`</textarea></label> <div class="button-row"><button class="button-primary"${attr("disabled", !canSubmit, true)} type="submit">Create Thread</button> <button class="button-ghost" type="button">Save Draft</button></div> `);
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
              description: "Threads now sit on the same surface as the feed background.",
              surface: "transparent",
              children: ($$renderer4) => {
                if (previewItem) {
                  $$renderer4.push("<!--[0-->");
                  ThreadCard($$renderer4, { item: previewItem });
                } else {
                  $$renderer4.push("<!--[-1-->");
                }
                $$renderer4.push(`<!--]-->`);
              },
              $$slots: { default: true }
            });
            $$renderer3.push(`<!----> `);
            CreatePanel($$renderer3, {
              title: "Discussion note",
              description: "How the tag choice affects discovery.",
              children: ($$renderer4) => {
                $$renderer4.push(`<p class="helper-text">Threads keep lightweight public discussion and idea comparison outside the project logistics view.</p>`);
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
  CreateThreadPage($$renderer);
}
export {
  _page as default
};
