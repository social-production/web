import "clsx";
import { g as store_get, u as unsubscribe_stores, e as escape_html, b as attr } from "../../../../chunks/renderer.js";
import { p as page } from "../../../../chunks/stores.js";
import { P as PersonalPostCard } from "../../../../chunks/PersonalPostCard.js";
import { C as CreateFlowLayout, a as CreatePanel } from "../../../../chunks/CreatePanel.js";
function CreatePostPage($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let viewer, previewItem, canSubmit;
    let body = "Use this space for direct personal posting that should not start inside Public.";
    viewer = store_get($$store_subs ??= {}, "$page", page).data.bootstrap?.viewer ?? null;
    previewItem = viewer ? {
      kind: "post",
      id: "post-preview",
      href: "#",
      author: viewer,
      audience: "followers",
      voteTargetId: "post-preview",
      body: body.trim() || "Share a direct post to your personal timeline...",
      voteCount: 0,
      activeVote: 0,
      commentCount: 0,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    } : null;
    canSubmit = body.trim().length > 0;
    CreateFlowLayout($$renderer2, {
      $$slots: {
        primary: ($$renderer3) => {
          {
            CreatePanel($$renderer3, {
              title: "Post To Personal",
              description: "Text posts live here directly. Image posts can layer in later without changing the Personal/Public split.",
              children: ($$renderer4) => {
                $$renderer4.push(`<form class="form-stack svelte-1c991i0"><label><span class="field-label svelte-1c991i0">Post body</span> <textarea rows="8" placeholder="Share a direct post to your personal timeline...">`);
                const $$body = escape_html(body);
                if ($$body) {
                  $$renderer4.push(`${$$body}`);
                }
                $$renderer4.push(`</textarea></label> <div class="button-row"><button class="button-primary"${attr("disabled", !canSubmit, true)} type="submit">Post</button> <button class="button-ghost" type="button">Save Draft</button></div> `);
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
              description: "Shows how the new post will read in Personal.",
              surface: "transparent",
              children: ($$renderer4) => {
                if (previewItem) {
                  $$renderer4.push("<!--[0-->");
                  PersonalPostCard($$renderer4, { item: previewItem });
                } else {
                  $$renderer4.push("<!--[-1-->");
                }
                $$renderer4.push(`<!--]-->`);
              },
              $$slots: { default: true }
            });
            $$renderer3.push(`<!----> `);
            CreatePanel($$renderer3, {
              title: "Personal rule",
              description: "Why this surface stays separate.",
              children: ($$renderer4) => {
                $$renderer4.push(`<p class="helper-text">Personal follows people instead of tags. Direct posts belong here first instead of being forced into the Public stream.</p>`);
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
  CreatePostPage($$renderer);
}
export {
  _page as default
};
