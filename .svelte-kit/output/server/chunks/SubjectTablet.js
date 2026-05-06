import { k as fallback, c as attr_class, e as escape_html, f as bind_props } from "./renderer.js";
import { p as projectSubjectLabel } from "./data.js";
function Tablet($$renderer, $$props) {
  let label = $$props["label"];
  let variant = fallback($$props["variant"], "stage");
  $$renderer.push(`<span${attr_class(`tablet ${variant}`, "svelte-cze32e")}>${escape_html(label)}</span>`);
  bind_props($$props, { label, variant });
}
function SubjectTablet($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let kind = $$props["kind"];
    let projectMode = fallback($$props["projectMode"], "productive");
    function subjectLabel(subjectKind, mode) {
      if (subjectKind === "project") {
        return projectSubjectLabel(mode);
      }
      return subjectKind.charAt(0).toUpperCase() + subjectKind.slice(1);
    }
    function subjectVariant(subjectKind, mode) {
      if (subjectKind === "project") {
        if (mode === "productive") {
          return "project-production";
        }
        return mode === "personal-service" ? "project-personal-service" : "project-service";
      }
      if (subjectKind === "thread" || subjectKind === "event" || subjectKind === "post") {
        return subjectKind;
      }
      return "stage";
    }
    let label = subjectLabel(kind, projectMode);
    let variant = subjectVariant(kind, projectMode);
    label = subjectLabel(kind, projectMode);
    variant = subjectVariant(kind, projectMode);
    Tablet($$renderer2, { label, variant });
    bind_props($$props, { kind, projectMode });
  });
}
export {
  SubjectTablet as S,
  Tablet as T
};
