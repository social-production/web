import { d as bind_props } from "./renderer.js";
import { D as DirectoryFeedLayout } from "./DirectoryFeedLayout.js";
function PlatformLayout($$renderer, $$props) {
  let scope = $$props["scope"];
  DirectoryFeedLayout($$renderer, { pageData: scope });
  bind_props($$props, { scope });
}
function PlatformPage($$renderer, $$props) {
  let scope = $$props["scope"];
  PlatformLayout($$renderer, { scope });
  bind_props($$props, { scope });
}
export {
  PlatformPage as P
};
