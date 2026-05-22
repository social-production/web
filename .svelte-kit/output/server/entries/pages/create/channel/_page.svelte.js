import "clsx";
import { c as attr, e as escape_html } from "../../../../chunks/renderer.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/root.js";
import "../../../../chunks/state.svelte.js";
import { C as CreateFlowLayout, a as CreatePanel } from "../../../../chunks/CreatePanel.js";
import { P as PreviewTile } from "../../../../chunks/PreviewTile.js";
import "../../../../chunks/data.js";
function CreateChannelPage($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let canSubmit;
    let name = "";
    let description = "";
    let isSubmitting = false;
    canSubmit = name.trim().length > 0 && description.trim().length > 0;
    CreateFlowLayout($$renderer2, {
      $$slots: {
        primary: ($$renderer3) => {
          {
            CreatePanel($$renderer3, {
              title: "Channel setup",
              description: "Define the topic surface first. Communities can overlap with it later without replacing it.",
              children: ($$renderer4) => {
                $$renderer4.push(`<form class="form-stack svelte-6ny3y"><label><span class="field-label svelte-6ny3y">Channel name</span> <input${attr("value", name)}/></label> <label><span class="field-label svelte-6ny3y">Description</span> <textarea rows="4">`);
                const $$body = escape_html(description);
                if ($$body) {
                  $$renderer4.push(`${$$body}`);
                }
                $$renderer4.push(`</textarea></label> <div class="button-row"><button class="button-primary"${attr("disabled", !canSubmit || isSubmitting, true)} type="submit">${escape_html("Create Channel")}</button> <button class="button-ghost" type="button">Save Draft</button></div> `);
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
              description: "How the new topic surface will appear in lists.",
              surface: "transparent",
              children: ($$renderer4) => {
                PreviewTile($$renderer4, {
                  title: name.trim() || "Untitled channel",
                  body: description.trim() || "Describe the topic this channel gathers without turning it into a social group.",
                  meta: "Topic channel"
                });
              },
              $$slots: { default: true }
            });
            $$renderer3.push(`<!----> `);
            CreatePanel($$renderer3, {
              title: "Discovery note",
              description: "What makes a channel different from a community.",
              children: ($$renderer4) => {
                $$renderer4.push(`<p class="helper-text">Channels stay topic-based. They gather related threads and project activity without defining who belongs together socially.</p>`);
              },
              $$slots: { default: true }
            });
            $$renderer3.push(`<!---->`);
          }
        }
      }
    });
  });
}
function _page($$renderer) {
  CreateChannelPage($$renderer);
}
export {
  _page as default
};
