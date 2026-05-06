import "clsx";
import { e as escape_html, c as attr_class, b as attr, d as ensure_array_like } from "../../../../chunks/renderer.js";
import { P as ProjectCard } from "../../../../chunks/ProjectCard.js";
import { C as CreateFlowLayout, a as CreatePanel } from "../../../../chunks/CreatePanel.js";
import { i as isPersonalServiceProject } from "../../../../chunks/data.js";
import { b as splitCommaValues, m as makeTagRef, a as communityOptions } from "../../../../chunks/options.js";
function CreateProjectPage($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let projectPreview, canSubmit;
    let selectedType = "productive";
    let title = "Neighborhood Heat Pump Retrofit Pilot";
    let summary = "Research a small retrofit round before moving into full planning and procurement.";
    let locationLabel = "Block 2 Retrofit Cluster, East Market, Riverbend";
    let district = "East Market";
    let primaryChannel = "Housing & Build";
    let additionalChannels = "";
    let taggedCommunities = "";
    let notes = "Looking for visible demand, likely participant count, and similar project overlap before the planning stage.";
    projectPreview = {
      kind: "project",
      id: "project-preview",
      slug: "project-preview",
      href: "#",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      title: title.trim() || "Untitled project",
      authorUsername: "patchbay",
      projectMode: selectedType,
      summary: summary.trim() || "Describe the project so need, labor interest, and overlap stay visible before planning begins.",
      channelTags: [
        ...primaryChannel.trim() ? [makeTagRef(primaryChannel.trim(), "channel")] : [],
        ...splitCommaValues(additionalChannels).map((value) => makeTagRef(value, "channel"))
      ],
      communityTags: splitCommaValues(taggedCommunities).map((value) => makeTagRef(value, "community")),
      stage: isPersonalServiceProject(selectedType) ? "Activity" : "Proposal",
      locationLabel: `${locationLabel}${district.trim() ? ` · ${district.trim()}` : ""}`,
      voteCount: 0,
      activeVote: 0,
      signalCount: 0,
      commentCount: 0,
      memberCount: 0,
      lastActivityAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    canSubmit = title.trim().length > 0 && summary.trim().length > 0 && primaryChannel.trim().length > 0;
    CreateFlowLayout($$renderer2, {
      $$slots: {
        primary: ($$renderer3) => {
          {
            CreatePanel($$renderer3, {
              title: "Project setup",
              description: "Choose the project type, give it a location, and anchor discovery with at least one channel tag.",
              children: ($$renderer4) => {
                $$renderer4.push(`<form class="form-stack svelte-149tywm"><div class="section-block svelte-149tywm"><p class="section-label svelte-149tywm">Project Type</p> <div class="type-grid three-up svelte-149tywm"><button type="button"${attr_class("type-card svelte-149tywm", void 0, { "active": selectedType === "productive" })}><span class="type-title svelte-149tywm">Productive Project</span> <span class="type-body svelte-149tywm">Starts in demand signalling and can gather visible demand before planning locks.</span></button> <button type="button"${attr_class("type-card svelte-149tywm", void 0, { "active": selectedType === "collective-service" })}><span class="type-title svelte-149tywm">Collective Service</span> <span class="type-body svelte-149tywm">Starts in demand signalling and can move into operations and access planning before recurring service begins.</span></button> <button type="button"${attr_class("type-card svelte-149tywm", void 0, { "active": selectedType === "personal-service" })}><span class="type-title svelte-149tywm">Personal Service</span> <span class="type-body svelte-149tywm">Skips planning and opens directly into availability, requests, and scheduling for one person offering the service.</span></button></div></div> <label><span class="field-label svelte-149tywm">Title</span> <input${attr("value", title)}/></label> <label><span class="field-label svelte-149tywm">Suggested location</span> <input${attr("value", locationLabel)} list="project-locations"/> <datalist id="project-locations">`);
                $$renderer4.option({ value: "Block 2 Retrofit Cluster, East Market, Riverbend" }, ($$renderer5) => {
                });
                $$renderer4.option({ value: "Tool Library Annex, East Market" }, ($$renderer5) => {
                });
                $$renderer4.option({ value: "West Terrace Laundry Room" }, ($$renderer5) => {
                });
                $$renderer4.push(`</datalist></label> <label><span class="field-label svelte-149tywm">District or neighborhood</span> <input${attr("value", district)}/></label> <label><span class="field-label svelte-149tywm">Summary</span> <textarea rows="3">`);
                const $$body = escape_html(summary);
                if ($$body) {
                  $$renderer4.push(`${$$body}`);
                }
                $$renderer4.push(`</textarea></label> <label><span class="field-label svelte-149tywm">Primary channel tag</span> <input${attr("value", primaryChannel)} list="project-channels"/> <datalist id="project-channels"><!--[-->`);
                const each_array = ensure_array_like(["Housing & Build", "Mutual Aid", "Energy Retrofit"]);
                for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                  let option = each_array[$$index];
                  $$renderer4.option({ value: option }, ($$renderer5) => {
                  });
                }
                $$renderer4.push(`<!--]--></datalist></label> <label><span class="field-label svelte-149tywm">Additional channel tags</span> <input${attr("value", additionalChannels)} placeholder="Comma-separated"/></label> <label><span class="field-label svelte-149tywm">Community tags</span> <input${attr("value", taggedCommunities)} placeholder="Comma-separated" list="project-communities"/> <datalist id="project-communities"><!--[-->`);
                const each_array_1 = ensure_array_like(communityOptions);
                for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
                  let option = each_array_1[$$index_1];
                  $$renderer4.option({ value: option.label }, ($$renderer5) => {
                  });
                }
                $$renderer4.push(`<!--]--></datalist></label> `);
                {
                  $$renderer4.push("<!--[0-->");
                  $$renderer4.push(`<label><span class="field-label svelte-149tywm">Demand-signalling note</span> <textarea rows="4">`);
                  const $$body_1 = escape_html(notes);
                  if ($$body_1) {
                    $$renderer4.push(`${$$body_1}`);
                  }
                  $$renderer4.push(`</textarea></label>`);
                }
                $$renderer4.push(`<!--]--> <div class="button-row"><button class="button-primary"${attr("disabled", !canSubmit, true)} type="submit">Create Project</button> <button class="button-ghost" type="button">Save Draft</button></div> `);
                {
                  $$renderer4.push("<!--[-1-->");
                }
                $$renderer4.push(`<!--]--></form>`);
              },
              $$slots: { default: true }
            });
          }
        },
        secondary: ($$renderer3) => {
          {
            CreatePanel($$renderer3, {
              title: "Live preview",
              description: "Matches the current feed treatment for projects.",
              surface: "transparent",
              children: ($$renderer4) => {
                ProjectCard($$renderer4, { item: projectPreview });
              },
              $$slots: { default: true }
            });
            $$renderer3.push(`<!----> `);
            CreatePanel($$renderer3, {
              title: "Posting rules",
              description: "What happens immediately after creation in this frontend slice.",
              children: ($$renderer4) => {
                $$renderer4.push(`<p class="helper-text">${escape_html(
                  "New productive projects start in Proposal. Planning stays public because at least one channel tag is required."
                )}</p>`);
              },
              $$slots: { default: true }
            });
            $$renderer3.push(`<!---->`);
          }
        }
      }
    });
  });
}
function _page($$renderer) {
  CreateProjectPage($$renderer);
}
export {
  _page as default
};
