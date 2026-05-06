import { e as escape_html, d as ensure_array_like, f as bind_props } from "../../../chunks/renderer.js";
function OnboardingPage($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    $$renderer2.push(`<section class="page svelte-1xhrqc3"><section class="hero-card svelte-1xhrqc3"><h1 class="svelte-1xhrqc3">${escape_html(data.title)}</h1> <p class="svelte-1xhrqc3">${escape_html(data.intro)}</p></section> <section class="grid svelte-1xhrqc3"><section class="panel svelte-1xhrqc3"><h2 class="svelte-1xhrqc3">Account Mode</h2> <div class="stack svelte-1xhrqc3"><!--[-->`);
    const each_array = ensure_array_like(data.accountModes);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let option = each_array[$$index];
      $$renderer2.push(`<div class="option-row svelte-1xhrqc3"><strong class="svelte-1xhrqc3">${escape_html(option.label)}</strong> <span class="svelte-1xhrqc3">${escape_html(option.description)}</span></div>`);
    }
    $$renderer2.push(`<!--]--></div></section> <section class="panel svelte-1xhrqc3"><h2 class="svelte-1xhrqc3">Profile Visibility</h2> <div class="stack svelte-1xhrqc3"><!--[-->`);
    const each_array_1 = ensure_array_like(data.visibilityOptions);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let option = each_array_1[$$index_1];
      $$renderer2.push(`<div class="option-row svelte-1xhrqc3"><strong class="svelte-1xhrqc3">${escape_html(option.label)}</strong> <span class="svelte-1xhrqc3">${escape_html(option.description)}</span></div>`);
    }
    $$renderer2.push(`<!--]--></div></section></section> <section class="grid svelte-1xhrqc3"><section class="panel svelte-1xhrqc3"><h2 class="svelte-1xhrqc3">Starter Channels</h2> <div class="chip-row svelte-1xhrqc3"><!--[-->`);
    const each_array_2 = ensure_array_like(data.starterChannels);
    for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
      let label = each_array_2[$$index_2];
      $$renderer2.push(`<span class="tag-chip svelte-1xhrqc3">${escape_html(label)}</span>`);
    }
    $$renderer2.push(`<!--]--></div></section> <section class="panel svelte-1xhrqc3"><h2 class="svelte-1xhrqc3">Starter Communities</h2> <div class="chip-row svelte-1xhrqc3"><!--[-->`);
    const each_array_3 = ensure_array_like(data.starterCommunities);
    for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
      let label = each_array_3[$$index_3];
      $$renderer2.push(`<span class="tag-chip community svelte-1xhrqc3">${escape_html(label)}</span>`);
    }
    $$renderer2.push(`<!--]--></div></section></section></section>`);
    bind_props($$props, { data });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    OnboardingPage($$renderer2, { data: data.onboarding });
    bind_props($$props, { data });
  });
}
export {
  _page as default
};
