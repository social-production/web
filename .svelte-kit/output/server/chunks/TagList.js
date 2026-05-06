import { k as fallback, c as attr_class, a as attr_style, d as ensure_array_like, f as bind_props } from "./renderer.js";
import { T as Tablet } from "./SubjectTablet.js";
function TagList($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let tags = fallback($$props["tags"], () => [], true);
    let columns = fallback($$props["columns"], null);
    function variantFor(tag) {
      if (tag.kind === "community") {
        return "community";
      }
      return tag.slug === "stewardship" ? "stewardship" : "channel";
    }
    if (tags.length > 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div${attr_class("tag-list svelte-akog2a", void 0, { "grid-layout": !!columns })}${attr_style("", { "--tag-columns": columns ? `${columns}` : void 0 })}><!--[-->`);
      const each_array = ensure_array_like(tags);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let tag = each_array[$$index];
        Tablet($$renderer2, { label: tag.label, variant: variantFor(tag) });
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { tags, columns });
  });
}
export {
  TagList as T
};
