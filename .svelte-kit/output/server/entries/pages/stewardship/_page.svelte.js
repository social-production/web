import { f as bind_props } from "../../../chunks/renderer.js";
import { S as ScopePage } from "../../../chunks/ScopePage.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    ScopePage($$renderer2, { scope: data.scope });
    bind_props($$props, { data });
  });
}
export {
  _page as default
};
