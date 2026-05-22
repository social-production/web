import { e as escape_html, b as attr_class, d as bind_props } from "../../../../../chunks/renderer.js";
/* empty css                                                                                   */
import "@sveltejs/kit/internal";
import "../../../../../chunks/exports.js";
import "../../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../../chunks/root.js";
import "../../../../../chunks/state.svelte.js";
/* empty css                                                            */
/* empty css                                                              */
/* empty css                                                         */
/* empty css                                                          */
/* empty css                                                            */
import "../../../../../chunks/data.js";
/* empty css                                                              */
function AssetDetailPage($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let scope = $$props["scope"];
    let asset = $$props["asset"];
    let activeTab = "overview";
    [
      {
        title: "Land management collective service",
        description: "Every land asset stays attached to collective land stewardship work.",
        projects: asset.managementProjects
      },
      {
        title: "Storage collective services on this land",
        description: "Storage services can stack on the same land while staying distinct from stewardship.",
        projects: asset.storageProjects
      },
      {
        title: "Other projects using this land",
        description: "Projects can reference the land record even before the live asset registry opens.",
        projects: asset.linkedProjects
      }
    ];
    $$renderer2.push(`<section class="asset-detail-page svelte-kdz1nb"><a class="back-link svelte-kdz1nb" href="/platform/assets">Back to ${escape_html(scope.title)} assets</a> <div class="top-tab-row svelte-kdz1nb" role="tablist" aria-label="Land asset tabs"><button${attr_class("top-tab svelte-kdz1nb", void 0, { "active-tab": activeTab === "overview" })} role="tab" type="button">Overview</button> <button${attr_class("top-tab svelte-kdz1nb", void 0, { "active-tab": activeTab === "projects" })} role="tab" type="button">Projects</button> <button${attr_class("top-tab svelte-kdz1nb", void 0, { "active-tab": activeTab === "inventory" })} role="tab" type="button">Inventory</button> <button${attr_class("top-tab svelte-kdz1nb", void 0, { "active-tab": activeTab === "history" })} role="tab" type="button">History</button></div> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<section class="overview-card svelte-kdz1nb"><h1 class="svelte-kdz1nb">${escape_html(asset.title)}</h1> <p class="svelte-kdz1nb">${escape_html(asset.stewardshipNote)}</p> <div class="meta-stack svelte-kdz1nb"><div class="meta-row svelte-kdz1nb"><strong class="svelte-kdz1nb">Location</strong> <span class="svelte-kdz1nb">${escape_html(asset.locationLabel)}</span></div> <div class="meta-row svelte-kdz1nb"><strong class="svelte-kdz1nb">Size</strong> <span class="svelte-kdz1nb">${escape_html(asset.acreageLabel)}</span></div></div></section>`);
    }
    $$renderer2.push(`<!--]--></section>`);
    bind_props($$props, { scope, asset });
  });
}
function LandAssetDetailPage($$renderer, $$props) {
  let scope = $$props["scope"];
  let asset = $$props["asset"];
  AssetDetailPage($$renderer, { scope, asset });
  bind_props($$props, { scope, asset });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    LandAssetDetailPage($$renderer2, { scope: data.scope, asset: data.asset });
    bind_props($$props, { data });
  });
}
export {
  _page as default
};
