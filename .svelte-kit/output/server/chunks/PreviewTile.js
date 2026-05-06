import { e as escape_html, f as bind_props } from "./renderer.js";
function PreviewTile($$renderer, $$props) {
  let title = $$props["title"];
  let body = $$props["body"];
  let meta = $$props["meta"];
  $$renderer.push(`<article class="preview-tile svelte-evsd74"><h3 class="svelte-evsd74">${escape_html(title)}</h3> <p class="svelte-evsd74">${escape_html(body)}</p> <span class="svelte-evsd74">${escape_html(meta)}</span></article>`);
  bind_props($$props, { title, body, meta });
}
export {
  PreviewTile as P
};
