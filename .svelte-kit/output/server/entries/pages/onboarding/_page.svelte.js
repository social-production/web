import { s as store_get, e as escape_html, a as ensure_array_like, b as attr_class, c as attr, u as unsubscribe_stores, d as bind_props } from "../../../chunks/renderer.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/root.js";
import "../../../chunks/state.svelte.js";
import { p as page } from "../../../chunks/stores.js";
import "../../../chunks/data.js";
function OnboardingPage($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let viewer;
    let data = $$props["data"];
    let mode = "login";
    let username = "";
    let password = "";
    let isSubmitting = false;
    viewer = store_get($$store_subs ??= {}, "$page", page).data.bootstrap?.viewer ?? null;
    $$renderer2.push(`<section class="page svelte-1xhrqc3"><section class="hero-card svelte-1xhrqc3"><h1 class="svelte-1xhrqc3">${escape_html(data.title)}</h1> <p class="svelte-1xhrqc3">${escape_html(data.intro)}</p> <div class="credential-note svelte-1xhrqc3"><strong class="svelte-1xhrqc3">Mock login</strong> <span class="svelte-1xhrqc3">Username: patchbay</span> <span class="svelte-1xhrqc3">Password: patchbay123</span></div> `);
    if (viewer) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="signed-in-note svelte-1xhrqc3"><strong class="svelte-1xhrqc3">Signed in as @${escape_html(viewer.username)}</strong> <button class="button-primary" type="button">Go to feed</button></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></section> <section class="grid svelte-1xhrqc3"><section class="panel svelte-1xhrqc3"><h2 class="svelte-1xhrqc3">Account Mode</h2> <div class="choice-row svelte-1xhrqc3"><!--[-->`);
    const each_array = ensure_array_like(data.accountModes);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let option = each_array[$$index];
      $$renderer2.push(`<button${attr_class("toggle-chip svelte-1xhrqc3", void 0, { "active": mode === option.value })} type="button">${escape_html(option.label)}</button>`);
    }
    $$renderer2.push(`<!--]--></div> <form class="stack svelte-1xhrqc3"><label><span class="field-label svelte-1xhrqc3">Username</span> <input${attr("value", username)} placeholder="patchbay"/></label> <label><span class="field-label svelte-1xhrqc3">Password</span> <input${attr("value", password)} type="password" placeholder="••••••••"/></label> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="button-row svelte-1xhrqc3"><button class="button-primary"${attr("disabled", isSubmitting, true)} type="submit">`);
    {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`Log in`);
    }
    $$renderer2.push(`<!--]--></button></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></form></section> <section class="panel svelte-1xhrqc3"><h2 class="svelte-1xhrqc3">Create Profile</h2> <div class="stack svelte-1xhrqc3"><div class="option-row svelte-1xhrqc3"><strong class="svelte-1xhrqc3">One account, one profile</strong> <span class="svelte-1xhrqc3">Your profile is just your profile. Add a bio if you want people to understand what kind of work you do.</span></div> <div class="option-row svelte-1xhrqc3"><strong class="svelte-1xhrqc3">Privacy still lives in settings</strong> <span class="svelte-1xhrqc3">Feed and follow controls still exist in Settings, but signup no longer asks you to pick a profile mode.</span></div></div></section></section> <section class="grid svelte-1xhrqc3"><section class="panel svelte-1xhrqc3"><h2 class="svelte-1xhrqc3">Starter Channels</h2> <div class="chip-row svelte-1xhrqc3"><!--[-->`);
    const each_array_1 = ensure_array_like(data.starterChannels);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let label = each_array_1[$$index_1];
      $$renderer2.push(`<span class="tag-chip svelte-1xhrqc3">${escape_html(label)}</span>`);
    }
    $$renderer2.push(`<!--]--></div></section> <section class="panel svelte-1xhrqc3"><h2 class="svelte-1xhrqc3">Starter Communities</h2> <div class="chip-row svelte-1xhrqc3"><!--[-->`);
    const each_array_2 = ensure_array_like(data.starterCommunities);
    for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
      let label = each_array_2[$$index_2];
      $$renderer2.push(`<span class="tag-chip community svelte-1xhrqc3">${escape_html(label)}</span>`);
    }
    $$renderer2.push(`<!--]--></div></section></section></section>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
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
