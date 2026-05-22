import { d as bind_props, f as fallback, e as escape_html, b as attr_class, c as attr, a as ensure_array_like, g as attr_style, s as store_get, u as unsubscribe_stores } from "../../../../chunks/renderer.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/root.js";
import "../../../../chunks/state.svelte.js";
import { p as page } from "../../../../chunks/stores.js";
import { L as LiveChatPanel } from "../../../../chunks/LiveChatPanel.js";
import { i as invalidateAll, g as goto } from "../../../../chunks/client.js";
import { D as DecisionHistoryList, V as VoteCardFooter, t as tick, P as ProjectActivityCalendarCard, a as ProjectActivityRolesEditor, C as CollapsibleActivityCard, b as CollapsiblePlanCard, c as ProjectValueCard, S as ShareUserMenu, d as DetailUpdateCard } from "../../../../chunks/DetailUpdateCard.js";
import { s as setEventEditVote, a as setEventUpdateVote, b as setEventPhaseChangeVote, c as setEventActivityCommitment, d as addEventActivity, e as setEventPlanOverallVote, f as setEventPlanValueVote, g as addEventPlan, h as setEventValueImportance, i as addEventValue, r as requestEventPhaseChange, j as shareEventWithUser } from "../../../../chunks/details.js";
import { C as CountBadge } from "../../../../chunks/CountBadge.js";
import { f as formatProjectVoteRequirement, a as formatProjectVoteSummary, s as suggestedEventActivityWindow, e as eventScheduleDayBounds, b as eventActivityFitsSchedule, c as eventScheduleBounds, d as eventScheduleIsValid, g as eventScheduleStartsInFuture } from "../../../../chunks/data.js";
import "clsx";
import { R as RoundPlusButton } from "../../../../chunks/RoundPlusButton.js";
import { R as ReportControl } from "../../../../chunks/ReportControl.js";
import { S as SubjectTablet, T as Tablet } from "../../../../chunks/SubjectTablet.js";
import { T as TagList } from "../../../../chunks/TagList.js";
import { V as VoteStrip } from "../../../../chunks/VoteStrip.js";
import { a as formatRelativeTime } from "../../../../chunks/time.js";
function EventHistoryTab($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    async function handleVote(entry, vote) {
      switch (entry.kind) {
        case "event-phase-change":
          await setEventPhaseChangeVote(data.slug, entry.id, vote);
          break;
        case "event-update":
          await setEventUpdateVote(data.slug, entry.id, vote);
          break;
        case "event-edit":
          await setEventEditVote(data.slug, entry.id, vote);
          break;
        default:
          return;
      }
      await invalidateAll();
    }
    DecisionHistoryList($$renderer2, {
      title: "History",
      description: "Open, approved, and rejected event decisions stay here in one timeline. Open decisions can still be voted from this tab.",
      entries: data.history,
      emptyMessage: "No event decision history yet.",
      onVote: handleVote
    });
    bind_props($$props, { data });
  });
}
function EventLifecycleMechanicsCard($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let inlineSubtitle;
    let phase = $$props["phase"];
    let progressLabel = fallback($$props["progressLabel"], "");
    let showHowItWorks = fallback($$props["showHowItWorks"], false);
    function phaseSubtitle(summary) {
      const firstSentence = summary.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
      return firstSentence && firstSentence.length > 0 ? firstSentence : summary.trim();
    }
    inlineSubtitle = phaseSubtitle(phase.summary);
    $$renderer2.push(`<div class="phase-header svelte-mfkt8p"><div class="phase-line svelte-mfkt8p"><span class="phase-kicker svelte-mfkt8p">${escape_html(phase.shortLabel)}</span> <div class="phase-badges svelte-mfkt8p"><span${attr_class(`phase-badge ${phase.progressState}`, "svelte-mfkt8p")}>${escape_html(progressLabel)}</span> `);
    if (phase.betaLocked) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span class="phase-badge locked svelte-mfkt8p">Coming later</span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div></div> <div class="phase-copy svelte-mfkt8p"><div class="phase-title-row svelte-mfkt8p"><h2 class="svelte-mfkt8p">${escape_html(phase.title)}</h2></div> <div class="phase-subtitle-row svelte-mfkt8p"><p class="phase-subtitle svelte-mfkt8p">${escape_html(inlineSubtitle)}</p> <button class="phase-help-button svelte-mfkt8p" type="button"${attr("aria-label", showHowItWorks ? "Hide how it works" : "Show how it works")}${attr("aria-expanded", showHowItWorks)}>?</button></div></div></div> `);
    if (showHowItWorks) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="mechanics-card svelte-mfkt8p"><div class="mechanics-body svelte-mfkt8p"><p class="svelte-mfkt8p">${escape_html(phase.summary)}</p> `);
      if (phase.note) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<p${attr_class("phase-note svelte-mfkt8p", void 0, { "locked-copy": phase.progressState === "locked" })}>${escape_html(phase.note)}</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <ul class="phase-list svelte-mfkt8p"><!--[-->`);
      const each_array = ensure_array_like(phase.mechanics);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let mechanic = each_array[$$index];
        $$renderer2.push(`<li class="svelte-mfkt8p">${escape_html(mechanic)}</li>`);
      }
      $$renderer2.push(`<!--]--></ul></div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { phase, progressLabel, showHowItWorks });
  });
}
function EventLifecyclePhaseTabs($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let tabs = fallback($$props["tabs"], () => [], true);
    let activePhaseId = $$props["activePhaseId"];
    let selectPhase = fallback($$props["selectPhase"], () => {
    });
    $$renderer2.push(`<section class="phase-tab-row svelte-1cnvnef"${attr_style(`grid-template-columns: repeat(${tabs.length}, minmax(0, 1fr))`)}><!--[-->`);
    const each_array = ensure_array_like(tabs);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let tab = each_array[$$index];
      $$renderer2.push(`<button${attr_class("phase-tab svelte-1cnvnef", void 0, {
        "active": activePhaseId === tab.phase.id,
        "current-phase": tab.phase.progressState === "current",
        "future-phase": tab.isFuture && tab.phase.progressState !== "locked",
        "locked-phase": tab.phase.progressState === "locked"
      })} type="button"><span class="phase-tab-number svelte-1cnvnef">${escape_html(tab.phase.shortLabel)}</span> <span class="phase-tab-title svelte-1cnvnef">${escape_html(tab.title)}</span> <small${attr_class("svelte-1cnvnef", void 0, { "current-label": tab.phase.progressState === "current" })}>${escape_html(tab.progressLabel)}</small></button>`);
    }
    $$renderer2.push(`<!--]--></section>`);
    bind_props($$props, { tabs, activePhaseId, selectPhase });
  });
}
function EventPhaseChangeSection($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let currentPhaseVisible, returnRequests, nextVoteKind, nextActionRequests, showReturnActions, showNextActions;
    let data = $$props["data"];
    let activePhaseId = $$props["activePhaseId"];
    let canAdvanceCurrentPhase = fallback($$props["canAdvanceCurrentPhase"], false);
    let phaseChangeReason = fallback($$props["phaseChangeReason"], "");
    let requestPhaseChange = fallback($$props["requestPhaseChange"], () => {
    });
    let voteOnPhaseChange = fallback($$props["voteOnPhaseChange"], () => {
    });
    let showNextPhaseComposer = false;
    let showRevertComposer = false;
    let nextPhaseReason = "";
    let revertReason = "";
    let revertTargetPhaseId = "event-plan";
    let expandedVoteGroup = null;
    function requestKindLabel(request) {
      switch (request.kind) {
        case "close":
          return "Close decision";
        case "return":
          return "Return decision";
        default:
          return "Advance decision";
      }
    }
    function nextPhaseActionLabel() {
      if (!data.lifecycle.nextPhaseId) {
        return null;
      }
      return data.lifecycle.nextPhaseId === "closed" ? "Close" : "Advance";
    }
    function nextPhasePlaceholder() {
      return data.lifecycle.nextPhaseId === "closed" ? "State why the event should close or what record should stay visible." : "State why this event should move forward now.";
    }
    function revertPhasePlaceholder() {
      return revertTargetPhaseId === "proposal" ? "State clearly why the event should return to proposal." : revertTargetPhaseId === "event-plan" ? "State clearly why the event should return to planning." : "State clearly why the event should return to the selected phase.";
    }
    function revertTargetLabel(phaseId) {
      switch (phaseId) {
        case "proposal":
          return "Proposal";
        case "event-plan":
          return "Event Plan";
        case "activity":
          return "Activity";
        default:
          return "Closed";
      }
    }
    currentPhaseVisible = activePhaseId === data.lifecycle.currentPhaseId;
    returnRequests = data.lifecycle.phaseChangeRequests.filter((request) => request.kind === "return");
    nextVoteKind = data.lifecycle.nextPhaseId === "closed" ? "close" : "advance";
    nextActionRequests = data.lifecycle.phaseChangeRequests.filter((request) => request.kind === nextVoteKind);
    showReturnActions = data.lifecycle.revertablePhaseIds.length > 0 || returnRequests.length > 0;
    showNextActions = !!data.lifecycle.nextPhaseId || nextActionRequests.length > 0;
    if (!data.lifecycle.revertablePhaseIds.includes(revertTargetPhaseId)) {
      revertTargetPhaseId = data.lifecycle.revertablePhaseIds[0] ?? "event-plan";
    }
    if (!currentPhaseVisible) {
      showNextPhaseComposer = false;
      showRevertComposer = false;
      expandedVoteGroup = null;
    }
    if (currentPhaseVisible && (data.lifecycle.phaseChangeRequests.length > 0 || data.lifecycle.viewerCanRequestPhaseChanges)) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="phase-change-stack svelte-mgqsv0">`);
      if (showReturnActions || showNextActions) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="change-action-row svelte-mgqsv0"><div class="action-group action-group-left svelte-mgqsv0">`);
        if (data.lifecycle.viewerCanRequestPhaseChanges && data.lifecycle.revertablePhaseIds.length > 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<button${attr_class("secondary-button action-button svelte-mgqsv0", void 0, { "active-toggle": showRevertComposer })} type="button">Return</button>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (returnRequests.length > 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<button class="vote-chip notice-chip svelte-mgqsv0" type="button">Vote Active `);
          CountBadge($$renderer2, { count: returnRequests.length });
          $$renderer2.push(`<!----></button>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div> <div class="action-group action-group-right svelte-mgqsv0">`);
        if (nextActionRequests.length > 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<button class="vote-chip notice-chip svelte-mgqsv0" type="button">Vote Active `);
          CountBadge($$renderer2, { count: nextActionRequests.length });
          $$renderer2.push(`<!----></button>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (data.lifecycle.viewerCanRequestPhaseChanges && data.lifecycle.nextPhaseId) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<button${attr_class("secondary-button action-button svelte-mgqsv0", void 0, { "active-toggle": showNextPhaseComposer })} type="button">${escape_html(nextPhaseActionLabel())}</button>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (showRevertComposer && data.lifecycle.revertablePhaseIds.length > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="mechanics-card change-action-panel svelte-mgqsv0"><div class="composer-card svelte-mgqsv0"><h3 class="svelte-mgqsv0">Return</h3> <label><span class="field-inline-label svelte-mgqsv0">Return to</span> `);
        $$renderer2.select(
          { value: revertTargetPhaseId, class: "" },
          ($$renderer3) => {
            $$renderer3.push(`<!--[-->`);
            const each_array = ensure_array_like(data.lifecycle.revertablePhaseIds);
            for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
              let phaseId = each_array[$$index];
              $$renderer3.option({ value: phaseId }, ($$renderer4) => {
                $$renderer4.push(`${escape_html(revertTargetLabel(phaseId))}`);
              });
            }
            $$renderer3.push(`<!--]-->`);
          },
          "svelte-mgqsv0"
        );
        $$renderer2.push(`</label> <label><span class="field-inline-label svelte-mgqsv0">Reason</span> <textarea rows="3"${attr("placeholder", revertPhasePlaceholder())} class="svelte-mgqsv0">`);
        const $$body = escape_html(revertReason);
        if ($$body) {
          $$renderer2.push(`${$$body}`);
        }
        $$renderer2.push(`</textarea></label> <div class="composer-actions svelte-mgqsv0"><button class="secondary-button svelte-mgqsv0" type="button">Cancel</button> <button class="primary-button svelte-mgqsv0"${attr("disabled", !revertReason.trim(), true)} type="button">Return</button></div></div></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (showNextPhaseComposer && data.lifecycle.nextPhaseId) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="mechanics-card change-action-panel svelte-mgqsv0"><div class="composer-card svelte-mgqsv0"><h3 class="svelte-mgqsv0">${escape_html(nextPhaseActionLabel())}</h3> <label><span class="field-inline-label svelte-mgqsv0">Reason</span> <textarea rows="3"${attr("placeholder", nextPhasePlaceholder())} class="svelte-mgqsv0">`);
        const $$body_1 = escape_html(nextPhaseReason);
        if ($$body_1) {
          $$renderer2.push(`${$$body_1}`);
        }
        $$renderer2.push(`</textarea></label> `);
        if (!canAdvanceCurrentPhase) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="inline-note svelte-mgqsv0">`);
          if (data.lifecycle.currentPhaseId === "proposal") {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`Proposal advancement is still locked until demand is above the required threshold.`);
          } else if (data.lifecycle.currentPhaseId === "event-plan") {
            $$renderer2.push("<!--[1-->");
            $$renderer2.push(`Planning cannot advance until a plan clears quorum and approval.`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> <div class="composer-actions svelte-mgqsv0"><button class="secondary-button svelte-mgqsv0" type="button">Cancel</button> <button class="primary-button svelte-mgqsv0"${attr("disabled", !nextPhaseReason.trim() || !canAdvanceCurrentPhase, true)} type="button">${escape_html(nextPhaseActionLabel())}</button></div></div></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (expandedVoteGroup === "return" && returnRequests.length > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="surface-stack svelte-mgqsv0"><!--[-->`);
        const each_array_1 = ensure_array_like(returnRequests);
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let request = each_array_1[$$index_1];
          $$renderer2.push(`<article class="surface-card vote-request-card svelte-mgqsv0"><div class="vote-card-top svelte-mgqsv0"><div class="vote-card-copy svelte-mgqsv0"><span class="vote-kicker svelte-mgqsv0">${escape_html(requestKindLabel(request))}</span> <strong class="svelte-mgqsv0">${escape_html(request.targetPhaseLabel)}</strong></div> <span class="vote-requirement svelte-mgqsv0">${escape_html(formatProjectVoteRequirement(request.voteSummary, request.approvalThresholdPercent))}</span></div> <p class="svelte-mgqsv0">${escape_html(request.reason)}</p> <div class="vote-summary-row svelte-mgqsv0"><span class="svelte-mgqsv0">${escape_html(formatProjectVoteSummary(request.voteSummary))}</span></div> `);
          VoteCardFooter($$renderer2, {
            authorUsername: request.authorUsername,
            createdAt: request.createdAt,
            activeVote: request.voteSummary.activeVote,
            canVote: data.lifecycle.viewerCanVoteOnPhaseChanges,
            onVote: (vote) => voteOnPhaseChange(request.id, vote)
          });
          $$renderer2.push(`<!----></article>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (expandedVoteGroup === nextVoteKind && nextActionRequests.length > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="surface-stack svelte-mgqsv0"><!--[-->`);
        const each_array_2 = ensure_array_like(nextActionRequests);
        for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
          let request = each_array_2[$$index_2];
          $$renderer2.push(`<article class="surface-card vote-request-card svelte-mgqsv0"><div class="vote-card-top svelte-mgqsv0"><div class="vote-card-copy svelte-mgqsv0"><span class="vote-kicker svelte-mgqsv0">${escape_html(requestKindLabel(request))}</span> <strong class="svelte-mgqsv0">${escape_html(request.targetPhaseLabel)}</strong></div> <span class="vote-requirement svelte-mgqsv0">${escape_html(formatProjectVoteRequirement(request.voteSummary, request.approvalThresholdPercent))}</span></div> <p class="svelte-mgqsv0">${escape_html(request.reason)}</p> <div class="vote-summary-row svelte-mgqsv0"><span class="svelte-mgqsv0">${escape_html(formatProjectVoteSummary(request.voteSummary))}</span></div> `);
          VoteCardFooter($$renderer2, {
            authorUsername: request.authorUsername,
            createdAt: request.createdAt,
            activeVote: request.voteSummary.activeVote,
            canVote: data.lifecycle.viewerCanVoteOnPhaseChanges,
            onVote: (vote) => voteOnPhaseChange(request.id, vote)
          });
          $$renderer2.push(`<!----></article>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, {
      data,
      activePhaseId,
      canAdvanceCurrentPhase,
      phaseChangeReason,
      requestPhaseChange,
      voteOnPhaseChange
    });
  });
}
const importanceOptions = Array.from(
  { length: 10 },
  (_, index) => {
    const value = index + 1;
    return {
      value,
      label: value === 1 ? "Unnecessary" : value === 10 ? "Required" : `Importance ${value} of 10`
    };
  }
);
function createDraftPlanPhase() {
  return {
    title: "",
    details: ""
  };
}
function createDraftActivityRole() {
  return {
    label: "",
    requiredCount: 1
  };
}
function createEventPlanForm() {
  return {
    title: "",
    description: "",
    demandConsiderationNote: "",
    scheduleMode: "date",
    scheduledDate: "",
    rangeStartDate: "",
    rangeEndDate: "",
    startTimeLabel: "",
    finishTimeLabel: "",
    locationLabel: "",
    planPhases: [createDraftPlanPhase()],
    validationMessages: []
  };
}
function eventPlanScheduleFromForm(form) {
  if (form.scheduleMode === "date") {
    return {
      mode: "date",
      startDate: form.scheduledDate || null,
      startTimeLabel: form.startTimeLabel || null,
      finishTimeLabel: form.finishTimeLabel || null
    };
  }
  if (form.scheduleMode === "range") {
    return {
      mode: "range",
      startDate: form.rangeStartDate || null,
      endDate: form.rangeEndDate || null,
      startTimeLabel: form.startTimeLabel || null,
      finishTimeLabel: form.finishTimeLabel || null
    };
  }
  return {
    mode: "any-day",
    startTimeLabel: form.startTimeLabel || null,
    finishTimeLabel: form.finishTimeLabel || null
  };
}
function createEventActivityForm(locationLabel, linkedPlanPhaseId) {
  return {
    title: "",
    scheduledAt: "",
    endsAt: "",
    locationLabel,
    roleRequirements: [createDraftActivityRole()],
    linkedPlanPhaseId,
    note: ""
  };
}
function eventPlanSuggestedDayIso(plan) {
  if (!plan) {
    return "";
  }
  return plan.schedule.mode === "date" || plan.schedule.mode === "range" ? plan.schedule.startDate ?? "" : "";
}
function isoDayValue(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function eventPlanScheduledDayIsos(plan) {
  const startDate = plan?.schedule.startDate ?? "";
  if (!startDate) {
    return [];
  }
  const start = /* @__PURE__ */ new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) {
    return [];
  }
  const endDate = plan?.schedule.mode === "range" && plan.schedule.endDate ? plan.schedule.endDate : startDate;
  const end = /* @__PURE__ */ new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(end.getTime()) || end.getTime() < start.getTime()) {
    return [startDate];
  }
  const days = [];
  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    days.push(isoDayValue(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}
function eventPlanDefaultActivityWindow(plan, isoDay = "") {
  const dayIso = isoDay || eventPlanSuggestedDayIso(plan);
  if (!dayIso) {
    return {
      scheduledAt: "",
      endsAt: ""
    };
  }
  return suggestedEventActivityWindow(plan?.schedule ?? null, dayIso);
}
function eventPlanDefaultLocationLabel(plan) {
  return plan?.locationLabel?.trim() || "";
}
function minimumParticipantsFromRoles(roleRequirements) {
  return roleRequirements.reduce(
    (total, role) => total + Math.max(1, Number(role.requiredCount) || 1),
    0
  );
}
function EventActivityPhase($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let plannedDayIsos, composerDayIso, activityWindowBounds;
    let data = $$props["data"];
    let selectedPlan = fallback($$props["selectedPlan"], null);
    let showActivityComposer = fallback($$props["showActivityComposer"], false);
    let activityForm = fallback(
      $$props["activityForm"],
      () => ({
        title: "",
        scheduledAt: "",
        endsAt: "",
        locationLabel: "",
        roleRequirements: [{ label: "", requiredCount: 1 }],
        linkedPlanPhaseId: null,
        note: ""
      }),
      true
    );
    let minimumParticipants = fallback($$props["minimumParticipants"], 0);
    let selectedDayIso = fallback($$props["selectedDayIso"], "");
    let highlightedActivityId = fallback($$props["highlightedActivityId"], null);
    let openActivityComposerForDay = fallback($$props["openActivityComposerForDay"], () => {
    });
    let submitActivity = fallback($$props["submitActivity"], () => {
    });
    let changeCommitment = fallback($$props["changeCommitment"], () => {
    });
    let lastAutoScrollActivityId = null;
    function scrollToActivity(activityId) {
      highlightedActivityId = activityId;
      document.getElementById(`event-activity-${activityId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (highlightedActivityId && highlightedActivityId !== lastAutoScrollActivityId) {
      lastAutoScrollActivityId = highlightedActivityId;
      void tick().then(() => {
        document.getElementById(`event-activity-${highlightedActivityId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    plannedDayIsos = eventPlanScheduledDayIsos(selectedPlan);
    composerDayIso = selectedDayIso || plannedDayIsos[0] || selectedPlan?.schedule.startDate || "";
    activityWindowBounds = eventScheduleDayBounds(selectedPlan?.schedule ?? null, composerDayIso);
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<section class="phase-surface svelte-1l0uv4l">`);
      if (selectedPlan) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<div class="info-card svelte-1l0uv4l"><strong class="svelte-1l0uv4l">Accepted event plan</strong> <p class="svelte-1l0uv4l">${escape_html(selectedPlan.description)}</p> <p class="plan-timing-note svelte-1l0uv4l">Plan timing: ${escape_html(selectedPlan.schedule.label)}. Click a marked day to schedule activity from this plan.</p> <p class="plan-timing-note svelte-1l0uv4l">Plan location: ${escape_html(selectedPlan.locationLabel)}</p></div>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> `);
      ProjectActivityCalendarCard($$renderer3, {
        activities: data.lifecycle.activity.activities,
        plannedDayIsos,
        canCreate: data.lifecycle.activity.viewerCanCreateActivities,
        createActive: showActivityComposer,
        createAction: () => openActivityComposerForDay(selectedDayIso),
        daySelect: (isoDay) => {
          selectedDayIso = isoDay;
          if (data.lifecycle.activity.viewerCanCreateActivities) {
            openActivityComposerForDay(isoDay);
          }
        },
        selectedActivityId: highlightedActivityId ?? "",
        selectedDayIso,
        activitySelect: scrollToActivity
      });
      $$renderer3.push(`<!----> `);
      if (data.lifecycle.activity.viewerCanCreateActivities && showActivityComposer) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<div class="composer-card svelte-1l0uv4l"><input${attr("value", activityForm.title)} maxlength="120" placeholder="Activity title" class="svelte-1l0uv4l"/> <div class="number-grid svelte-1l0uv4l"><label><span class="field-inline-label svelte-1l0uv4l">Start time</span> <input${attr("value", activityForm.scheduledAt)} type="datetime-local"${attr("min", activityWindowBounds?.startLocal ?? void 0)}${attr("max", activityWindowBounds?.endLocal ?? void 0)} class="svelte-1l0uv4l"/></label> <label><span class="field-inline-label svelte-1l0uv4l">Finish time</span> <input${attr("value", activityForm.endsAt)} type="datetime-local"${attr("min", activityForm.scheduledAt || activityWindowBounds?.startLocal || void 0)}${attr("max", activityWindowBounds?.endLocal ?? void 0)} class="svelte-1l0uv4l"/></label></div> <input${attr("value", activityForm.locationLabel)} maxlength="120" placeholder="Location" class="svelte-1l0uv4l"/> `);
        if (data.lifecycle.activity.selectablePlanPhases.length > 0) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<label><span class="field-inline-label svelte-1l0uv4l">Linked plan stage</span> `);
          $$renderer3.select(
            { value: activityForm.linkedPlanPhaseId, class: "" },
            ($$renderer4) => {
              $$renderer4.push(`<!--[-->`);
              const each_array = ensure_array_like(data.lifecycle.activity.selectablePlanPhases);
              for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                let option = each_array[$$index];
                $$renderer4.option({ value: option.id }, ($$renderer5) => {
                  $$renderer5.push(`${escape_html(option.label)}`);
                });
              }
              $$renderer4.push(`<!--]-->`);
            },
            "svelte-1l0uv4l"
          );
          $$renderer3.push(`</label>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> `);
        ProjectActivityRolesEditor($$renderer3, {
          get roles() {
            return activityForm.roleRequirements;
          },
          set roles($$value) {
            activityForm.roleRequirements = $$value;
            $$settled = false;
          }
        });
        $$renderer3.push(`<!----> <div class="count-field svelte-1l0uv4l"><span class="count-field-label svelte-1l0uv4l"><span class="field-inline-label svelte-1l0uv4l">Minimum people</span> <span class="count-note svelte-1l0uv4l">This is calculated from the role minimums above.</span></span> <div class="count-readout svelte-1l0uv4l"><strong class="svelte-1l0uv4l">${escape_html(minimumParticipants)}</strong></div></div> <textarea rows="3" placeholder="What needs to happen in this activity?" class="svelte-1l0uv4l">`);
        const $$body = escape_html(activityForm.note);
        if ($$body) {
          $$renderer3.push(`${$$body}`);
        }
        $$renderer3.push(`</textarea> <div class="composer-actions svelte-1l0uv4l"><button class="secondary-button svelte-1l0uv4l" type="button">Cancel</button> <button class="primary-button svelte-1l0uv4l" type="button">Create activity</button></div></div>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> <div class="surface-stack svelte-1l0uv4l">`);
      if (data.lifecycle.activity.activities.length === 0) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<div class="empty-card svelte-1l0uv4l">${escape_html(plannedDayIsos.length > 0 ? "No activity scheduled yet. Click a marked plan day to add the first activity." : "No activity scheduled yet.")}</div>`);
      } else {
        $$renderer3.push("<!--[-1-->");
        $$renderer3.push(`<!--[-->`);
        const each_array_1 = ensure_array_like(data.lifecycle.activity.activities);
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let activity = each_array_1[$$index_1];
          $$renderer3.push(`<div${attr("id", `event-activity-${activity.id}`)}>`);
          CollapsibleActivityCard($$renderer3, {
            activity,
            highlighted: highlightedActivityId === activity.id,
            changecommitment: changeCommitment
          });
          $$renderer3.push(`<!----></div>`);
        }
        $$renderer3.push(`<!--]-->`);
      }
      $$renderer3.push(`<!--]--></div></section>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, {
      data,
      selectedPlan,
      showActivityComposer,
      activityForm,
      minimumParticipants,
      selectedDayIso,
      highlightedActivityId,
      openActivityComposerForDay,
      submitActivity,
      changeCommitment
    });
  });
}
function EventClosedPhase($$renderer) {
  $$renderer.push(`<div class="empty-card svelte-1mav4wi">This event is closed. Its plan, activities, and decision history remain visible here as part of the record.</div>`);
}
function EventPlanPhase($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    let signalSummary = fallback($$props["signalSummary"], null);
    let showPlanComposer = fallback($$props["showPlanComposer"], false);
    let planForm = fallback(
      $$props["planForm"],
      () => ({
        title: "",
        description: "",
        demandConsiderationNote: "",
        scheduleMode: "date",
        scheduledDate: "",
        rangeStartDate: "",
        rangeEndDate: "",
        startTimeLabel: "",
        finishTimeLabel: "",
        locationLabel: "",
        planPhases: [{ title: "", details: "" }],
        validationMessages: []
      }),
      true
    );
    let addPlanPhase = fallback($$props["addPlanPhase"], () => {
    });
    let removePlanPhase = fallback($$props["removePlanPhase"], () => {
    });
    let submitPlan = fallback($$props["submitPlan"], () => {
    });
    let voteOnPlanValue = fallback($$props["voteOnPlanValue"], () => {
    });
    let voteOnPlanOverall = fallback($$props["voteOnPlanOverall"], () => {
    });
    function statusLabel(planId) {
      if (planId !== data.lifecycle.phaseTwo.winningPlanId) {
        return null;
      }
      return data.lifecycle.currentPhaseId === "event-plan" ? "Leading above threshold" : "Selected";
    }
    $$renderer2.push(`<section class="phase-surface svelte-iloj0n">`);
    if (data.lifecycle.phaseTwo.viewerCanSubmitPlans) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="composer-toggle-row svelte-iloj0n">`);
      RoundPlusButton($$renderer2, {
        active: showPlanComposer,
        ariaLabel: showPlanComposer ? "Hide event plan composer" : "Add event plan",
        action: () => showPlanComposer = !showPlanComposer
      });
      $$renderer2.push(`<!----></div> `);
      if (showPlanComposer) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="composer-card svelte-iloj0n">`);
        if ((planForm.validationMessages?.length ?? 0) > 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="warning-card svelte-iloj0n" role="alert"><strong class="svelte-iloj0n">Plan could not be submitted</strong> <ul class="warning-list svelte-iloj0n"><!--[-->`);
          const each_array = ensure_array_like(planForm.validationMessages ?? []);
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let message = each_array[$$index];
            $$renderer2.push(`<li>${escape_html(message)}</li>`);
          }
          $$renderer2.push(`<!--]--></ul></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> <input${attr("value", planForm.title)} maxlength="120" placeholder="Plan title" class="svelte-iloj0n"/> <textarea rows="3" placeholder="Describe the overall event plan." class="svelte-iloj0n">`);
        const $$body = escape_html(planForm.description);
        if ($$body) {
          $$renderer2.push(`${$$body}`);
        }
        $$renderer2.push(`</textarea> <p class="field-help svelte-iloj0n">The approved plan becomes the live event title, description, schedule, and location when the event moves into activity.</p> <label><span class="field-inline-label">Plan timing</span> `);
        $$renderer2.select(
          { value: planForm.scheduleMode, class: "" },
          ($$renderer3) => {
            $$renderer3.option({ value: "date" }, ($$renderer4) => {
              $$renderer4.push(`Single date`);
            });
            $$renderer3.option({ value: "range" }, ($$renderer4) => {
              $$renderer4.push(`Date range`);
            });
          },
          "svelte-iloj0n"
        );
        $$renderer2.push(`</label> `);
        if (planForm.scheduleMode === "date") {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<label><span class="field-inline-label">Date</span> <input${attr("value", planForm.scheduledDate)} type="date" class="svelte-iloj0n"/></label>`);
        } else if (planForm.scheduleMode === "range") {
          $$renderer2.push("<!--[1-->");
          $$renderer2.push(`<div class="schedule-grid svelte-iloj0n"><label><span class="field-inline-label">Start date</span> <input${attr("value", planForm.rangeStartDate)} type="date" class="svelte-iloj0n"/></label> <label><span class="field-inline-label">End date</span> <input${attr("value", planForm.rangeEndDate)} type="date" class="svelte-iloj0n"/></label></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> <div class="time-grid svelte-iloj0n"><label><span class="field-inline-label">Start time</span> <input${attr("value", planForm.startTimeLabel)} type="time" class="svelte-iloj0n"/></label> <label><span class="field-inline-label">Finish time</span> <input${attr("value", planForm.finishTimeLabel)} type="time" class="svelte-iloj0n"/></label></div> <label><span class="field-inline-label">Location</span> <input${attr("value", planForm.locationLabel)} maxlength="120" placeholder="Event location" class="svelte-iloj0n"/></label> <p class="field-help svelte-iloj0n">Marked plan days become the days where activity can be scheduled from the calendar.</p> <div class="demand-context-card svelte-iloj0n"><strong class="svelte-iloj0n">Current demand signal</strong> <span>`);
        if (signalSummary) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`${escape_html(signalSummary.demandCount)} demand signals are active right now.`);
        } else {
          $$renderer2.push("<!--[-1-->");
          $$renderer2.push(`This private event uses editor approval instead of public demand signals.`);
        }
        $$renderer2.push(`<!--]--></span></div> <textarea rows="3" placeholder="Explain how this plan responds to the current event demand and values." class="svelte-iloj0n">`);
        const $$body_1 = escape_html(planForm.demandConsiderationNote);
        if ($$body_1) {
          $$renderer2.push(`${$$body_1}`);
        }
        $$renderer2.push(`</textarea> <div class="step-stack svelte-iloj0n"><!--[-->`);
        const each_array_1 = ensure_array_like(planForm.planPhases);
        for (let index = 0, $$length = each_array_1.length; index < $$length; index++) {
          let phase = each_array_1[index];
          $$renderer2.push(`<div class="step-card svelte-iloj0n"><div class="step-header-row svelte-iloj0n"><strong class="svelte-iloj0n">Stage ${escape_html(index + 1)}</strong> `);
          if (planForm.planPhases.length > 1) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<button class="secondary-button svelte-iloj0n" type="button">Remove</button>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></div> <input${attr("value", phase.title)} maxlength="120" placeholder="Stage title" class="svelte-iloj0n"/> <textarea rows="3" placeholder="What happens in this stage?" class="svelte-iloj0n">`);
          const $$body_2 = escape_html(phase.details);
          if ($$body_2) {
            $$renderer2.push(`${$$body_2}`);
          }
          $$renderer2.push(`</textarea></div>`);
        }
        $$renderer2.push(`<!--]--></div> <div class="composer-actions svelte-iloj0n"><button class="secondary-button svelte-iloj0n" type="button">Add stage</button></div> <div class="composer-actions svelte-iloj0n"><button class="secondary-button svelte-iloj0n" type="button">Cancel</button> <button class="primary-button svelte-iloj0n" type="button">Submit event plan</button></div></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div${attr_class("surface-stack plan-stack svelte-iloj0n", void 0, { "scrollable-stack": data.lifecycle.phaseTwo.plans.length > 4 })}>`);
    if (data.lifecycle.phaseTwo.plans.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="empty-card svelte-iloj0n">No event plans submitted yet.</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<!--[-->`);
      const each_array_2 = ensure_array_like(data.lifecycle.phaseTwo.plans);
      for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
        let plan = each_array_2[$$index_2];
        CollapsiblePlanCard($$renderer2, {
          plan,
          expanded: plan.id === data.lifecycle.phaseTwo.winningPlanId,
          canVote: data.lifecycle.phaseTwo.viewerCanVoteOnPlans,
          statusLabel: statusLabel(plan.id),
          valuevote: voteOnPlanValue,
          overallvote: voteOnPlanOverall
        });
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></section>`);
    bind_props($$props, {
      data,
      signalSummary,
      showPlanComposer,
      planForm,
      addPlanPhase,
      removePlanPhase,
      submitPlan,
      voteOnPlanValue,
      voteOnPlanOverall
    });
  });
}
function EventProposalPhase($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    let signalSummary = fallback($$props["signalSummary"], null);
    let importanceOptions2 = fallback($$props["importanceOptions"], () => [], true);
    let draftValue = fallback($$props["draftValue"], "");
    let showValueComposer = fallback($$props["showValueComposer"], false);
    let submitValue = fallback($$props["submitValue"], () => {
    });
    let voteOnValue = fallback($$props["voteOnValue"], () => {
    });
    $$renderer2.push(`<section class="phase-surface svelte-97q5pg">`);
    if (signalSummary) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="info-card svelte-97q5pg"><strong class="svelte-97q5pg">Proposal threshold</strong> <p class="svelte-97q5pg">`);
      if (signalSummary.usesPlatformVoteContext) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`Demand must stay above 66% of active signals and reach ${escape_html(signalSummary.requiredDemandCount)} demand signals from ${escape_html(signalSummary.voteContextPopulation)} weekly active users.`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`Demand must stay above 66% of active proposal signals before planning can open.`);
      }
      $$renderer2.push(`<!--]--></p></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.lifecycle.phaseOne.viewerCanAddValue) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="composer-toggle-row svelte-97q5pg">`);
      RoundPlusButton($$renderer2, {
        active: showValueComposer,
        ariaLabel: "Add event value",
        action: () => showValueComposer = !showValueComposer
      });
      $$renderer2.push(`<!----></div> `);
      if (showValueComposer) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="composer-card svelte-97q5pg"><input${attr("value", draftValue)} maxlength="160" placeholder="Add a value, for example: should welcome first-time neighbors clearly" class="svelte-97q5pg"/> <div class="composer-actions svelte-97q5pg"><button class="secondary-button svelte-97q5pg" type="button">Cancel</button> <button class="primary-button svelte-97q5pg" type="button">Add value</button></div></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="surface-stack compact-stack svelte-97q5pg">`);
    if (data.lifecycle.phaseOne.values.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="empty-card svelte-97q5pg">No proposal values yet.</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<!--[-->`);
      const each_array = ensure_array_like(data.lifecycle.phaseOne.values);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let value = each_array[$$index];
        ProjectValueCard($$renderer2, {
          canVote: data.lifecycle.phaseOne.viewerCanVoteOnValues,
          options: importanceOptions2,
          value,
          vote: voteOnValue
        });
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></section>`);
    bind_props($$props, {
      data,
      signalSummary,
      importanceOptions: importanceOptions2,
      draftValue,
      showValueComposer,
      submitValue,
      voteOnValue
    });
  });
}
function EventLifecycleContent($$renderer, $$props) {
  let data = $$props["data"];
  let activePhaseId = $$props["activePhaseId"];
  let signalSummary = fallback($$props["signalSummary"], null);
  let selectedPlan = fallback($$props["selectedPlan"], null);
  let importanceOptions2 = fallback($$props["importanceOptions"], () => [], true);
  let draftValue = fallback($$props["draftValue"], "");
  let showValueComposer = fallback($$props["showValueComposer"], false);
  let showPlanComposer = fallback($$props["showPlanComposer"], false);
  let showActivityComposer = fallback($$props["showActivityComposer"], false);
  let selectedDayIso = fallback($$props["selectedDayIso"], "");
  let highlightedActivityId = fallback($$props["highlightedActivityId"], null);
  let planForm = fallback(
    $$props["planForm"],
    () => ({
      title: "",
      description: "",
      demandConsiderationNote: "",
      scheduleMode: "date",
      scheduledDate: "",
      rangeStartDate: "",
      rangeEndDate: "",
      startTimeLabel: "",
      finishTimeLabel: "",
      locationLabel: "",
      planPhases: [{ title: "", details: "" }]
    }),
    true
  );
  let activityForm = fallback(
    $$props["activityForm"],
    () => ({
      title: "",
      scheduledAt: "",
      endsAt: "",
      locationLabel: "",
      roleRequirements: [{ label: "", requiredCount: 1 }],
      linkedPlanPhaseId: null,
      note: ""
    }),
    true
  );
  let minimumParticipants = fallback($$props["minimumParticipants"], 0);
  let submitValue = fallback($$props["submitValue"], () => {
  });
  let voteOnValue = fallback($$props["voteOnValue"], () => {
  });
  let addPlanPhase = fallback($$props["addPlanPhase"], () => {
  });
  let removePlanPhase = fallback($$props["removePlanPhase"], () => {
  });
  let submitPlan = fallback($$props["submitPlan"], () => {
  });
  let voteOnPlanValue = fallback($$props["voteOnPlanValue"], () => {
  });
  let voteOnPlanOverall = fallback($$props["voteOnPlanOverall"], () => {
  });
  let openActivityComposerForDay = fallback($$props["openActivityComposerForDay"], () => {
  });
  let submitActivity = fallback($$props["submitActivity"], () => {
  });
  let changeCommitment = fallback($$props["changeCommitment"], () => {
  });
  let $$settled = true;
  let $$inner_renderer;
  function $$render_inner($$renderer2) {
    if (activePhaseId === "proposal") {
      $$renderer2.push("<!--[0-->");
      EventProposalPhase($$renderer2, {
        data,
        signalSummary,
        importanceOptions: importanceOptions2,
        submitValue,
        voteOnValue,
        get draftValue() {
          return draftValue;
        },
        set draftValue($$value) {
          draftValue = $$value;
          $$settled = false;
        },
        get showValueComposer() {
          return showValueComposer;
        },
        set showValueComposer($$value) {
          showValueComposer = $$value;
          $$settled = false;
        }
      });
    } else if (activePhaseId === "event-plan") {
      $$renderer2.push("<!--[1-->");
      EventPlanPhase($$renderer2, {
        data,
        signalSummary,
        addPlanPhase,
        removePlanPhase,
        submitPlan,
        voteOnPlanValue,
        voteOnPlanOverall,
        get showPlanComposer() {
          return showPlanComposer;
        },
        set showPlanComposer($$value) {
          showPlanComposer = $$value;
          $$settled = false;
        },
        get planForm() {
          return planForm;
        },
        set planForm($$value) {
          planForm = $$value;
          $$settled = false;
        }
      });
    } else if (activePhaseId === "activity") {
      $$renderer2.push("<!--[2-->");
      EventActivityPhase($$renderer2, {
        data,
        selectedPlan,
        minimumParticipants,
        openActivityComposerForDay,
        submitActivity,
        changeCommitment,
        get showActivityComposer() {
          return showActivityComposer;
        },
        set showActivityComposer($$value) {
          showActivityComposer = $$value;
          $$settled = false;
        },
        get activityForm() {
          return activityForm;
        },
        set activityForm($$value) {
          activityForm = $$value;
          $$settled = false;
        },
        get selectedDayIso() {
          return selectedDayIso;
        },
        set selectedDayIso($$value) {
          selectedDayIso = $$value;
          $$settled = false;
        },
        get highlightedActivityId() {
          return highlightedActivityId;
        },
        set highlightedActivityId($$value) {
          highlightedActivityId = $$value;
          $$settled = false;
        }
      });
    } else {
      $$renderer2.push("<!--[-1-->");
      EventClosedPhase($$renderer2);
    }
    $$renderer2.push(`<!--]-->`);
  }
  do {
    $$settled = true;
    $$inner_renderer = $$renderer.copy();
    $$render_inner($$inner_renderer);
  } while (!$$settled);
  $$renderer.subsume($$inner_renderer);
  bind_props($$props, {
    data,
    activePhaseId,
    signalSummary,
    selectedPlan,
    importanceOptions: importanceOptions2,
    draftValue,
    showValueComposer,
    showPlanComposer,
    showActivityComposer,
    selectedDayIso,
    highlightedActivityId,
    planForm,
    activityForm,
    minimumParticipants,
    submitValue,
    voteOnValue,
    addPlanPhase,
    removePlanPhase,
    submitPlan,
    voteOnPlanValue,
    voteOnPlanOverall,
    openActivityComposerForDay,
    submitActivity,
    changeCommitment
  });
}
function EventLifecyclePanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let activePhase, signalSummary, selectedPlan, plannedDayIsos, canAdvanceCurrentPhase, minimumParticipants, phaseTabs, activePhaseProgressLabel;
    let data = $$props["data"];
    let requestedActivityId = fallback($$props["requestedActivityId"], null);
    function currentWinningPlan() {
      return data.lifecycle.phaseTwo.plans.find((plan) => plan.id === data.lifecycle.phaseTwo.winningPlanId) ?? null;
    }
    function defaultActivityDayIso(isoDay = "") {
      return isoDay || eventPlanSuggestedDayIso(currentWinningPlan());
    }
    function createDefaultActivityForm(isoDay = "") {
      const winningPlan = currentWinningPlan();
      const defaultDayIso = defaultActivityDayIso(isoDay);
      const baseForm = createEventActivityForm(eventPlanDefaultLocationLabel(winningPlan) || data.locationLabel, data.lifecycle.activity.selectablePlanPhases[0]?.id ?? null);
      const defaultWindow = eventPlanDefaultActivityWindow(winningPlan, defaultDayIso);
      return defaultDayIso ? {
        ...baseForm,
        scheduledAt: defaultWindow.scheduledAt,
        endsAt: defaultWindow.endsAt
      } : baseForm;
    }
    let activePhaseId = data.lifecycle.currentPhaseId;
    let lastCurrentPhaseId = data.lifecycle.currentPhaseId;
    let lastRequestedActivityId = null;
    let showHowItWorks = false;
    let lastHowItWorksPhaseId = data.lifecycle.currentPhaseId;
    let showValueComposer = false;
    let showPlanComposer = false;
    let showActivityComposer = false;
    let draftValue = "";
    let phaseChangeReason = "";
    let selectedDayIso = "";
    let highlightedActivityId = null;
    let planForm = createEventPlanForm();
    let activityForm = createDefaultActivityForm();
    function phaseProgressLabel(phase) {
      if (phase.id === data.lifecycle.currentPhaseId) {
        return "Current";
      }
      return phase.progressState === "complete" ? "Complete" : phase.progressState === "locked" ? "Locked" : "Upcoming";
    }
    function eventPlanPhaseHasAnyInput(phase) {
      return !!phase.title.trim() || !!phase.details.trim();
    }
    function eventPlanPhaseIsComplete(phase) {
      return !!phase.title.trim() && !!phase.details.trim();
    }
    function validateEventPlanForm(form) {
      const schedule = eventPlanScheduleFromForm(form);
      const scheduleBounds = eventScheduleBounds(schedule);
      const validationMessages = [];
      const hasStartTime = !!form.startTimeLabel.trim();
      const hasFinishTime = !!form.finishTimeLabel.trim();
      const hasRequiredScheduleDates = schedule.mode === "date" ? !!schedule.startDate : schedule.mode === "range" ? !!schedule.startDate && !!schedule.endDate : false;
      const hasAnyCompleteStage = form.planPhases.some(eventPlanPhaseIsComplete);
      const hasPartialStage = form.planPhases.some((phase) => eventPlanPhaseHasAnyInput(phase) && !eventPlanPhaseIsComplete(phase));
      if (!form.title.trim()) {
        validationMessages.push("Add a plan title.");
      }
      if (!form.description.trim()) {
        validationMessages.push("Add a plan description.");
      }
      if (!form.locationLabel.trim()) {
        validationMessages.push("Add a location for the event plan.");
      }
      if (!form.demandConsiderationNote.trim()) {
        validationMessages.push("Explain how this plan responds to the current demand signal.");
      }
      if (form.scheduleMode === "date" && !schedule.startDate) {
        validationMessages.push("Choose the event date.");
      }
      if (form.scheduleMode === "range" && (!schedule.startDate || !schedule.endDate)) {
        validationMessages.push("Choose both the start date and end date for the event range.");
      }
      if (!hasStartTime) {
        validationMessages.push("Choose a start time.");
      }
      if (!hasFinishTime) {
        validationMessages.push("Choose a finish time.");
      }
      if (hasRequiredScheduleDates && hasStartTime && hasFinishTime) {
        if (!eventScheduleIsValid(schedule) || !scheduleBounds.start || !scheduleBounds.end) {
          validationMessages.push("Finish must be after the event start.");
        } else if (!eventScheduleStartsInFuture(schedule)) {
          validationMessages.push("Event plans cannot start in the past.");
        }
      }
      if (!hasAnyCompleteStage) {
        validationMessages.push("Add at least one stage with both a title and details.");
      } else if (hasPartialStage) {
        validationMessages.push("Finish every stage you start. Each stage needs both a title and details.");
      }
      return { schedule, validationMessages };
    }
    function resetPlanForm() {
      planForm = createEventPlanForm();
    }
    function resetActivityForm() {
      activityForm = createDefaultActivityForm(selectedDayIso);
    }
    async function submitValue() {
      if (!draftValue.trim()) {
        return;
      }
      await addEventValue(data.slug, draftValue);
      draftValue = "";
      showValueComposer = false;
      await invalidateAll();
    }
    async function voteOnValue(valueId, vote) {
      await setEventValueImportance(data.slug, valueId, vote);
      await invalidateAll();
    }
    function addPlanPhase() {
      planForm = {
        ...planForm,
        planPhases: [...planForm.planPhases, { title: "", details: "" }]
      };
    }
    function removePlanPhase(index) {
      planForm = {
        ...planForm,
        planPhases: planForm.planPhases.length === 1 ? [{ title: "", details: "" }] : planForm.planPhases.filter((_, phaseIndex) => phaseIndex !== index)
      };
    }
    async function submitPlan() {
      const { schedule, validationMessages } = validateEventPlanForm(planForm);
      const locationLabel = planForm.locationLabel.trim();
      if (validationMessages.length > 0) {
        planForm = { ...planForm, validationMessages };
        return;
      }
      const created = await addEventPlan(data.slug, {
        title: planForm.title,
        description: planForm.description,
        demandConsiderationNote: planForm.demandConsiderationNote,
        locationLabel,
        schedule,
        planPhases: planForm.planPhases
      });
      if (!created) {
        planForm = {
          ...planForm,
          validationMessages: [
            "This event plan could not be submitted from the current state. Reload and try again."
          ]
        };
        return;
      }
      resetPlanForm();
      showPlanComposer = false;
      await invalidateAll();
    }
    async function voteOnPlanValue(planId, valueId, vote) {
      await setEventPlanValueVote(data.slug, planId, valueId, vote);
      await invalidateAll();
    }
    async function voteOnPlanOverall(planId, vote) {
      await setEventPlanOverallVote(data.slug, planId, vote);
      await invalidateAll();
    }
    function openActivityComposerForDay(isoDay = selectedDayIso) {
      const targetDayIso = isoDay || selectedDayIso || defaultActivityDayIso();
      if (showActivityComposer && (!targetDayIso || targetDayIso === selectedDayIso)) {
        showActivityComposer = false;
        return;
      }
      if (targetDayIso) {
        selectedDayIso = targetDayIso;
      }
      showActivityComposer = true;
      const winningPlan = currentWinningPlan();
      const defaultDayIso = defaultActivityDayIso(targetDayIso);
      const defaultWindow = eventPlanDefaultActivityWindow(winningPlan, defaultDayIso);
      const defaultLocationLabel = eventPlanDefaultLocationLabel(winningPlan) || data.locationLabel;
      const shouldRefreshWindow = !!targetDayIso || !activityForm.scheduledAt || !activityForm.endsAt;
      activityForm = {
        ...activityForm,
        locationLabel: activityForm.locationLabel || defaultLocationLabel,
        scheduledAt: shouldRefreshWindow && defaultWindow.scheduledAt ? defaultWindow.scheduledAt : activityForm.scheduledAt,
        endsAt: shouldRefreshWindow && defaultWindow.endsAt ? defaultWindow.endsAt : activityForm.endsAt
      };
    }
    async function submitActivity() {
      if (!activityForm.title.trim() || !activityForm.scheduledAt.trim() || !activityForm.endsAt.trim() || !activityForm.locationLabel.trim() || !activityForm.note.trim() || !selectedPlan || !eventActivityFitsSchedule(selectedPlan.schedule, activityForm.scheduledAt, activityForm.endsAt)) {
        return;
      }
      await addEventActivity(data.slug, activityForm);
      resetActivityForm();
      showActivityComposer = false;
      await invalidateAll();
    }
    async function changeCommitment(activityId, roleLabel) {
      await setEventActivityCommitment(data.slug, activityId, roleLabel);
      await invalidateAll();
    }
    async function requestPhaseChange(targetPhaseId, reason) {
      if (!targetPhaseId || !reason.trim()) {
        return;
      }
      if (targetPhaseId === data.lifecycle.nextPhaseId && !canAdvanceCurrentPhase) {
        return;
      }
      await requestEventPhaseChange(data.slug, targetPhaseId, reason);
      phaseChangeReason = "";
      await invalidateAll();
    }
    async function voteOnPhaseChange(requestId, vote) {
      await setEventPhaseChangeVote(data.slug, requestId, vote);
      await invalidateAll();
    }
    if (lastCurrentPhaseId !== data.lifecycle.currentPhaseId) {
      lastCurrentPhaseId = data.lifecycle.currentPhaseId;
      activePhaseId = data.lifecycle.currentPhaseId;
      showValueComposer = false;
      showPlanComposer = false;
      showActivityComposer = false;
      phaseChangeReason = "";
      highlightedActivityId = null;
    }
    if (requestedActivityId !== lastRequestedActivityId) {
      lastRequestedActivityId = requestedActivityId;
      if (requestedActivityId) {
        activePhaseId = "activity";
        highlightedActivityId = requestedActivityId;
      }
    }
    if (!data.lifecycle.activity.selectablePlanPhases.some((option) => option.id === activityForm.linkedPlanPhaseId)) {
      activityForm = {
        ...activityForm,
        linkedPlanPhaseId: data.lifecycle.activity.selectablePlanPhases[0]?.id ?? null
      };
    }
    activePhase = data.lifecycle.phases.find((phase) => phase.id === activePhaseId) ?? data.lifecycle.phases.find((phase) => phase.id === data.lifecycle.currentPhaseId) ?? data.lifecycle.phases[0];
    signalSummary = data.lifecycle.phaseOne.signalSummary;
    selectedPlan = data.lifecycle.phaseTwo.plans.find((plan) => plan.id === data.lifecycle.phaseTwo.winningPlanId) ?? null;
    plannedDayIsos = eventPlanScheduledDayIsos(selectedPlan);
    canAdvanceCurrentPhase = data.lifecycle.currentPhaseId === "proposal" ? signalSummary?.advancementUnlocked ?? false : data.lifecycle.currentPhaseId === "event-plan" ? !!data.lifecycle.phaseTwo.winningPlanId : data.lifecycle.currentPhaseId === "activity";
    if (activePhaseId === "activity" && plannedDayIsos.length > 0 && !plannedDayIsos.includes(selectedDayIso)) {
      selectedDayIso = plannedDayIsos[0];
    }
    minimumParticipants = minimumParticipantsFromRoles(activityForm.roleRequirements);
    phaseTabs = data.lifecycle.phases.map((phase) => ({
      phase,
      title: phase.title,
      progressLabel: phaseProgressLabel(phase),
      isFuture: phase.progressState === "upcoming"
    }));
    activePhaseProgressLabel = phaseProgressLabel(activePhase);
    if (lastHowItWorksPhaseId !== activePhaseId) {
      lastHowItWorksPhaseId = activePhaseId;
      showHowItWorks = false;
    }
    if (!showPlanComposer && (planForm.validationMessages?.length ?? 0) > 0) {
      planForm = { ...planForm, validationMessages: [] };
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<section class="lifecycle-shell svelte-ckgvf1">`);
      EventLifecyclePhaseTabs($$renderer3, {
        tabs: phaseTabs,
        activePhaseId,
        selectPhase: (phase) => {
          activePhaseId = phase.id;
        }
      });
      $$renderer3.push(`<!----> <section class="phase-panel svelte-ckgvf1">`);
      EventLifecycleMechanicsCard($$renderer3, {
        phase: activePhase,
        progressLabel: activePhaseProgressLabel,
        get showHowItWorks() {
          return showHowItWorks;
        },
        set showHowItWorks($$value) {
          showHowItWorks = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> `);
      EventLifecycleContent($$renderer3, {
        data,
        activePhaseId,
        signalSummary,
        selectedPlan,
        importanceOptions,
        minimumParticipants,
        submitValue,
        voteOnValue,
        addPlanPhase,
        removePlanPhase,
        submitPlan,
        voteOnPlanValue,
        voteOnPlanOverall,
        openActivityComposerForDay,
        submitActivity,
        changeCommitment,
        get draftValue() {
          return draftValue;
        },
        set draftValue($$value) {
          draftValue = $$value;
          $$settled = false;
        },
        get showValueComposer() {
          return showValueComposer;
        },
        set showValueComposer($$value) {
          showValueComposer = $$value;
          $$settled = false;
        },
        get showPlanComposer() {
          return showPlanComposer;
        },
        set showPlanComposer($$value) {
          showPlanComposer = $$value;
          $$settled = false;
        },
        get showActivityComposer() {
          return showActivityComposer;
        },
        set showActivityComposer($$value) {
          showActivityComposer = $$value;
          $$settled = false;
        },
        get selectedDayIso() {
          return selectedDayIso;
        },
        set selectedDayIso($$value) {
          selectedDayIso = $$value;
          $$settled = false;
        },
        get highlightedActivityId() {
          return highlightedActivityId;
        },
        set highlightedActivityId($$value) {
          highlightedActivityId = $$value;
          $$settled = false;
        },
        get planForm() {
          return planForm;
        },
        set planForm($$value) {
          planForm = $$value;
          $$settled = false;
        },
        get activityForm() {
          return activityForm;
        },
        set activityForm($$value) {
          activityForm = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> `);
      EventPhaseChangeSection($$renderer3, {
        data,
        activePhaseId,
        canAdvanceCurrentPhase,
        requestPhaseChange,
        voteOnPhaseChange,
        get phaseChangeReason() {
          return phaseChangeReason;
        },
        set phaseChangeReason($$value) {
          phaseChangeReason = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----></section></section>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { data, requestedActivityId });
  });
}
function EventOverviewHeader($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let combinedTags, signalSummary, membershipButtonLabel, timeLabel, locationLabel, showScheduledMeta, proposalMetaCopy, quorumLabel;
    let data = $$props["data"];
    async function handleEventShare(username) {
      const result = await shareEventWithUser(data.slug, username);
      if (result.ok) {
        await invalidateAll();
      }
      return result;
    }
    async function handleCreatePostFromEvent() {
      const mention = `[${data.title}]`;
      const params = new URLSearchParams({ prefill: `Sharing context from ${mention}` });
      await goto(`/create/post?${params.toString()}`);
    }
    combinedTags = [...data.channelTags, ...data.communityTags];
    signalSummary = data.lifecycle.phaseOne.signalSummary;
    membershipButtonLabel = `${data.viewerIsGoing ? "Joined" : "Join"} · ${data.memberCount}`;
    timeLabel = data.timeLabel.trim();
    locationLabel = data.locationLabel.trim();
    showScheduledMeta = !!timeLabel || !!locationLabel;
    proposalMetaCopy = data.isPrivate ? "This private event stays proposal-first until an approved plan sets the live schedule and location." : "This event stays proposal-first until an approved plan sets the live schedule and location.";
    quorumLabel = data.lifecycle.quorumVotesRequired <= 0 ? "No votes required yet" : `${data.lifecycle.quorumVotesRequired} ${data.lifecycle.quorumVotesRequired === 1 ? "vote" : "votes"} required from ${data.lifecycle.voteContextPopulation} ${data.lifecycle.voteContextLabel}`;
    $$renderer2.push(`<div class="header-row svelte-1bpmpst"><div class="chips svelte-1bpmpst">`);
    SubjectTablet($$renderer2, { kind: "event" });
    $$renderer2.push(`<!----> `);
    Tablet($$renderer2, {
      label: data.isPrivate ? "Private" : "Public",
      variant: "visibility"
    });
    $$renderer2.push(`<!----></div> <div class="header-actions svelte-1bpmpst">`);
    TagList($$renderer2, { tags: combinedTags });
    $$renderer2.push(`<!----> `);
    ReportControl($$renderer2, {
      itemLabel: "event",
      report: data.report,
      ownerUsername: data.createdByUsername,
      subjectId: data.id,
      targetId: data.id
    });
    $$renderer2.push(`<!----></div></div> <h1 class="svelte-1bpmpst">${escape_html(data.title)}</h1> <p class="overview-copy svelte-1bpmpst">${escape_html(data.description)}</p> <section class="meta-block svelte-1bpmpst" aria-label="Event overview details"><ul class="event-meta-list svelte-1bpmpst">`);
    if (signalSummary) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<li class="meta-item demand-item svelte-1bpmpst"><strong class="svelte-1bpmpst">Signals</strong> <div class="signal-stack svelte-1bpmpst"><div class="meta-button-row svelte-1bpmpst"><button${attr("aria-pressed", data.lifecycle.phaseOne.viewerHasDemandSignal)}${attr_class("demand-button svelte-1bpmpst", void 0, {
        "active-demand": data.lifecycle.phaseOne.viewerHasDemandSignal
      })} type="button">Demand ${escape_html(signalSummary.demandCount)}</button> <button${attr("aria-pressed", data.lifecycle.phaseOne.viewerHasOppositionSignal)}${attr_class("demand-button opposition-button svelte-1bpmpst", void 0, {
        "active-opposition": data.lifecycle.phaseOne.viewerHasOppositionSignal
      })} type="button">Opposition ${escape_html(signalSummary.oppositionCount)}</button></div> <span class="svelte-1bpmpst">Demand is ${escape_html(signalSummary.signalRatioPercent)}% of current proposal signals. `);
      if (signalSummary.usesPlatformVoteContext) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`Proposal advancement also needs ${escape_html(signalSummary.requiredDemandCount)} demand signals from ${escape_html(signalSummary.voteContextPopulation)} weekly active users.`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`Proposal advancement opens once demand stays above 66% of active signals.`);
      }
      $$renderer2.push(`<!--]--></span></div></li>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <li class="meta-item svelte-1bpmpst"><strong class="svelte-1bpmpst">Quorum</strong> <span class="svelte-1bpmpst">${escape_html(quorumLabel)}</span></li> `);
    if (timeLabel) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<li class="meta-item svelte-1bpmpst"><strong class="svelte-1bpmpst">Time</strong> <span class="svelte-1bpmpst">${escape_html(timeLabel)}</span></li>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (locationLabel) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<li class="meta-item svelte-1bpmpst"><strong class="svelte-1bpmpst">Location</strong> <span class="svelte-1bpmpst">${escape_html(locationLabel)}</span></li>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (!showScheduledMeta) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<li class="meta-item svelte-1bpmpst"><strong class="svelte-1bpmpst">Proposal</strong> <span class="svelte-1bpmpst">${escape_html(proposalMetaCopy)}</span></li>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <li class="meta-item svelte-1bpmpst"><strong class="svelte-1bpmpst">Members</strong> <div class="meta-button-row svelte-1bpmpst">`);
    if (data.viewerCanToggleGoing) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button${attr("aria-pressed", data.viewerIsGoing)}${attr_class("demand-button svelte-1bpmpst", void 0, { "active-demand": data.viewerIsGoing })} type="button">${escape_html(membershipButtonLabel)}</button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<span class="svelte-1bpmpst">${escape_html(data.memberCount)}</span>`);
    }
    $$renderer2.push(`<!--]--> `);
    if (data.viewerCanShare) {
      $$renderer2.push("<!--[0-->");
      ShareUserMenu($$renderer2, {
        buttonLabel: data.isPrivate ? "Invite +" : "Share +",
        contacts: data.shareContacts,
        menuTitle: data.isPrivate ? "Invite to event" : "Share event",
        placeholder: "Type a username",
        submitLabel: data.isPrivate ? "Invite" : "Share",
        submitShare: handleEventShare,
        createPost: handleCreatePostFromEvent,
        createPostLabel: "Create post"
      });
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div></li></ul></section>`);
    bind_props($$props, { data });
  });
}
function EventUpdatesSection($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let memberButtonLabel;
    let data = $$props["data"];
    let highlightedUpdateId = fallback($$props["highlightedUpdateId"], null);
    let showMembersPanel = fallback($$props["showMembersPanel"], false);
    let draftUpdateBody = "";
    let draftEditTitle = data.title;
    let draftEditDescription = data.description;
    let showUpdateComposer = false;
    let showUpdateVotes = false;
    let showEditComposer = false;
    let showEditVotes = false;
    let updatePending = false;
    let editPending = false;
    function toggleComposer() {
      showUpdateComposer = !showUpdateComposer;
      if (showUpdateComposer) {
        showUpdateVotes = false;
        showEditComposer = false;
        showEditVotes = false;
      }
    }
    async function voteOnUpdateRequest(requestId, vote) {
      await setEventUpdateVote(data.slug, requestId, vote);
      await invalidateAll();
    }
    async function voteOnEditRequest(requestId, vote) {
      await setEventEditVote(data.slug, requestId, vote);
      await invalidateAll();
    }
    memberButtonLabel = data.isPrivate ? "Members / Editors" : "Members";
    $$renderer2.push(`<section class="updates-shell svelte-14iyu82" id="updates"><div class="updates-title-row svelte-14iyu82"><h2 class="svelte-14iyu82">Updates</h2> `);
    if (data.updateRequests.length > 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button class="vote-chip notice-chip svelte-14iyu82" type="button">Vote Active `);
      CountBadge($$renderer2, { count: data.updateRequests.length });
      $$renderer2.push(`<!----></button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.viewerCanRequestUpdate) {
      $$renderer2.push("<!--[0-->");
      RoundPlusButton($$renderer2, {
        active: showUpdateComposer,
        ariaLabel: "Add update",
        action: toggleComposer
      });
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    if (data.viewerCanRequestUpdate && showUpdateComposer) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="composer-card svelte-14iyu82"><label class="field-stack svelte-14iyu82"><span class="field-label svelte-14iyu82">Update</span> <textarea rows="4" placeholder="Share what changed for this event..." class="svelte-14iyu82">`);
      const $$body = escape_html(draftUpdateBody);
      if ($$body) {
        $$renderer2.push(`${$$body}`);
      }
      $$renderer2.push(`</textarea></label> <div class="composer-actions svelte-14iyu82"><button class="secondary-button svelte-14iyu82" type="button">Cancel</button> <button class="primary-button svelte-14iyu82"${attr("disabled", updatePending, true)} type="button">Propose update</button></div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (showUpdateVotes && data.updateRequests.length > 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="surface-stack svelte-14iyu82"><!--[-->`);
      const each_array = ensure_array_like(data.updateRequests);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let request = each_array[$$index];
        $$renderer2.push(`<article class="surface-card vote-request-card svelte-14iyu82"><div class="vote-card-top svelte-14iyu82"><div class="vote-card-copy svelte-14iyu82"><span class="vote-kicker svelte-14iyu82">Update decision</span></div> <span class="vote-requirement svelte-14iyu82">${escape_html(formatProjectVoteRequirement(request.voteSummary, request.approvalThresholdPercent))}</span></div> <p class="svelte-14iyu82">${escape_html(request.body)}</p> <div class="vote-summary-row svelte-14iyu82"><span class="svelte-14iyu82">${escape_html(formatProjectVoteSummary(request.voteSummary))}</span></div> `);
        VoteCardFooter($$renderer2, {
          authorUsername: request.authorUsername,
          createdAt: request.createdAt,
          activeVote: request.voteSummary.activeVote,
          canVote: data.viewerCanVoteOnUpdateRequests,
          onVote: (vote) => voteOnUpdateRequest(request.id, vote)
        });
        $$renderer2.push(`<!----></article>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div${attr_class("stack updates-list svelte-14iyu82", void 0, { "scrollable": data.updates.length > 4 })}>`);
    if (data.updates.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="empty-card svelte-14iyu82"><p class="svelte-14iyu82">No updates yet.</p></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<!--[-->`);
      const each_array_1 = ensure_array_like(data.updates);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let update = each_array_1[$$index_1];
        DetailUpdateCard($$renderer2, { update, highlightedUpdateId });
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div> `);
    if (data.viewerCanRequestEdit && showEditComposer) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="composer-card svelte-14iyu82"><label class="field-stack svelte-14iyu82"><span class="field-label svelte-14iyu82">Title</span> <input${attr("value", draftEditTitle)} maxlength="120" placeholder="Event title" class="svelte-14iyu82"/></label> <label class="field-stack svelte-14iyu82"><span class="field-label svelte-14iyu82">Description</span> <textarea rows="5" placeholder="Describe the event and what members should know..." class="svelte-14iyu82">`);
      const $$body_1 = escape_html(draftEditDescription);
      if ($$body_1) {
        $$renderer2.push(`${$$body_1}`);
      }
      $$renderer2.push(`</textarea></label> <div class="composer-actions svelte-14iyu82"><button class="secondary-button svelte-14iyu82" type="button">Cancel</button> <button class="primary-button svelte-14iyu82"${attr("disabled", editPending, true)} type="button">Propose edit</button></div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (showEditVotes && data.editRequests.length > 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="surface-stack svelte-14iyu82"><!--[-->`);
      const each_array_2 = ensure_array_like(data.editRequests);
      for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
        let request = each_array_2[$$index_2];
        $$renderer2.push(`<article class="surface-card vote-request-card svelte-14iyu82"><div class="vote-card-top svelte-14iyu82"><div class="vote-card-copy svelte-14iyu82"><span class="vote-kicker svelte-14iyu82">Edit decision</span></div> <span class="vote-requirement svelte-14iyu82">${escape_html(formatProjectVoteRequirement(request.voteSummary, request.approvalThresholdPercent))}</span></div> <div class="edit-request-copy svelte-14iyu82"><p class="svelte-14iyu82">${escape_html(request.description)}</p></div> <div class="vote-summary-row svelte-14iyu82"><span class="svelte-14iyu82">${escape_html(formatProjectVoteSummary(request.voteSummary))}</span></div> `);
        VoteCardFooter($$renderer2, {
          authorUsername: request.authorUsername,
          createdAt: request.createdAt,
          activeVote: request.voteSummary.activeVote,
          canVote: data.viewerCanVoteOnEditRequests,
          onVote: (vote) => voteOnEditRequest(request.id, vote)
        });
        $$renderer2.push(`<!----></article>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="overview-footer-row svelte-14iyu82">`);
    VoteStrip($$renderer2, { activeVote: data.activeVote, count: data.voteCount });
    $$renderer2.push(`<!----> <button${attr("aria-expanded", showMembersPanel)}${attr_class("secondary-button member-toggle-button svelte-14iyu82", void 0, { "active-toggle": showMembersPanel })} type="button">${escape_html(memberButtonLabel)}</button> `);
    if (data.viewerCanRequestEdit) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button${attr("aria-expanded", showEditComposer)}${attr_class("secondary-button member-toggle-button svelte-14iyu82", void 0, { "active-toggle": showEditComposer })} type="button">Edit details</button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.editRequests.length > 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button class="vote-chip notice-chip svelte-14iyu82" type="button">Vote Active `);
      CountBadge($$renderer2, { count: data.editRequests.length });
      $$renderer2.push(`<!----></button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <span class="footer-author-row svelte-14iyu82"><a class="inline-link svelte-14iyu82"${attr("href", `/profile/${data.createdByUsername}`)}>${escape_html(data.createdByUsername)}</a> · ${escape_html(formatRelativeTime(data.createdAt))}</span></div></section>`);
    bind_props($$props, { data, highlightedUpdateId, showMembersPanel });
  });
}
function EventDetailPage($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let data = $$props["data"];
    let highlightedCommentId = null;
    let highlightedUpdateId = null;
    let highlightedActivityId = null;
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
    function readActivityTarget(url) {
      if (url.hash.startsWith("#event-activity-")) {
        return url.hash.slice("#event-activity-".length) || null;
      }
      return url.searchParams.get("activity");
    }
    {
      const routeSignature = `${store_get($$store_subs ??= {}, "$page", page).url.pathname}${store_get($$store_subs ??= {}, "$page", page).url.search}${store_get($$store_subs ??= {}, "$page", page).url.hash}`;
      if (routeSignature !== lastRouteSignature) {
        lastRouteSignature = routeSignature;
        highlightedCommentId = readCommentTarget(store_get($$store_subs ??= {}, "$page", page).url);
        highlightedUpdateId = readUpdateTarget(store_get($$store_subs ??= {}, "$page", page).url);
        highlightedActivityId = readActivityTarget(store_get($$store_subs ??= {}, "$page", page).url);
        const requestedTab = store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("tab");
        activeTab = highlightedCommentId ? "chat" : requestedTab === "history" ? "history" : requestedTab === "chat" ? "chat" : "overview";
      }
    }
    $$renderer2.push(`<section class="page svelte-q3tc8v"><section class="hero-card svelte-q3tc8v"><div class="top-tab-row svelte-q3tc8v" role="tablist" aria-label="Event detail tabs"><button${attr_class("top-tab svelte-q3tc8v", void 0, { "active-tab": activeTab === "overview" })} role="tab" type="button">Overview</button> <button${attr_class("top-tab svelte-q3tc8v", void 0, { "active-tab": activeTab === "chat" })} role="tab" type="button">Chat</button> <button${attr_class("top-tab svelte-q3tc8v", void 0, { "active-tab": activeTab === "history" })} role="tab" type="button">History</button></div> `);
    if (activeTab === "overview") {
      $$renderer2.push("<!--[0-->");
      EventOverviewHeader($$renderer2, { data });
      $$renderer2.push(`<!----> `);
      EventUpdatesSection($$renderer2, { data, highlightedUpdateId, showMembersPanel });
      $$renderer2.push(`<!----> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      EventLifecyclePanel($$renderer2, { data, requestedActivityId: highlightedActivityId });
      $$renderer2.push(`<!---->`);
    } else if (activeTab === "chat") {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<section class="chat-shell svelte-q3tc8v">`);
      LiveChatPanel($$renderer2, {
        comments: data.discussion,
        emptyCopy: "No event chat yet.",
        fitViewport: true,
        highlightedCommentId,
        placeholder: "Message members...",
        subjectId: data.id,
        submitLabel: "Send message",
        title: "Event chat",
        variant: "message"
      });
      $$renderer2.push(`<!----></section>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      EventHistoryTab($$renderer2, { data });
    }
    $$renderer2.push(`<!--]--></section></section>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
    bind_props($$props, { data });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    EventDetailPage($$renderer2, { data: data.event });
    bind_props($$props, { data });
  });
}
export {
  _page as default
};
