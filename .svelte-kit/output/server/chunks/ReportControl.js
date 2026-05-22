import { f as fallback, s as store_get, u as unsubscribe_stores, d as bind_props } from "./renderer.js";
import "@sveltejs/kit/internal";
import "./exports.js";
import "./utils.js";
import "@sveltejs/kit/internal/server";
import "./root.js";
import "./state.svelte.js";
import { p as page } from "./stores.js";
import { a as ReportMenu, b as ReportComposerModal } from "./RoundPlusButton.js";
import "./data.js";
function ReportControl($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let viewerUsername, blockedMessage;
    let subjectId = fallback($$props["subjectId"], "");
    let targetId = fallback($$props["targetId"], "");
    let itemLabel = fallback($$props["itemLabel"], "item");
    let report = fallback($$props["report"], null);
    let ownerUsername = fallback($$props["ownerUsername"], "");
    let modalOpen = false;
    let pending = false;
    let reason = "spam";
    let description = "";
    viewerUsername = store_get($$store_subs ??= {}, "$page", page).data.bootstrap?.viewer?.username ?? null;
    blockedMessage = viewerUsername && ownerUsername && viewerUsername === ownerUsername ? "You can't report yourself" : "";
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="report-control svelte-yoziff">`);
      ReportMenu($$renderer3, { blockedMessage, itemLabel, pending, report });
      $$renderer3.push(`<!----> `);
      ReportComposerModal($$renderer3, {
        itemLabel,
        open: modalOpen,
        pending,
        get description() {
          return description;
        },
        set description($$value) {
          description = $$value;
          $$settled = false;
        },
        get reason() {
          return reason;
        },
        set reason($$value) {
          reason = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    if ($$store_subs) unsubscribe_stores($$store_subs);
    bind_props($$props, { subjectId, targetId, itemLabel, report, ownerUsername });
  });
}
export {
  ReportControl as R
};
