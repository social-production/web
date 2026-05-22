import { c as attr, e as escape_html, b as attr_class, a as ensure_array_like, d as bind_props } from "../../../../../../../chunks/renderer.js";
/* empty css                                                                                         */
import "@sveltejs/kit/internal";
import "../../../../../../../chunks/exports.js";
import "../../../../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../../../../chunks/root.js";
import "../../../../../../../chunks/state.svelte.js";
/* empty css                                                                  */
/* empty css                                                                    */
/* empty css                                                               */
/* empty css                                                                */
/* empty css                                                                  */
import "../../../../../../../chunks/data.js";
/* empty css                                                                    */
function AttachedAssetDetailPage($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let scope = $$props["scope"];
    let parentAsset = $$props["parentAsset"];
    let asset = $$props["asset"];
    let activeTab = "overview";
    [
      {
        title: "Stewardship projects",
        description: "These services keep the attached asset placed, maintained, and accountable under its parent land record.",
        projects: asset.managementProjects
      },
      {
        title: "Storage projects",
        description: "Storage services can hold this attached asset between active use windows while the home land record stays the root location.",
        projects: asset.storageProjects
      },
      {
        title: "Projects using this asset",
        description: "These seeded links show which current projects depend on this attached asset today.",
        projects: asset.linkedProjects
      }
    ].filter((section) => section.projects.length > 0);
    function unitTone(label) {
      const normalized = label.toLowerCase();
      if (normalized.includes("available")) {
        return "available";
      }
      if (normalized.includes("borrowed") || normalized.includes("reserved")) {
        return "in-use";
      }
      return "maintenance";
    }
    $$renderer2.push(`<section class="asset-detail-page svelte-c1w0or"><div class="back-links svelte-c1w0or"><a class="back-link svelte-c1w0or"${attr("href", `/platform/assets/${parentAsset.slug}`)}>Back to ${escape_html(parentAsset.title)}</a> <a class="back-link muted-link svelte-c1w0or" href="/platform/assets">Back to ${escape_html(scope.title)} assets</a></div> <div class="top-tab-row svelte-c1w0or" role="tablist" aria-label="Asset tabs"><button${attr_class("top-tab svelte-c1w0or", void 0, { "active-tab": activeTab === "overview" })} role="tab" type="button">Overview</button> <button${attr_class("top-tab svelte-c1w0or", void 0, { "active-tab": activeTab === "projects" })} role="tab" type="button">Projects</button> <button${attr_class("top-tab svelte-c1w0or", void 0, { "active-tab": activeTab === "history" })} role="tab" type="button">History</button></div> `);
    {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="overview-stack svelte-c1w0or"><section class="overview-card svelte-c1w0or"><h1 class="svelte-c1w0or">${escape_html(asset.title)}${escape_html(asset.quantityLabel ? ` ${asset.quantityLabel}` : "")}</h1> <p class="svelte-c1w0or">${escape_html(asset.summary)}</p> <div class="meta-stack svelte-c1w0or"><div class="meta-row svelte-c1w0or"><strong class="svelte-c1w0or">Location</strong> `);
      if (asset.currentLocationHref) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<a class="detail-link svelte-c1w0or"${attr("href", asset.currentLocationHref)}>${escape_html(asset.currentLocationLabel ?? asset.locationLabel)}</a>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<span class="svelte-c1w0or">${escape_html(asset.currentLocationLabel ?? asset.locationLabel)}</span>`);
      }
      $$renderer2.push(`<!--]--></div> `);
      if (asset.currentBorrowerLabel) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="meta-row svelte-c1w0or"><strong class="svelte-c1w0or">Borrowed by</strong> <a class="detail-link svelte-c1w0or"${attr("href", `/profile/${asset.currentBorrowerLabel}`)}>${escape_html(asset.currentBorrowerLabel)}</a></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> `);
      if (asset.containedUnits && asset.containedUnits.length > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<section class="unit-section svelte-c1w0or"><div class="unit-heading svelte-c1w0or"><h2 class="svelte-c1w0or">Contained units</h2> <p class="svelte-c1w0or">${escape_html(asset.availableQuantity ?? asset.containedUnits.length)} of ${escape_html(asset.totalQuantity ?? asset.containedUnits.length)} available</p></div> <ul class="unit-list svelte-c1w0or"><!--[-->`);
        const each_array = ensure_array_like(asset.containedUnits);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let unit = each_array[$$index];
          $$renderer2.push(`<li class="unit-row svelte-c1w0or"><div class="unit-copy svelte-c1w0or"><strong class="svelte-c1w0or">${escape_html(unit.label)}</strong> <span class="svelte-c1w0or">${escape_html(unit.locationLabel)}</span> <span class="svelte-c1w0or">${escape_html(unit.summary)}</span> `);
          if (unit.currentBorrowerLabel) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<a class="detail-link svelte-c1w0or"${attr("href", `/profile/${unit.currentBorrowerLabel}`)}>Borrowed by ${escape_html(unit.currentBorrowerLabel)}</a>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></div> <span${attr_class(`unit-status ${unitTone(unit.statusLabel)}`, "svelte-c1w0or")}>${escape_html(unit.statusLabel)}</span></li>`);
        }
        $$renderer2.push(`<!--]--></ul></section>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></section></div>`);
    }
    $$renderer2.push(`<!--]--></section>`);
    bind_props($$props, { scope, parentAsset, asset });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    AttachedAssetDetailPage($$renderer2, {
      scope: data.scope,
      parentAsset: data.parentAsset,
      asset: data.asset
    });
    bind_props($$props, { data });
  });
}
export {
  _page as default
};
