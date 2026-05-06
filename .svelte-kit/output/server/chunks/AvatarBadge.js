import { k as fallback, c as attr_class, e as escape_html, f as bind_props } from "./renderer.js";
function AvatarBadge($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let initials;
    let username = $$props["username"];
    let size = fallback($$props["size"], "md");
    initials = username.replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase() || "SP";
    $$renderer2.push(`<span${attr_class("avatar-badge svelte-1310uqu", void 0, { "size-sm": size === "sm", "size-md": size === "md" })}>${escape_html(initials)}</span>`);
    bind_props($$props, { username, size });
  });
}
export {
  AvatarBadge as A
};
