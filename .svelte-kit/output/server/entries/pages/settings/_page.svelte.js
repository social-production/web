import { e as escape_html, b as attr, c as attr_class, f as bind_props } from "../../../chunks/renderer.js";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/root.js";
import "../../../chunks/state.svelte.js";
import "../../../chunks/data.js";
function SettingsPage($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    let pendingKey = "";
    let bioDraft = data.profileBio;
    let lastLoadedBio = data.profileBio;
    if (data.profileBio !== lastLoadedBio) {
      bioDraft = data.profileBio;
      lastLoadedBio = data.profileBio;
    }
    $$renderer2.push(`<section class="page svelte-y6ar7z"><section class="hero-card svelte-y6ar7z"><h1 class="svelte-y6ar7z">Settings</h1> <p class="svelte-y6ar7z">Theme, feed visibility, and privacy preferences stay here instead of hiding behind the shell.</p></section> <section class="grid svelte-y6ar7z"><section class="panel svelte-y6ar7z"><h2 class="svelte-y6ar7z">Account</h2> <div class="account-summary svelte-y6ar7z"><strong class="svelte-y6ar7z">@${escape_html(data.profileUsername)}</strong> <p class="svelte-y6ar7z">${escape_html(data.profileBio)}</p></div> <p class="helper-copy svelte-y6ar7z">Profile text is hydrated from the same mock account data as the shell and profile page.</p> <label class="field-stack svelte-y6ar7z"><span class="field-label svelte-y6ar7z">Bio</span> <textarea rows="4" placeholder="Tell people what you work on.">`);
    const $$body = escape_html(bioDraft);
    if ($$body) {
      $$renderer2.push(`${$$body}`);
    }
    $$renderer2.push(`</textarea></label> <div class="button-row"><button class="button-primary"${attr("disabled", pendingKey === "bio", true)} type="button">Save bio</button></div></section> <section class="panel svelte-y6ar7z"><h2 class="svelte-y6ar7z">Appearance</h2> <div class="setting-row svelte-y6ar7z"><div><strong class="svelte-y6ar7z">Theme</strong> <p class="svelte-y6ar7z">Switch the app shell between the darker work surface and a lighter paper-like surface.</p></div> <div class="choice-row svelte-y6ar7z"><button${attr_class("toggle-chip", void 0, { "active": data.appearanceThemeMode === "dark" })}${attr("disabled", pendingKey === "theme", true)} type="button">Dark</button> <button${attr_class("toggle-chip", void 0, { "active": data.appearanceThemeMode === "light" })}${attr("disabled", pendingKey === "theme", true)} type="button">Light</button></div></div> <div class="setting-row svelte-y6ar7z"><div><strong class="svelte-y6ar7z">Default feed</strong> <p class="svelte-y6ar7z">Choose which feed should feel primary for this account.</p></div> <div class="choice-row svelte-y6ar7z"><button${attr_class("toggle-chip", void 0, { "active": data.defaultFeed === "public" })}${attr("disabled", pendingKey === "default-feed", true)} type="button">Public</button> <button${attr_class("toggle-chip", void 0, { "active": data.defaultFeed === "personal" })}${attr("disabled", pendingKey === "default-feed", true)} type="button">Personal</button></div></div></section></section> <section class="grid svelte-y6ar7z"><section class="panel svelte-y6ar7z"><h2 class="svelte-y6ar7z">Personal Feed</h2> <div class="setting-row svelte-y6ar7z"><div><strong class="svelte-y6ar7z">Hide my public activity from personal feeds</strong> <p class="svelte-y6ar7z">Use this if you do not want your public project, thread, event, or comment activity showing up in follow-based personal feeds.</p></div> <button class="toggle-chip"${attr("disabled", pendingKey === "personal-activity", true)} type="button">${escape_html(data.hidePublicActivityFromPersonalFeeds ? "On" : "Off")}</button></div> <div class="status-note">This already affects the hydrated personal feed in the development adapter.</div></section> <section class="panel svelte-y6ar7z"><h2 class="svelte-y6ar7z">Privacy</h2> <div class="setting-row svelte-y6ar7z"><div><strong class="svelte-y6ar7z">Hide my personal feed from non-followers</strong> <p class="svelte-y6ar7z">Turn this on if you want your personal side to stay follower-only.</p></div> <button class="toggle-chip"${attr("disabled", pendingKey === "private-profile", true)} type="button">${escape_html(data.hidePersonalFeedFromNonFollowers ? "On" : "Off")}</button></div> <div class="status-note">${escape_html(data.requireFollowApproval ? "Follower approval is automatically required while your personal feed is hidden from non-followers." : "Follower approval stays open while your personal feed is visible.")}</div></section></section></section>`);
    bind_props($$props, { data });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    SettingsPage($$renderer2, { data: data.settings });
    bind_props($$props, { data });
  });
}
export {
  _page as default
};
