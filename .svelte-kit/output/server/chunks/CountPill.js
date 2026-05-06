import { e as escape_html, f as bind_props } from "./renderer.js";
function CountPill($$renderer, $$props) {
  let label = $$props["label"];
  $$renderer.push(`<span class="pill svelte-12f0d6y">${escape_html(label)}</span>`);
  bind_props($$props, { label });
}
export {
  CountPill as C
};
