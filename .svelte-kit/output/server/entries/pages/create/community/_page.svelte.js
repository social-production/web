import "clsx";
import { b as attr, e as escape_html } from "../../../../chunks/renderer.js";
import { C as CreateFlowLayout, a as CreatePanel } from "../../../../chunks/CreatePanel.js";
import { P as PreviewTile } from "../../../../chunks/PreviewTile.js";
function CreateCommunityPage($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let canSubmit;
    let name = "East Market Retrofit Circle";
    let openness = "Open";
    let description = "Residents, installers, and planners connecting retrofit work across the east side.";
    canSubmit = name.trim().length > 0 && description.trim().length > 0;
    CreateFlowLayout($$renderer2, {
      $$slots: {
        primary: ($$renderer3) => {
          {
            CreatePanel($$renderer3, {
              title: "Community setup",
              description: "Shape the public social space first, then refine norms and membership controls later.",
              children: ($$renderer4) => {
                $$renderer4.push(`<form class="form-stack svelte-t2mvne"><label><span class="field-label svelte-t2mvne">Community name</span> <input${attr("value", name)}/></label> <label><span class="field-label svelte-t2mvne">Openness</span> `);
                $$renderer4.select({ value: openness }, ($$renderer5) => {
                  $$renderer5.option({ value: "Open" }, ($$renderer6) => {
                    $$renderer6.push(`Open`);
                  });
                  $$renderer5.option({ value: "Private" }, ($$renderer6) => {
                    $$renderer6.push(`Private`);
                  });
                });
                $$renderer4.push(`</label> <label><span class="field-label svelte-t2mvne">Description</span> <textarea rows="4">`);
                const $$body = escape_html(description);
                if ($$body) {
                  $$renderer4.push(`${$$body}`);
                }
                $$renderer4.push(`</textarea></label> <div class="button-row"><button class="button-primary"${attr("disabled", !canSubmit, true)} type="submit">Create Community</button> <button class="button-ghost" type="button">Save Draft</button></div> `);
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
              description: "How the new community row will read in discovery.",
              surface: "transparent",
              children: ($$renderer4) => {
                PreviewTile($$renderer4, {
                  title: name,
                  body: description,
                  meta: `${openness} community`
                });
              },
              $$slots: { default: true }
            });
            $$renderer3.push(`<!----> `);
            CreatePanel($$renderer3, {
              title: "Discovery note",
              description: "What this surface is meant to do.",
              children: ($$renderer4) => {
                $$renderer4.push(`<p class="helper-text">Communities connect people to projects and thread discussion without forcing every topic into one shared channel feed.</p>`);
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
  CreateCommunityPage($$renderer);
}
export {
  _page as default
};
