import { f as fallback, c as attr, e as escape_html, d as bind_props, b as attr_class } from "./renderer.js";
function ReportComposerModal($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let open = fallback($$props["open"], false);
    let itemLabel = fallback($$props["itemLabel"], "item");
    let reason = fallback($$props["reason"], "spam");
    let description = fallback($$props["description"], "");
    let pending = fallback($$props["pending"], false);
    if (open) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div aria-hidden="true" class="report-modal-backdrop svelte-10aw8uh" tabindex="-1"><div${attr("aria-label", `Report ${itemLabel}`)} aria-modal="true" class="report-modal svelte-10aw8uh" role="dialog" tabindex="-1"><div class="report-modal-copy svelte-10aw8uh"><h2 class="svelte-10aw8uh">Report ${escape_html(itemLabel)}</h2> <p class="svelte-10aw8uh">Choose a reason and add any useful context.</p></div> <label class="field-stack svelte-10aw8uh"><span class="field-label svelte-10aw8uh">Reason</span> `);
      $$renderer2.select(
        { value: reason, class: "" },
        ($$renderer3) => {
          $$renderer3.option({ value: "spam" }, ($$renderer4) => {
            $$renderer4.push(`Spam`);
          });
          $$renderer3.option({ value: "serious-harm" }, ($$renderer4) => {
            $$renderer4.push(`Serious harm`);
          });
        },
        "svelte-10aw8uh"
      );
      $$renderer2.push(`</label> <label class="field-stack svelte-10aw8uh"><span class="field-label svelte-10aw8uh">Description</span> <textarea placeholder="Add context for the report..." rows="4" class="svelte-10aw8uh">`);
      const $$body = escape_html(description);
      if ($$body) {
        $$renderer2.push(`${$$body}`);
      }
      $$renderer2.push(`</textarea></label> <div class="report-actions svelte-10aw8uh"><button class="secondary-button svelte-10aw8uh" type="button">Cancel</button> <button class="primary-button svelte-10aw8uh"${attr("disabled", pending, true)} type="button">Submit report</button></div></div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { open, itemLabel, reason, description, pending });
  });
}
function ReportMenu($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let itemLabel = fallback($$props["itemLabel"], "item");
    let report = fallback($$props["report"], null);
    let pending = fallback($$props["pending"], false);
    let blockedMessage = fallback($$props["blockedMessage"], "");
    let menuOpen = false;
    $$renderer2.push(`<div class="report-menu-shell svelte-67xz4j"><button${attr("aria-expanded", menuOpen)}${attr("aria-label", report ? `View ${itemLabel} report` : `Report ${itemLabel}`)}${attr_class("report-trigger svelte-67xz4j", void 0, { "active-report": !!report })} type="button"><span aria-hidden="true" class="menu-dots svelte-67xz4j"></span> `);
    if (report) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span aria-hidden="true" class="report-indicator svelte-67xz4j"></span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></button></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { itemLabel, report, pending, blockedMessage });
  });
}
function RoundPlusButton($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let active = fallback($$props["active"], false);
    let ariaLabel = fallback($$props["ariaLabel"], "Add item");
    let action = fallback($$props["action"], () => {
    });
    $$renderer2.push(`<button${attr("aria-label", ariaLabel)}${attr("aria-pressed", active)}${attr_class("round-plus-button svelte-1ccf456", void 0, { "active": active })} type="button">+</button>`);
    bind_props($$props, { active, ariaLabel, action });
  });
}
export {
  RoundPlusButton as R,
  ReportMenu as a,
  ReportComposerModal as b
};
