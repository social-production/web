import { f as fallback, b as attr_class, a as ensure_array_like, c as attr, e as escape_html, d as bind_props } from "./renderer.js";
function LinkedPostBody($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let segments;
    let body = fallback($$props["body"], "");
    let links = fallback($$props["links"], () => [], true);
    let variant = fallback($$props["variant"], "feed");
    function buildSegments(text, rawLinks) {
      const normalizedLinks = rawLinks.filter((link) => link.label.trim().length > 0).sort((left, right) => right.label.length - left.label.length);
      if (normalizedLinks.length === 0) {
        return [{ kind: "text", value: text }];
      }
      const lowerText = text.toLowerCase();
      const segments2 = [];
      let cursor = 0;
      while (cursor < text.length) {
        let nextMatch = null;
        for (const link of normalizedLinks) {
          const index = lowerText.indexOf(link.label.toLowerCase(), cursor);
          if (index === -1) {
            continue;
          }
          if (!nextMatch || index < nextMatch.index || index === nextMatch.index && link.label.length > nextMatch.link.label.length) {
            nextMatch = { index, link };
          }
        }
        if (!nextMatch) {
          segments2.push({ kind: "text", value: text.slice(cursor) });
          break;
        }
        if (nextMatch.index > cursor) {
          segments2.push({ kind: "text", value: text.slice(cursor, nextMatch.index) });
        }
        segments2.push({
          kind: "link",
          value: text.slice(nextMatch.index, nextMatch.index + nextMatch.link.label.length),
          href: nextMatch.link.href
        });
        cursor = nextMatch.index + nextMatch.link.label.length;
      }
      return segments2.length > 0 ? segments2 : [{ kind: "text", value: text }];
    }
    segments = buildSegments(body, links);
    $$renderer2.push(`<p${attr_class("linked-body svelte-gmcr9x", void 0, { "detail": variant === "detail", "feed": variant === "feed" })}><!--[-->`);
    const each_array = ensure_array_like(segments);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let segment = each_array[$$index];
      if (segment.kind === "link") {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<a class="linked-subject svelte-gmcr9x"${attr("href", segment.href)}>${escape_html(segment.value)}</a>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`${escape_html(segment.value)}`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></p>`);
    bind_props($$props, { body, links, variant });
  });
}
export {
  LinkedPostBody as L
};
