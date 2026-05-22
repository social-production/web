import { f as fallback, b as attr_class, e as escape_html, a as ensure_array_like, c as attr, d as bind_props } from "../../../../chunks/renderer.js";
/* empty css                                                           */
function LandAssetsTab($$renderer, $$props) {
  let landAssets = $$props["landAssets"];
  let featureOpen = fallback($$props["featureOpen"], false);
  $$renderer.push(`<section class="asset-stack svelte-1pchtxk"><div class="intro-row svelte-1pchtxk"><h2 class="svelte-1pchtxk">Land assets</h2> <span${attr_class(`status-pill ${featureOpen ? "open" : "closed"}`, "svelte-1pchtxk")}>${escape_html(featureOpen ? "Open" : "Closed preview")}</span></div> <ul class="asset-list svelte-1pchtxk"><!--[-->`);
  const each_array = ensure_array_like(landAssets);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let asset = each_array[$$index];
    $$renderer.push(`<li class="asset-item svelte-1pchtxk"><a class="asset-link svelte-1pchtxk"${attr("href", `/platform/assets/${asset.slug}`)}><span class="asset-title svelte-1pchtxk">${escape_html(asset.title)}</span> <span class="asset-meta svelte-1pchtxk">${escape_html(asset.acreageLabel)}</span> <span class="asset-meta svelte-1pchtxk">${escape_html(asset.locationLabel)}</span></a></li>`);
  }
  $$renderer.push(`<!--]--></ul></section>`);
  bind_props($$props, { landAssets, featureOpen });
}
function AssetsLayout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let scope = $$props["scope"];
    let assets = $$props["assets"];
    let activeTab = "land";
    $$renderer2.push(`<section class="assets-page svelte-dj0qti"><div class="header-card svelte-dj0qti"><div class="header-topline svelte-dj0qti"><h1 class="svelte-dj0qti">${escape_html(scope.title)} assets</h1> <span${attr_class(`status-pill ${assets.featureOpen ? "open" : "closed"}`, "svelte-dj0qti")}>${escape_html(assets.featureOpen ? "Open" : "Closed preview")}</span></div> <div class="header-copy svelte-dj0qti"><p class="svelte-dj0qti">${escape_html(assets.intro)}</p></div></div> <div class="top-tab-row svelte-dj0qti" role="tablist" aria-label="Assets tabs"><button${attr_class("top-tab svelte-dj0qti", void 0, { "active-tab": activeTab === "land" })} role="tab" type="button">Land Assets</button> <button${attr_class("top-tab svelte-dj0qti", void 0, { "active-tab": activeTab === "funds" })} role="tab" type="button">Collective Funds</button></div> `);
    {
      $$renderer2.push("<!--[0-->");
      LandAssetsTab($$renderer2, {
        landAssets: assets.landAssets,
        featureOpen: assets.featureOpen
      });
    }
    $$renderer2.push(`<!--]--></section>`);
    bind_props($$props, { scope, assets });
  });
}
function AssetsPage($$renderer, $$props) {
  let scope = $$props["scope"];
  let assets = $$props["assets"];
  AssetsLayout($$renderer, { scope, assets });
  bind_props($$props, { scope, assets });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    AssetsPage($$renderer2, { scope: data.scope, assets: data.assets });
    bind_props($$props, { data });
  });
}
export {
  _page as default
};
