import { e as escape_html, d as bind_props } from "./renderer.js";
function CountBadge($$renderer, $$props) {
  let count = $$props["count"];
  $$renderer.push(`<span class="count-badge svelte-13i1ukw">${escape_html(count)}</span>`);
  bind_props($$props, { count });
}
export {
  CountBadge as C
};
