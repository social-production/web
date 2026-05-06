import { e as escape_html, d as ensure_array_like, b as attr, f as bind_props } from "../../../chunks/renderer.js";
function SearchPage($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    const kindLabels = {
      project: "Project",
      thread: "Thread",
      event: "Event",
      channel: "Channel",
      community: "Community",
      profile: "Profile"
    };
    $$renderer2.push(`<section class="page svelte-8kp4ot"><section class="hero-card svelte-8kp4ot"><h1 class="svelte-8kp4ot">Search</h1> `);
    if (data.query.trim()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="svelte-8kp4ot">Showing results for "${escape_html(data.query)}".</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<p class="svelte-8kp4ot">Browse suggested results across public work, channels, communities, and profiles.</p>`);
    }
    $$renderer2.push(`<!--]--> <div class="chip-row svelte-8kp4ot"><!--[-->`);
    const each_array = ensure_array_like(data.suggestedQueries);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let query = each_array[$$index];
      $$renderer2.push(`<a class="query-chip svelte-8kp4ot"${attr("href", `/search?q=${encodeURIComponent(query)}`)}>${escape_html(query)}</a>`);
    }
    $$renderer2.push(`<!--]--></div></section> <div class="stack svelte-8kp4ot">`);
    if (data.results.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<section class="result-card svelte-8kp4ot"><h2 class="svelte-8kp4ot">No results</h2> <p class="svelte-8kp4ot">Try a channel name, community name, project title, or username.</p></section>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<!--[-->`);
      const each_array_1 = ensure_array_like(data.results);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let result = each_array_1[$$index_1];
        $$renderer2.push(`<a class="result-card svelte-8kp4ot"${attr("href", result.href)}><div class="topline svelte-8kp4ot"><span class="kind-chip svelte-8kp4ot">${escape_html(kindLabels[result.kind])}</span> <span class="svelte-8kp4ot">${escape_html(result.meta)}</span></div> <h2 class="svelte-8kp4ot">${escape_html(result.title)}</h2> <p class="svelte-8kp4ot">${escape_html(result.summary)}</p></a>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></section>`);
    bind_props($$props, { data });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    SearchPage($$renderer2, { data: data.search });
    bind_props($$props, { data });
  });
}
export {
  _page as default
};
