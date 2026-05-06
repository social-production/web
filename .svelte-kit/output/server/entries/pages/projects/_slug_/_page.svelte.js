import { a as attr_style, d as ensure_array_like, c as attr_class, e as escape_html, b as attr, f as bind_props, k as fallback, g as store_get, u as unsubscribe_stores } from "../../../../chunks/renderer.js";
import { p as page } from "../../../../chunks/stores.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/root.js";
import "../../../../chunks/state.svelte.js";
import { i as isPersonalServiceProject, V as isCollectiveServiceProject, W as supportsProjectDemandSignals } from "../../../../chunks/data.js";
import { a as formatRelativeTime } from "../../../../chunks/time.js";
import { V as VoteStrip } from "../../../../chunks/VoteStrip.js";
import { S as SubjectTablet } from "../../../../chunks/SubjectTablet.js";
import { T as TagList } from "../../../../chunks/TagList.js";
import { D as DetailUpdateCard } from "../../../../chunks/DetailUpdateCard.js";
function ProjectLifecyclePanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let currentPhaseOrder, activePhase;
    const importanceOptions = [
      { value: 1, label: "Not important" },
      { value: 2, label: "Somewhat" },
      { value: 3, label: "Important" },
      { value: 4, label: "Very important" }
    ];
    let data = $$props["data"];
    let activePhaseId = data.lifecycle.currentPhaseId;
    let lastCurrentPhaseId = data.lifecycle.currentPhaseId;
    let draftValue = "";
    let productionForm = {
      title: "",
      outputSummary: "",
      materialsSummary: "",
      totalCostLabel: "",
      acquisitionsSummary: ""
    };
    let distributionForm = {
      title: "",
      distributionSummary: "",
      accessSummary: "",
      reserveSummary: "",
      requestSystemEnabled: false
    };
    let activityForm = {
      title: "",
      scheduledAt: "",
      locationLabel: "",
      roleLabels: "",
      minimumParticipants: 1,
      note: ""
    };
    let serviceRequestForm = { title: "", body: "" };
    let showPhaseTwoComposer = false;
    let showPhaseThreeComposer = false;
    let revertTargetPhaseId = "phase-2";
    function phaseOrder(phaseId) {
      return data.lifecycle.phases.find((phase) => phase.id === phaseId)?.order ?? 1;
    }
    function isFuturePhase(phase) {
      return phase.order > currentPhaseOrder;
    }
    function phaseProgressLabel(phase) {
      if (phase.progressState === "current") {
        return "Current phase";
      }
      if (phase.progressState === "complete") {
        return "Complete";
      }
      if (phase.progressState === "locked") {
        return "Unavailable in beta";
      }
      return "Not unlocked yet";
    }
    function phaseTabTitle(phase) {
      if (isPersonalServiceProject(data.projectMode)) {
        switch (phase.id) {
          case "phase-1":
            return "Activity";
          case "phase-2":
            return "Complete";
          default:
            return phase.shortLabel;
        }
      }
      if (isCollectiveServiceProject(data.projectMode)) {
        switch (phase.id) {
          case "phase-2":
            return "Operations";
          case "phase-3":
            return "Access";
          case "phase-6":
            return "Cycle";
        }
      }
      switch (phase.id) {
        case "phase-1":
          return "Proposal";
        case "phase-2":
          return "Production";
        case "phase-3":
          return "Distribution";
        case "phase-4":
          return "Acquisition";
        case "phase-5":
          return "Activity";
        case "phase-6":
          return "Completed";
      }
    }
    function phaseTwoHeading() {
      return isCollectiveServiceProject(data.projectMode) ? "Operations plans" : "Production plans";
    }
    function phaseTwoDescription() {
      return isCollectiveServiceProject(data.projectMode) ? "Members can submit multiple operations plans. The highest approval above quorum becomes the active service operations plan." : "Members can submit multiple plans. The highest approval above quorum becomes the active production plan.";
    }
    function phaseTwoSubmitLabel() {
      return isCollectiveServiceProject(data.projectMode) ? "Submit operations plan" : "Submit production plan";
    }
    function phaseThreeHeading() {
      return isCollectiveServiceProject(data.projectMode) ? "Access plans" : "Distribution plans";
    }
    function phaseThreeDescription() {
      return isCollectiveServiceProject(data.projectMode) ? "These plans decide who can access the service, under what conditions, and whether service requests should be enabled." : "These plans decide who receives the output and under what access conditions after production is settled.";
    }
    function phaseThreeSubmitLabel() {
      return isCollectiveServiceProject(data.projectMode) ? "Submit access plan" : "Submit distribution plan";
    }
    function requestStatusLabel(status) {
      switch (status) {
        case "accepted":
          return "Accepted";
        case "declined":
          return "Declined";
        default:
          return "Open";
      }
    }
    function revertTargetLabel(phaseId) {
      if (phaseId === "phase-2") {
        return isCollectiveServiceProject(data.projectMode) ? "Phase 2 / Operations Plan" : "Phase 2 / Production Plan";
      }
      return isCollectiveServiceProject(data.projectMode) ? "Phase 3 / Access Plan" : "Phase 3 / Distribution Plan";
    }
    function completionPhaseCopy() {
      if (isPersonalServiceProject(data.projectMode)) {
        return "This phase closes the current personal service or converts it into a collective service or productive project when the work grows beyond one person.";
      }
      if (isCollectiveServiceProject(data.projectMode)) {
        return "This phase closes the current service cycle or sends it into another cycle. Ongoing services that are not changing plans should normally stay in Phase 5.";
      }
      return "This phase marks the project as completed or converted into an ongoing service. The history above stays visible either way.";
    }
    function advanceLabel() {
      if (!data.lifecycle.nextPhaseId || !data.lifecycle.nextPhaseLabel) {
        return null;
      }
      if (data.lifecycle.currentPhaseId === "phase-3") {
        return `Skip locked acquisition and move to ${data.lifecycle.nextPhaseLabel}`;
      }
      return `Move to ${data.lifecycle.nextPhaseLabel}`;
    }
    currentPhaseOrder = phaseOrder(data.lifecycle.currentPhaseId);
    if (lastCurrentPhaseId !== data.lifecycle.currentPhaseId) {
      lastCurrentPhaseId = data.lifecycle.currentPhaseId;
      activePhaseId = data.lifecycle.currentPhaseId;
      showPhaseTwoComposer = false;
      showPhaseThreeComposer = false;
    }
    activePhase = data.lifecycle.phases.find((phase) => phase.id === activePhaseId) ?? data.lifecycle.phases.find((phase) => phase.id === data.lifecycle.currentPhaseId) ?? data.lifecycle.phases[0];
    if (!data.lifecycle.revertablePhaseIds.includes(revertTargetPhaseId)) {
      revertTargetPhaseId = data.lifecycle.revertablePhaseIds[0] ?? "phase-2";
    }
    $$renderer2.push(`<section class="lifecycle-shell svelte-bd1lq"><section class="phase-tab-row svelte-bd1lq"${attr_style(`grid-template-columns: repeat(${data.lifecycle.phases.length}, minmax(0, 1fr))`)}><!--[-->`);
    const each_array = ensure_array_like(data.lifecycle.phases);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let phase = each_array[$$index];
      $$renderer2.push(`<button${attr_class("phase-tab svelte-bd1lq", void 0, {
        "active": activePhaseId === phase.id,
        "current-phase": phase.progressState === "current",
        "future-phase": isFuturePhase(phase) && phase.progressState !== "locked",
        "locked-phase": phase.progressState === "locked"
      })} type="button"><span class="phase-tab-number svelte-bd1lq">${escape_html(phase.shortLabel)}</span> <span class="phase-tab-title svelte-bd1lq">${escape_html(phaseTabTitle(phase))}</span> <small${attr_class("svelte-bd1lq", void 0, { "current-label": phase.progressState === "current" })}>${escape_html(phaseProgressLabel(phase))}</small></button>`);
    }
    $$renderer2.push(`<!--]--></section> <section class="phase-panel svelte-bd1lq"><div class="phase-header svelte-bd1lq"><div class="phase-line svelte-bd1lq"><span class="phase-kicker svelte-bd1lq">${escape_html(activePhase.shortLabel)}</span> <div class="phase-badges svelte-bd1lq"><span${attr_class(`phase-badge ${activePhase.progressState}`, "svelte-bd1lq")}>${escape_html(phaseProgressLabel(activePhase))}</span> `);
    if (activePhase.betaLocked) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span class="phase-badge locked svelte-bd1lq">Coming later</span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div></div> <div class="phase-copy svelte-bd1lq"><h2 class="svelte-bd1lq">${escape_html(activePhase.title)}</h2> <p class="svelte-bd1lq">${escape_html(activePhase.summary)}</p> `);
    if (activePhase.note) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p${attr_class("phase-note svelte-bd1lq", void 0, { "locked-copy": activePhase.progressState === "locked" })}>${escape_html(activePhase.note)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div></div> <div class="mechanics-card svelte-bd1lq"><h3 class="svelte-bd1lq">How it works</h3> <ul class="phase-list svelte-bd1lq"><!--[-->`);
    const each_array_1 = ensure_array_like(activePhase.mechanics);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let mechanic = each_array_1[$$index_1];
      $$renderer2.push(`<li class="svelte-bd1lq">${escape_html(mechanic)}</li>`);
    }
    $$renderer2.push(`<!--]--></ul></div> `);
    if (activePhase.id === "phase-1" && isPersonalServiceProject(data.projectMode)) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<section class="phase-surface svelte-bd1lq"><div class="surface-header svelte-bd1lq"><div><h3 class="svelte-bd1lq">Availability and requests</h3> <p class="svelte-bd1lq">The creator schedules work directly here, and requests stay open without a separate planning vote.</p></div></div> `);
      if (data.lifecycle.personalService) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="plan-grid single-column svelte-bd1lq"><div class="meta-card svelte-bd1lq"><strong class="svelte-bd1lq">Availability</strong> <p class="svelte-bd1lq">${escape_html(data.lifecycle.personalService.availabilitySummary)}</p></div> `);
        if (data.lifecycle.personalService.travelRadiusLabel) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="meta-card svelte-bd1lq"><strong class="svelte-bd1lq">Travel radius</strong> <p class="svelte-bd1lq">${escape_html(data.lifecycle.personalService.travelRadiusLabel)}</p></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (data.lifecycle.requestSystem?.enabled) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="mechanics-card request-card-shell svelte-bd1lq"><div class="request-header-row svelte-bd1lq"><div><h3 class="svelte-bd1lq">Open requests</h3> <p class="svelte-bd1lq">${escape_html(data.lifecycle.requestSystem.requestCount)} active request${escape_html(data.lifecycle.requestSystem.requestCount === 1 ? "" : "s")}</p></div> `);
        if (data.lifecycle.requestSystem.viewerCanSubmitRequests) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<span class="phase-badge current svelte-bd1lq">Requests open</span>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div> `);
        if (data.lifecycle.requestSystem.viewerCanSubmitRequests) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="composer-card svelte-bd1lq"><input${attr("value", serviceRequestForm.title)} maxlength="120" placeholder="Request title" class="svelte-bd1lq"/> <textarea rows="3" placeholder="What help is needed, and when?" class="svelte-bd1lq">`);
          const $$body = escape_html(serviceRequestForm.body);
          if ($$body) {
            $$renderer2.push(`${$$body}`);
          }
          $$renderer2.push(`</textarea> <div class="composer-actions svelte-bd1lq"><button class="primary-button svelte-bd1lq" type="button">Send request</button></div></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> <div class="surface-stack svelte-bd1lq">`);
        if (data.lifecycle.requestSystem.requests.length === 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="empty-card svelte-bd1lq">No requests yet.</div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
          $$renderer2.push(`<!--[-->`);
          const each_array_2 = ensure_array_like(data.lifecycle.requestSystem.requests);
          for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
            let request = each_array_2[$$index_2];
            $$renderer2.push(`<article class="surface-card request-card svelte-bd1lq"><div class="request-header-row svelte-bd1lq"><div><strong class="svelte-bd1lq">${escape_html(request.title)}</strong> <span class="svelte-bd1lq">${escape_html(formatRelativeTime(request.createdAt))}</span></div> <span${attr_class(
              `phase-badge ${request.status === "accepted" ? "complete" : request.status === "declined" ? "locked" : "upcoming"}`,
              "svelte-bd1lq"
            )}>${escape_html(requestStatusLabel(request.status))}</span></div> <p class="svelte-bd1lq">${escape_html(request.body)}</p> `);
            if (data.lifecycle.requestSystem.viewerCanReviewRequests && request.status === "open") {
              $$renderer2.push("<!--[0-->");
              $$renderer2.push(`<div class="binary-row svelte-bd1lq"><button class="vote-chip svelte-bd1lq" type="button">Accept</button> <button class="vote-chip negative svelte-bd1lq" type="button">Decline</button></div>`);
            } else {
              $$renderer2.push("<!--[-1-->");
            }
            $$renderer2.push(`<!--]--></article>`);
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]--></div></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="surface-header svelte-bd1lq"><div><h3 class="svelte-bd1lq">Scheduled activity</h3> <p class="svelte-bd1lq">The creator can publish concrete sessions directly from this phase.</p></div></div> `);
      if (data.lifecycle.phaseFive.viewerCanCreateActivities) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="composer-card svelte-bd1lq"><input${attr("value", activityForm.title)} maxlength="120" placeholder="Activity title" class="svelte-bd1lq"/> <input${attr("value", activityForm.scheduledAt)} type="datetime-local" class="svelte-bd1lq"/> <input${attr("value", activityForm.locationLabel)} maxlength="120" placeholder="Location" class="svelte-bd1lq"/> <input${attr("value", activityForm.roleLabels)} maxlength="160" placeholder="Roles needed, comma separated" class="svelte-bd1lq"/> <input${attr("value", activityForm.minimumParticipants)} min="1" type="number" class="svelte-bd1lq"/> <textarea rows="3" placeholder="What needs to happen and why?" class="svelte-bd1lq">`);
        const $$body_1 = escape_html(activityForm.note);
        if ($$body_1) {
          $$renderer2.push(`${$$body_1}`);
        }
        $$renderer2.push(`</textarea> <div class="composer-actions svelte-bd1lq"><button class="primary-button svelte-bd1lq" type="button">Create activity</button></div></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="surface-stack svelte-bd1lq">`);
      if (data.lifecycle.phaseFive.activities.length === 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="empty-card svelte-bd1lq">No activity scheduled yet.</div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<!--[-->`);
        const each_array_3 = ensure_array_like(data.lifecycle.phaseFive.activities);
        for (let $$index_4 = 0, $$length = each_array_3.length; $$index_4 < $$length; $$index_4++) {
          let activity = each_array_3[$$index_4];
          $$renderer2.push(`<article class="surface-card activity-card svelte-bd1lq"><div class="plan-header svelte-bd1lq"><div><strong class="svelte-bd1lq">${escape_html(activity.title)}</strong> <span class="svelte-bd1lq">${escape_html(activity.authorUsername)} · ${escape_html(new Date(activity.scheduledAt).toLocaleString())}</span></div> <span${attr_class(`phase-badge ${activity.isActive ? "complete" : "upcoming"}`, "svelte-bd1lq")}>${escape_html(activity.isActive ? "Active" : "Pending roles")}</span></div> <p class="svelte-bd1lq">${escape_html(activity.note)}</p> <div class="activity-meta svelte-bd1lq"><span class="svelte-bd1lq">${escape_html(activity.locationLabel)}</span> <span class="svelte-bd1lq">${escape_html(activity.committedCount)}/${escape_html(activity.minimumParticipants)} participants committed</span></div> <div class="role-grid svelte-bd1lq"><!--[-->`);
          const each_array_4 = ensure_array_like(activity.roles);
          for (let $$index_3 = 0, $$length2 = each_array_4.length; $$index_3 < $$length2; $$index_3++) {
            let role = each_array_4[$$index_3];
            $$renderer2.push(`<div class="meta-card role-card svelte-bd1lq"><strong class="svelte-bd1lq">${escape_html(role.label)}</strong> <span class="svelte-bd1lq">${escape_html(role.filledCount)}/${escape_html(role.requiredCount)} filled</span></div>`);
          }
          $$renderer2.push(`<!--]--></div></article>`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div></section>`);
    } else if (activePhase.id === "phase-1") {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<section class="phase-surface svelte-bd1lq"><div class="surface-header svelte-bd1lq"><div><h3 class="svelte-bd1lq">Values ranked by importance</h3> <p class="svelte-bd1lq">These criteria persist into the planning phases, so members can judge every plan against the same values.</p></div></div> `);
      if (data.lifecycle.phaseOne.viewerCanAddValue) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="composer-card svelte-bd1lq"><input${attr("value", draftValue)} maxlength="160" placeholder="Add a value, for example: should make use of unused space" class="svelte-bd1lq"/> <div class="composer-actions svelte-bd1lq"><button class="primary-button svelte-bd1lq" type="button">Add value</button></div></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="surface-stack svelte-bd1lq">`);
      if (data.lifecycle.phaseOne.values.length === 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="empty-card svelte-bd1lq">No values added yet.</div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<!--[-->`);
        const each_array_5 = ensure_array_like(data.lifecycle.phaseOne.values);
        for (let $$index_6 = 0, $$length = each_array_5.length; $$index_6 < $$length; $$index_6++) {
          let value = each_array_5[$$index_6];
          $$renderer2.push(`<article class="surface-card value-card svelte-bd1lq"><div class="value-header svelte-bd1lq"><div><strong class="svelte-bd1lq">${escape_html(value.label)}</strong> <span class="svelte-bd1lq">Added by ${escape_html(value.authorUsername)}</span></div> <div class="value-score"><strong class="svelte-bd1lq">${escape_html(value.importanceScore)}/4</strong> <span class="svelte-bd1lq">${escape_html(value.importanceLabel)} · ${escape_html(value.voteCount)} votes</span></div></div> <div class="importance-row svelte-bd1lq"><!--[-->`);
          const each_array_6 = ensure_array_like(importanceOptions);
          for (let $$index_5 = 0, $$length2 = each_array_6.length; $$index_5 < $$length2; $$index_5++) {
            let option = each_array_6[$$index_5];
            $$renderer2.push(`<button${attr_class("vote-chip svelte-bd1lq", void 0, { "selected": value.activeImportanceVote === option.value })}${attr("disabled", !data.lifecycle.phaseOne.viewerCanVoteOnValues, true)} type="button">${escape_html(option.label)}</button>`);
          }
          $$renderer2.push(`<!--]--></div></article>`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div></section>`);
    } else if (activePhase.id === "phase-2" && isPersonalServiceProject(data.projectMode)) {
      $$renderer2.push("<!--[2-->");
      $$renderer2.push(`<section class="phase-surface svelte-bd1lq"><div class="empty-card svelte-bd1lq">${escape_html(completionPhaseCopy())}</div></section>`);
    } else if (activePhase.id === "phase-2") {
      $$renderer2.push("<!--[3-->");
      $$renderer2.push(`<section class="phase-surface svelte-bd1lq"><div class="surface-header svelte-bd1lq"><div><h3 class="svelte-bd1lq">${escape_html(phaseTwoHeading())}</h3> <p class="svelte-bd1lq">${escape_html(phaseTwoDescription())}</p></div></div> `);
      if (data.lifecycle.phaseTwo.viewerCanSubmitPlans) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="composer-toggle-row svelte-bd1lq"><button${attr("aria-expanded", showPhaseTwoComposer)}${attr_class("plus-button svelte-bd1lq", void 0, { "active-plus": showPhaseTwoComposer })} type="button">+</button></div> `);
        if (showPhaseTwoComposer) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="composer-card svelte-bd1lq"><input${attr("value", productionForm.title)} maxlength="120" placeholder="Plan title" class="svelte-bd1lq"/> <textarea rows="3"${attr("placeholder", isCollectiveServiceProject(data.projectMode) ? "What operating model should the service follow?" : "What will be produced or built?")} class="svelte-bd1lq">`);
          const $$body_2 = escape_html(productionForm.outputSummary);
          if ($$body_2) {
            $$renderer2.push(`${$$body_2}`);
          }
          $$renderer2.push(`</textarea> <textarea rows="3"${attr("placeholder", isCollectiveServiceProject(data.projectMode) ? "Cadence, staffing, and practical service flow" : "Inputs, materials, and labor needed")} class="svelte-bd1lq">`);
          const $$body_3 = escape_html(productionForm.materialsSummary);
          if ($$body_3) {
            $$renderer2.push(`${$$body_3}`);
          }
          $$renderer2.push(`</textarea> <input${attr("value", productionForm.totalCostLabel)} maxlength="80"${attr("placeholder", isCollectiveServiceProject(data.projectMode) ? "Shared cost or capacity note" : "Total cost")} class="svelte-bd1lq"/> <textarea rows="3"${attr("placeholder", isCollectiveServiceProject(data.projectMode) ? "Spaces, tools, software, or other resources required" : "Specific acquisitions, for example land, tools, or storage")} class="svelte-bd1lq">`);
          const $$body_4 = escape_html(productionForm.acquisitionsSummary);
          if ($$body_4) {
            $$renderer2.push(`${$$body_4}`);
          }
          $$renderer2.push(`</textarea> <div class="composer-actions svelte-bd1lq"><button class="secondary-button svelte-bd1lq" type="button">Cancel</button> <button class="primary-button svelte-bd1lq" type="button">${escape_html(phaseTwoSubmitLabel())}</button></div></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]-->`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="surface-stack svelte-bd1lq">`);
      if (data.lifecycle.phaseTwo.plans.length === 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="empty-card svelte-bd1lq">No ${escape_html(isCollectiveServiceProject(data.projectMode) ? "operations" : "production")} plans submitted yet.</div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<!--[-->`);
        const each_array_7 = ensure_array_like(data.lifecycle.phaseTwo.plans);
        for (let $$index_8 = 0, $$length = each_array_7.length; $$index_8 < $$length; $$index_8++) {
          let plan = each_array_7[$$index_8];
          $$renderer2.push(`<article class="surface-card plan-card svelte-bd1lq"><div class="plan-header svelte-bd1lq"><div><strong class="svelte-bd1lq">${escape_html(plan.title)}</strong> <span class="svelte-bd1lq">${escape_html(plan.authorUsername)} · ${escape_html(formatRelativeTime(plan.createdAt))}</span></div> `);
          if (plan.isLeading) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<span class="phase-badge complete svelte-bd1lq">Leading above quorum</span>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></div> <div class="plan-grid svelte-bd1lq"><div><strong class="svelte-bd1lq">${escape_html(isCollectiveServiceProject(data.projectMode) ? "Operating model" : "Output")}</strong> <p class="svelte-bd1lq">${escape_html(plan.outputSummary)}</p></div> <div><strong class="svelte-bd1lq">${escape_html(isCollectiveServiceProject(data.projectMode) ? "Cadence & staffing" : "Inputs & materials")}</strong> <p class="svelte-bd1lq">${escape_html(plan.materialsSummary)}</p></div> <div><strong class="svelte-bd1lq">${escape_html(isCollectiveServiceProject(data.projectMode) ? "Shared cost or capacity" : "Total cost")}</strong> <p class="svelte-bd1lq">${escape_html(plan.totalCostLabel)}</p></div> <div><strong class="svelte-bd1lq">${escape_html(isCollectiveServiceProject(data.projectMode) ? "Resources needed" : "Acquisitions")}</strong> <p class="svelte-bd1lq">${escape_html(plan.acquisitionsSummary)}</p></div></div> <div class="assessment-stack svelte-bd1lq"><!--[-->`);
          const each_array_8 = ensure_array_like(plan.valueAssessments);
          for (let $$index_7 = 0, $$length2 = each_array_8.length; $$index_7 < $$length2; $$index_7++) {
            let assessment = each_array_8[$$index_7];
            $$renderer2.push(`<div class="assessment-row svelte-bd1lq"><div><strong class="svelte-bd1lq">${escape_html(assessment.valueLabel)}</strong> <span class="svelte-bd1lq">${escape_html(assessment.approvalPercent)}% yes · ${escape_html(assessment.yesCount)} yes / ${escape_html(assessment.noCount)} no</span></div> <div class="binary-row svelte-bd1lq"><button${attr_class("vote-chip svelte-bd1lq", void 0, { "selected": assessment.activeVote === "yes" })}${attr("disabled", !data.lifecycle.phaseTwo.viewerCanVoteOnPlans, true)} type="button">Yes</button> <button${attr_class("vote-chip negative svelte-bd1lq", void 0, { "selected": assessment.activeVote === "no" })}${attr("disabled", !data.lifecycle.phaseTwo.viewerCanVoteOnPlans, true)} type="button">No</button></div></div>`);
          }
          $$renderer2.push(`<!--]--></div> <div class="overall-row svelte-bd1lq"><div><strong class="svelte-bd1lq">Overall approval</strong> <span class="svelte-bd1lq">${escape_html(plan.overallApproval.approvalPercent)}% yes · ${escape_html(plan.overallApproval.yesCount)} yes / ${escape_html(plan.overallApproval.noCount)} no</span></div> <div class="binary-row svelte-bd1lq"><button${attr_class("vote-chip svelte-bd1lq", void 0, { "selected": plan.overallApproval.activeVote === "yes" })}${attr("disabled", !data.lifecycle.phaseTwo.viewerCanVoteOnPlans, true)} type="button">Approve</button> <button${attr_class("vote-chip negative svelte-bd1lq", void 0, { "selected": plan.overallApproval.activeVote === "no" })}${attr("disabled", !data.lifecycle.phaseTwo.viewerCanVoteOnPlans, true)} type="button">Reject</button></div></div></article>`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div></section>`);
    } else if (activePhase.id === "phase-3") {
      $$renderer2.push("<!--[4-->");
      $$renderer2.push(`<section class="phase-surface svelte-bd1lq"><div class="surface-header svelte-bd1lq"><div><h3 class="svelte-bd1lq">${escape_html(phaseThreeHeading())}</h3> <p class="svelte-bd1lq">${escape_html(phaseThreeDescription())}</p></div></div> `);
      if (data.lifecycle.phaseThree.viewerCanSubmitPlans) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="composer-toggle-row svelte-bd1lq"><button${attr("aria-expanded", showPhaseThreeComposer)}${attr_class("plus-button svelte-bd1lq", void 0, { "active-plus": showPhaseThreeComposer })} type="button">+</button></div> `);
        if (showPhaseThreeComposer) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="composer-card svelte-bd1lq"><input${attr("value", distributionForm.title)} maxlength="120" placeholder="Plan title" class="svelte-bd1lq"/> <textarea rows="3"${attr("placeholder", isCollectiveServiceProject(data.projectMode) ? "How should access to the service be organized?" : "How should the output be distributed?")} class="svelte-bd1lq">`);
          const $$body_5 = escape_html(distributionForm.distributionSummary);
          if ($$body_5) {
            $$renderer2.push(`${$$body_5}`);
          }
          $$renderer2.push(`</textarea> <textarea rows="3"${attr("placeholder", isCollectiveServiceProject(data.projectMode) ? "Who gets access and under what conditions?" : "Who gets access and under what conditions?")} class="svelte-bd1lq">`);
          const $$body_6 = escape_html(distributionForm.accessSummary);
          if ($$body_6) {
            $$renderer2.push(`${$$body_6}`);
          }
          $$renderer2.push(`</textarea> <textarea rows="3"${attr("placeholder", isCollectiveServiceProject(data.projectMode) ? "Anything held back, capped, or reserved between cycles?" : "Anything reserved, stockpiled, or held back?")} class="svelte-bd1lq">`);
          const $$body_7 = escape_html(distributionForm.reserveSummary);
          if ($$body_7) {
            $$renderer2.push(`${$$body_7}`);
          }
          $$renderer2.push(`</textarea> `);
          if (isCollectiveServiceProject(data.projectMode)) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<label class="checkbox-row svelte-bd1lq"><input${attr("checked", distributionForm.requestSystemEnabled, true)} type="checkbox" class="svelte-bd1lq"/> <span class="svelte-bd1lq">Allow users to request the service in Phase 5</span></label>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--> <div class="composer-actions svelte-bd1lq"><button class="secondary-button svelte-bd1lq" type="button">Cancel</button> <button class="primary-button svelte-bd1lq" type="button">${escape_html(phaseThreeSubmitLabel())}</button></div></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]-->`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="surface-stack svelte-bd1lq">`);
      if (data.lifecycle.phaseThree.plans.length === 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="empty-card svelte-bd1lq">No ${escape_html(isCollectiveServiceProject(data.projectMode) ? "access" : "distribution")} plans submitted yet.</div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<!--[-->`);
        const each_array_9 = ensure_array_like(data.lifecycle.phaseThree.plans);
        for (let $$index_10 = 0, $$length = each_array_9.length; $$index_10 < $$length; $$index_10++) {
          let plan = each_array_9[$$index_10];
          $$renderer2.push(`<article class="surface-card plan-card svelte-bd1lq"><div class="plan-header svelte-bd1lq"><div><strong class="svelte-bd1lq">${escape_html(plan.title)}</strong> <span class="svelte-bd1lq">${escape_html(plan.authorUsername)} · ${escape_html(formatRelativeTime(plan.createdAt))}</span></div> `);
          if (plan.isLeading) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<span class="phase-badge complete svelte-bd1lq">Leading above quorum</span>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></div> <div class="plan-grid single-column svelte-bd1lq"><div><strong class="svelte-bd1lq">${escape_html(isCollectiveServiceProject(data.projectMode) ? "Service flow" : "Distribution")}</strong> <p class="svelte-bd1lq">${escape_html(plan.distributionSummary)}</p></div> <div><strong class="svelte-bd1lq">Access</strong> <p class="svelte-bd1lq">${escape_html(plan.accessSummary)}</p></div> <div><strong class="svelte-bd1lq">${escape_html(isCollectiveServiceProject(data.projectMode) ? "Reserve or limits" : "Reserve or stockpile")}</strong> <p class="svelte-bd1lq">${escape_html(plan.reserveSummary)}</p></div> `);
          if (isCollectiveServiceProject(data.projectMode)) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<div><strong class="svelte-bd1lq">Request system</strong> <p class="svelte-bd1lq">${escape_html(plan.requestSystemEnabled ? "Enabled in Phase 5" : "Disabled for this cycle")}</p></div>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></div> <div class="assessment-stack svelte-bd1lq"><!--[-->`);
          const each_array_10 = ensure_array_like(plan.valueAssessments);
          for (let $$index_9 = 0, $$length2 = each_array_10.length; $$index_9 < $$length2; $$index_9++) {
            let assessment = each_array_10[$$index_9];
            $$renderer2.push(`<div class="assessment-row svelte-bd1lq"><div><strong class="svelte-bd1lq">${escape_html(assessment.valueLabel)}</strong> <span class="svelte-bd1lq">${escape_html(assessment.approvalPercent)}% yes · ${escape_html(assessment.yesCount)} yes / ${escape_html(assessment.noCount)} no</span></div> <div class="binary-row svelte-bd1lq"><button${attr_class("vote-chip svelte-bd1lq", void 0, { "selected": assessment.activeVote === "yes" })}${attr("disabled", !data.lifecycle.phaseThree.viewerCanVoteOnPlans, true)} type="button">Yes</button> <button${attr_class("vote-chip negative svelte-bd1lq", void 0, { "selected": assessment.activeVote === "no" })}${attr("disabled", !data.lifecycle.phaseThree.viewerCanVoteOnPlans, true)} type="button">No</button></div></div>`);
          }
          $$renderer2.push(`<!--]--></div> <div class="overall-row svelte-bd1lq"><div><strong class="svelte-bd1lq">Overall approval</strong> <span class="svelte-bd1lq">${escape_html(plan.overallApproval.approvalPercent)}% yes · ${escape_html(plan.overallApproval.yesCount)} yes / ${escape_html(plan.overallApproval.noCount)} no</span></div> <div class="binary-row svelte-bd1lq"><button${attr_class("vote-chip svelte-bd1lq", void 0, { "selected": plan.overallApproval.activeVote === "yes" })}${attr("disabled", !data.lifecycle.phaseThree.viewerCanVoteOnPlans, true)} type="button">Approve</button> <button${attr_class("vote-chip negative svelte-bd1lq", void 0, { "selected": plan.overallApproval.activeVote === "no" })}${attr("disabled", !data.lifecycle.phaseThree.viewerCanVoteOnPlans, true)} type="button">Reject</button></div></div></article>`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div></section>`);
    } else if (activePhase.id === "phase-4") {
      $$renderer2.push("<!--[5-->");
      $$renderer2.push(`<section class="phase-surface svelte-bd1lq"><div class="empty-card locked-card svelte-bd1lq">Acquisition exists in the target lifecycle, but funding and resource acquisition are intentionally unavailable in this beta.</div></section>`);
    } else if (activePhase.id === "phase-5") {
      $$renderer2.push("<!--[6-->");
      $$renderer2.push(`<section class="phase-surface svelte-bd1lq"><div class="surface-header svelte-bd1lq"><div><h3 class="svelte-bd1lq">Scheduling and activities</h3> <p class="svelte-bd1lq">${escape_html(isCollectiveServiceProject(data.projectMode) ? "Managers schedule service activity here. Any enabled request system also stays visible during the active cycle." : "This is the only place activities can be created. An activity only activates once all required roles are filled.")}</p></div></div> `);
      if (data.lifecycle.requestSystem?.enabled) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="mechanics-card request-card-shell svelte-bd1lq"><div class="request-header-row svelte-bd1lq"><div><h3 class="svelte-bd1lq">Service requests</h3> <p class="svelte-bd1lq">${escape_html(data.lifecycle.requestSystem.requestCount)} active request${escape_html(data.lifecycle.requestSystem.requestCount === 1 ? "" : "s")}</p></div> <span class="phase-badge current svelte-bd1lq">Requests open</span></div> `);
        if (data.lifecycle.requestSystem.viewerCanSubmitRequests) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="composer-card svelte-bd1lq"><input${attr("value", serviceRequestForm.title)} maxlength="120" placeholder="Request title" class="svelte-bd1lq"/> <textarea rows="3" placeholder="What service is being requested?" class="svelte-bd1lq">`);
          const $$body_8 = escape_html(serviceRequestForm.body);
          if ($$body_8) {
            $$renderer2.push(`${$$body_8}`);
          }
          $$renderer2.push(`</textarea> <div class="composer-actions svelte-bd1lq"><button class="primary-button svelte-bd1lq" type="button">Create request</button></div></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> <div class="surface-stack svelte-bd1lq">`);
        if (data.lifecycle.requestSystem.requests.length === 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="empty-card svelte-bd1lq">No requests yet.</div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
          $$renderer2.push(`<!--[-->`);
          const each_array_11 = ensure_array_like(data.lifecycle.requestSystem.requests);
          for (let $$index_11 = 0, $$length = each_array_11.length; $$index_11 < $$length; $$index_11++) {
            let request = each_array_11[$$index_11];
            $$renderer2.push(`<article class="surface-card request-card svelte-bd1lq"><div class="request-header-row svelte-bd1lq"><div><strong class="svelte-bd1lq">${escape_html(request.title)}</strong> <span class="svelte-bd1lq">${escape_html(formatRelativeTime(request.createdAt))}</span></div> <span${attr_class(
              `phase-badge ${request.status === "accepted" ? "complete" : request.status === "declined" ? "locked" : "upcoming"}`,
              "svelte-bd1lq"
            )}>${escape_html(requestStatusLabel(request.status))}</span></div> <p class="svelte-bd1lq">${escape_html(request.body)}</p></article>`);
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]--></div></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (data.lifecycle.phaseFive.viewerCanCreateActivities) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="composer-card svelte-bd1lq"><input${attr("value", activityForm.title)} maxlength="120" placeholder="Activity title" class="svelte-bd1lq"/> <input${attr("value", activityForm.scheduledAt)} type="datetime-local" class="svelte-bd1lq"/> <input${attr("value", activityForm.locationLabel)} maxlength="120" placeholder="Location" class="svelte-bd1lq"/> <input${attr("value", activityForm.roleLabels)} maxlength="160" placeholder="Roles needed, comma separated" class="svelte-bd1lq"/> <input${attr("value", activityForm.minimumParticipants)} min="1" type="number" class="svelte-bd1lq"/> <textarea rows="3" placeholder="What needs to happen and why?" class="svelte-bd1lq">`);
        const $$body_9 = escape_html(activityForm.note);
        if ($$body_9) {
          $$renderer2.push(`${$$body_9}`);
        }
        $$renderer2.push(`</textarea> <div class="composer-actions svelte-bd1lq"><button class="primary-button svelte-bd1lq" type="button">Create activity</button></div></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="surface-stack svelte-bd1lq">`);
      if (data.lifecycle.phaseFive.activities.length === 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="empty-card svelte-bd1lq">No activities scheduled yet.</div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<!--[-->`);
        const each_array_12 = ensure_array_like(data.lifecycle.phaseFive.activities);
        for (let $$index_13 = 0, $$length = each_array_12.length; $$index_13 < $$length; $$index_13++) {
          let activity = each_array_12[$$index_13];
          $$renderer2.push(`<article class="surface-card activity-card svelte-bd1lq"><div class="plan-header svelte-bd1lq"><div><strong class="svelte-bd1lq">${escape_html(activity.title)}</strong> <span class="svelte-bd1lq">${escape_html(activity.authorUsername)} · ${escape_html(new Date(activity.scheduledAt).toLocaleString())}</span></div> <span${attr_class(`phase-badge ${activity.isActive ? "complete" : "upcoming"}`, "svelte-bd1lq")}>${escape_html(activity.isActive ? "Active" : "Pending roles")}</span></div> <p class="svelte-bd1lq">${escape_html(activity.note)}</p> <div class="activity-meta svelte-bd1lq"><span class="svelte-bd1lq">${escape_html(activity.locationLabel)}</span> <span class="svelte-bd1lq">${escape_html(activity.committedCount)}/${escape_html(activity.minimumParticipants)} participants committed</span></div> <div class="role-grid svelte-bd1lq"><!--[-->`);
          const each_array_13 = ensure_array_like(activity.roles);
          for (let $$index_12 = 0, $$length2 = each_array_13.length; $$index_12 < $$length2; $$index_12++) {
            let role = each_array_13[$$index_12];
            $$renderer2.push(`<div class="meta-card role-card svelte-bd1lq"><strong class="svelte-bd1lq">${escape_html(role.label)}</strong> <span class="svelte-bd1lq">${escape_html(role.filledCount)}/${escape_html(role.requiredCount)} filled</span></div>`);
          }
          $$renderer2.push(`<!--]--></div></article>`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div></section>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<section class="phase-surface svelte-bd1lq"><div class="empty-card svelte-bd1lq">${escape_html(completionPhaseCopy())}</div></section>`);
    }
    $$renderer2.push(`<!--]--> `);
    if (data.lifecycle.viewerCanRevertPhase && activePhase.id === data.lifecycle.currentPhaseId) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="mechanics-card revert-card-shell svelte-bd1lq"><div class="request-header-row svelte-bd1lq"><div><h3 class="svelte-bd1lq">Return to planning</h3> <p class="svelte-bd1lq">Managers can send the current project back to an earlier plan phase, but a reason is required.</p></div> <button class="secondary-button svelte-bd1lq" type="button">${escape_html("Revert with reason")}</button></div> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (data.lifecycle.revertHistory.length > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="surface-stack svelte-bd1lq"><!--[-->`);
        const each_array_15 = ensure_array_like(data.lifecycle.revertHistory);
        for (let $$index_15 = 0, $$length = each_array_15.length; $$index_15 < $$length; $$index_15++) {
          let entry = each_array_15[$$index_15];
          $$renderer2.push(`<article class="surface-card request-card svelte-bd1lq"><div class="request-header-row svelte-bd1lq"><div><strong class="svelte-bd1lq">${escape_html(revertTargetLabel(entry.targetPhaseId))}</strong> <span class="svelte-bd1lq">${escape_html(entry.authorUsername)} · ${escape_html(formatRelativeTime(entry.createdAt))}</span></div></div> <p class="svelte-bd1lq">${escape_html(entry.reason)}</p></article>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.lifecycle.viewerCanAdvancePhase && activePhase.id === data.lifecycle.currentPhaseId && advanceLabel()) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="advance-row svelte-bd1lq"><button class="primary-button svelte-bd1lq" type="button">${escape_html(advanceLabel())}</button></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></section></section>`);
    bind_props($$props, { data });
  });
}
function ProjectChatTab($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let messages;
    let data = $$props["data"];
    let highlightedCommentId = fallback($$props["highlightedCommentId"], null);
    let draftMessage = "";
    function flattenComments(items) {
      const flattened = [];
      for (const item of items) {
        flattened.push({
          id: item.id,
          authorUsername: item.authorUsername,
          body: item.body,
          createdAt: item.createdAt
        });
        flattened.push(...flattenComments(item.replies));
      }
      return flattened;
    }
    messages = flattenComments(data.discussion).sort((left, right) => +new Date(left.createdAt) - +new Date(right.createdAt));
    $$renderer2.push(`<section class="chat-shell svelte-1xz5wzc"><header class="chat-header svelte-1xz5wzc"><h2 class="svelte-1xz5wzc"># project-chat</h2> <p class="svelte-1xz5wzc">${escape_html(data.discussionNote)}</p></header> <div class="chat-log svelte-1xz5wzc">`);
    if (messages.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="empty-copy svelte-1xz5wzc">No project chat yet.</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<!--[-->`);
      const each_array = ensure_array_like(messages);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let message = each_array[$$index];
        $$renderer2.push(`<article${attr("id", `comment-${message.id}`)}${attr_class("message-row svelte-1xz5wzc", void 0, { "highlighted": highlightedCommentId === message.id })}><div class="avatar-pill svelte-1xz5wzc">${escape_html(message.authorUsername.slice(0, 2).toUpperCase())}</div> <div class="message-copy"><div class="meta-row svelte-1xz5wzc"><a class="author-link svelte-1xz5wzc"${attr("href", `/profile/${message.authorUsername}`)}>${escape_html(message.authorUsername)}</a> <span class="svelte-1xz5wzc">${escape_html(formatRelativeTime(message.createdAt))}</span></div> <p class="svelte-1xz5wzc">${escape_html(message.body)}</p></div></article>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div> <footer class="composer-row svelte-1xz5wzc"><textarea rows="3" placeholder="Message the project..." class="svelte-1xz5wzc">`);
    const $$body = escape_html(draftMessage);
    if ($$body) {
      $$renderer2.push(`${$$body}`);
    }
    $$renderer2.push(`</textarea> <button class="send-button svelte-1xz5wzc" type="button">Send</button></footer></section>`);
    bind_props($$props, { data, highlightedCommentId });
  });
}
function ProjectOverviewHeader($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let combinedTags, demandButtonLabel;
    let data = $$props["data"];
    combinedTags = [...data.channelTags, ...data.communityTags];
    demandButtonLabel = data.lifecycle.phaseOne.viewerHasDemandSignal ? `${data.signalCount}` : `+${data.signalCount}`;
    $$renderer2.push(`<div class="header-row svelte-1wx2oah"><div class="chips svelte-1wx2oah">`);
    SubjectTablet($$renderer2, { kind: "project", projectMode: data.projectMode });
    $$renderer2.push(`<!----></div> <div class="tag-stack svelte-1wx2oah">`);
    TagList($$renderer2, { columns: 4, tags: combinedTags });
    $$renderer2.push(`<!----></div></div> <h1 class="svelte-1wx2oah">${escape_html(data.title)}</h1> <p class="overview-copy svelte-1wx2oah">${escape_html(data.overview)}</p> <section class="meta-block svelte-1wx2oah" aria-label="Project overview details"><ul class="project-meta-list svelte-1wx2oah">`);
    if (supportsProjectDemandSignals(data.projectMode)) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<li class="meta-item demand-item svelte-1wx2oah"><strong class="svelte-1wx2oah">Demand</strong> <button${attr("aria-pressed", data.lifecycle.phaseOne.viewerHasDemandSignal)}${attr_class("demand-button svelte-1wx2oah", void 0, {
        "active-demand": data.lifecycle.phaseOne.viewerHasDemandSignal
      })} type="button">${escape_html(demandButtonLabel)}</button></li>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.lifecycle.supportsPlanning) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<li class="meta-item svelte-1wx2oah"><strong class="svelte-1wx2oah">Threshold</strong> <span class="svelte-1wx2oah">${escape_html(data.lifecycle.quorumThresholdPercent)}% approval</span></li>`);
    } else if (data.lifecycle.personalService) {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<li class="meta-item svelte-1wx2oah"><strong class="svelte-1wx2oah">Availability</strong> <span class="svelte-1wx2oah">${escape_html(data.lifecycle.personalService.availabilitySummary)}</span></li>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <li class="meta-item svelte-1wx2oah"><strong class="svelte-1wx2oah">Location</strong> <span class="svelte-1wx2oah">${escape_html(data.locationLabel)}</span></li> `);
    if (data.lifecycle.personalService?.travelRadiusLabel) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<li class="meta-item svelte-1wx2oah"><strong class="svelte-1wx2oah">Travel Radius</strong> <span class="svelte-1wx2oah">${escape_html(data.lifecycle.personalService.travelRadiusLabel)}</span></li>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <li class="meta-item svelte-1wx2oah"><strong class="svelte-1wx2oah">Members</strong> <span class="svelte-1wx2oah">${escape_html(data.memberCount)}</span></li></ul></section>`);
    bind_props($$props, { data });
  });
}
function ProjectUpdatesSection($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    let highlightedUpdateId = fallback($$props["highlightedUpdateId"], null);
    let showMembersPanel = fallback($$props["showMembersPanel"], false);
    let showUpdateComposer = false;
    $$renderer2.push(`<section class="updates-shell svelte-13uefs6" id="updates"><div class="updates-title-row svelte-13uefs6"><h2 class="svelte-13uefs6">Updates</h2> `);
    if (data.viewerIsProjectManager) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button${attr("aria-expanded", showUpdateComposer)}${attr_class("plus-button svelte-13uefs6", void 0, { "active-plus": showUpdateComposer })} type="button">+</button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    if (data.viewerIsProjectManager && showUpdateComposer) ;
    else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="stack svelte-13uefs6">`);
    if (data.updates.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="empty-card svelte-13uefs6"><p class="svelte-13uefs6">No updates yet.</p></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<!--[-->`);
      const each_array = ensure_array_like(data.updates);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let update = each_array[$$index];
        DetailUpdateCard($$renderer2, { update, highlightedUpdateId });
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div> <div class="overview-footer-row svelte-13uefs6">`);
    VoteStrip($$renderer2, { activeVote: data.activeVote, count: data.voteCount });
    $$renderer2.push(`<!----> <button${attr("aria-expanded", showMembersPanel)}${attr_class("secondary-button member-toggle-button svelte-13uefs6", void 0, { "active-toggle": showMembersPanel })} type="button">Members / Managers</button> <span class="footer-author-row svelte-13uefs6"><a class="inline-link svelte-13uefs6"${attr("href", `/profile/${data.authorUsername}`)}>${escape_html(data.authorUsername)}</a> · ${escape_html(formatRelativeTime(data.createdAt))}</span></div></section>`);
    bind_props($$props, { data, highlightedUpdateId, showMembersPanel });
  });
}
function ProjectDetailPage($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let data = $$props["data"];
    let highlightedCommentId = null;
    let highlightedUpdateId = null;
    let lastRouteSignature = "";
    let showMembersPanel = false;
    let activeTab = "overview";
    function readCommentTarget(url) {
      if (url.hash.startsWith("#comment-")) {
        return url.hash.slice("#comment-".length) || null;
      }
      return url.searchParams.get("comment");
    }
    function readUpdateTarget(url) {
      if (url.hash.startsWith("#update-")) {
        return url.hash.slice("#update-".length) || null;
      }
      return url.searchParams.get("update");
    }
    {
      const routeSignature = `${store_get($$store_subs ??= {}, "$page", page).url.pathname}${store_get($$store_subs ??= {}, "$page", page).url.search}${store_get($$store_subs ??= {}, "$page", page).url.hash}`;
      if (routeSignature !== lastRouteSignature) {
        lastRouteSignature = routeSignature;
        highlightedCommentId = readCommentTarget(store_get($$store_subs ??= {}, "$page", page).url);
        highlightedUpdateId = readUpdateTarget(store_get($$store_subs ??= {}, "$page", page).url);
        activeTab = store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("tab") === "chat" ? "chat" : "overview";
      }
    }
    $$renderer2.push(`<section class="page svelte-d9rl0p"><section class="hero-card svelte-d9rl0p"><div class="top-tab-row svelte-d9rl0p" role="tablist" aria-label="Project detail tabs"><button${attr_class("top-tab svelte-d9rl0p", void 0, { "active-tab": activeTab === "overview" })} role="tab" type="button">Overview</button> <button${attr_class("top-tab svelte-d9rl0p", void 0, { "active-tab": activeTab === "chat" })} role="tab" type="button">Chat</button></div> `);
    if (activeTab === "overview") {
      $$renderer2.push("<!--[0-->");
      ProjectOverviewHeader($$renderer2, { data });
      $$renderer2.push(`<!----> `);
      ProjectUpdatesSection($$renderer2, { data, highlightedUpdateId, showMembersPanel });
      $$renderer2.push(`<!----> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      ProjectLifecyclePanel($$renderer2, { data });
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[-1-->");
      ProjectChatTab($$renderer2, { data, highlightedCommentId });
    }
    $$renderer2.push(`<!--]--></section></section>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
    bind_props($$props, { data });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    ProjectDetailPage($$renderer2, { data: data.project });
    bind_props($$props, { data });
  });
}
export {
  _page as default
};
