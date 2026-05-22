import { k as sanitize_slots, f as fallback, e as escape_html, h as slot, d as bind_props } from "./renderer.js";
function PageHeader($$renderer, $$props) {
  const $$slots = sanitize_slots($$props);
  let title = fallback($$props["title"], "");
  let description = fallback($$props["description"], "");
  $$renderer.push(`<header class="page-header svelte-1m2yo64"><div class="copy svelte-1m2yo64"><h1 class="svelte-1m2yo64">${escape_html(title)}</h1> `);
  if (description) {
    $$renderer.push("<!--[0-->");
    $$renderer.push(`<p class="svelte-1m2yo64">${escape_html(description)}</p>`);
  } else {
    $$renderer.push("<!--[-1-->");
  }
  $$renderer.push(`<!--]--></div> `);
  if ($$slots.actions) {
    $$renderer.push("<!--[0-->");
    $$renderer.push(`<div class="actions svelte-1m2yo64"><!--[-->`);
    slot($$renderer, $$props, "actions", {});
    $$renderer.push(`<!--]--></div>`);
  } else {
    $$renderer.push("<!--[-1-->");
  }
  $$renderer.push(`<!--]--></header>`);
  bind_props($$props, { title, description });
}
export {
  PageHeader as P
};
