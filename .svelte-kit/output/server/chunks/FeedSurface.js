import { k as fallback, c as attr_class, b as attr, s as slot, f as bind_props } from "./renderer.js";
function FeedSurface($$renderer, $$props) {
  let tone = fallback($$props["tone"], "public");
  let href = fallback($$props["href"], null);
  $$renderer.push(`<article${attr_class("surface svelte-qgu37f", void 0, {
    "tone-public": tone === "public",
    "tone-personal": tone === "personal",
    "clickable": !!href
  })}>`);
  if (href) {
    $$renderer.push("<!--[0-->");
    $$renderer.push(`<a aria-label="Open item" class="surface-link svelte-qgu37f"${attr("href", href)}></a>`);
  } else {
    $$renderer.push("<!--[-1-->");
  }
  $$renderer.push(`<!--]--> <div class="content svelte-qgu37f"><!--[-->`);
  slot($$renderer, $$props, "default", {});
  $$renderer.push(`<!--]--></div></article>`);
  bind_props($$props, { tone, href });
}
export {
  FeedSurface as F
};
