import { s as slot, k as fallback, c as attr_class, e as escape_html, f as bind_props } from "./renderer.js";
function CreateFlowLayout($$renderer, $$props) {
  $$renderer.push(`<div class="flow-layout svelte-1a8n7xe"><div class="primary-column svelte-1a8n7xe"><!--[-->`);
  slot($$renderer, $$props, "primary", {});
  $$renderer.push(`<!--]--></div> <div class="secondary-column svelte-1a8n7xe"><!--[-->`);
  slot($$renderer, $$props, "secondary", {});
  $$renderer.push(`<!--]--></div></div>`);
}
function CreatePanel($$renderer, $$props) {
  let title = $$props["title"];
  let description = fallback($$props["description"], "");
  let surface = fallback($$props["surface"], "panel");
  $$renderer.push(`<section${attr_class("panel svelte-2t2t4u", void 0, { "transparent": surface === "transparent" })}><h2 class="svelte-2t2t4u">${escape_html(title)}</h2> `);
  if (description) {
    $$renderer.push("<!--[0-->");
    $$renderer.push(`<p class="description svelte-2t2t4u">${escape_html(description)}</p>`);
  } else {
    $$renderer.push("<!--[-1-->");
  }
  $$renderer.push(`<!--]--> <div class="body svelte-2t2t4u"><!--[-->`);
  slot($$renderer, $$props, "default", {});
  $$renderer.push(`<!--]--></div></section>`);
  bind_props($$props, { title, description, surface });
}
export {
  CreateFlowLayout as C,
  CreatePanel as a
};
