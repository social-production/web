import { d as bind_props } from "../../../chunks/renderer.js";
import { P as PlatformPage } from "../../../chunks/PlatformPage.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    PlatformPage($$renderer2, { scope: data.scope });
    bind_props($$props, { data });
  });
}
export {
  _page as default
};
