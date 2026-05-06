import { k as fallback, b as attr, c as attr_class, e as escape_html, f as bind_props } from "./renderer.js";
import { a as formatRelativeTime } from "./time.js";
function DetailUpdateCard($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let isHighlighted;
    let update = $$props["update"];
    let highlightedUpdateId = fallback($$props["highlightedUpdateId"], null);
    isHighlighted = highlightedUpdateId === update.id;
    $$renderer2.push(`<article${attr("id", `update-${update.id}`)}${attr_class("update-card svelte-a33ld7", void 0, { "highlighted": isHighlighted })}><strong class="svelte-a33ld7">${escape_html(update.title)}</strong> <p class="svelte-a33ld7">${escape_html(update.body)}</p> <span class="svelte-a33ld7"><a class="inline-link svelte-a33ld7"${attr("href", `/profile/${update.authorUsername}`)}>${escape_html(update.authorUsername)}</a> · updated ${escape_html(formatRelativeTime(update.createdAt))}</span></article>`);
    bind_props($$props, { update, highlightedUpdateId });
  });
}
export {
  DetailUpdateCard as D
};
