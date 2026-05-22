import { d as bind_props } from "../../../../chunks/renderer.js";
import { D as DirectoryFeedLayout } from "../../../../chunks/DirectoryFeedLayout.js";
function CommunityLayout($$renderer, $$props) {
  let scope = $$props["scope"];
  DirectoryFeedLayout($$renderer, { pageData: scope });
  bind_props($$props, { scope });
}
function CommunityPage($$renderer, $$props) {
  let scope = $$props["scope"];
  CommunityLayout($$renderer, { scope });
  bind_props($$props, { scope });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    CommunityPage($$renderer2, { scope: data.scope });
    bind_props($$props, { data });
  });
}
export {
  _page as default
};
