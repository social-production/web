import { k as fallback, c as attr_class, e as escape_html, f as bind_props } from "./renderer.js";
function VoteStrip($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let count = $$props["count"];
    let activeVote = fallback($$props["activeVote"], 0);
    $$renderer2.push(`<div class="vote-strip svelte-1dnw6kw"><button aria-label="Vote up"${attr_class("vote-button svelte-1dnw6kw", void 0, { "active-up": activeVote === 1 })} type="button">▲</button> <span${attr_class("vote-count svelte-1dnw6kw", void 0, {
      "active-up": activeVote === 1,
      "active-down": activeVote === -1
    })}>${escape_html(count)}</span> <button aria-label="Vote down"${attr_class("vote-button svelte-1dnw6kw", void 0, { "active-down": activeVote === -1 })} type="button">▼</button></div>`);
    bind_props($$props, { count, activeVote });
  });
}
export {
  VoteStrip as V
};
