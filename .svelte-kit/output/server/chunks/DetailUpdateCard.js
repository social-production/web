import "clsx";
import { f as fallback, b as attr_class, e as escape_html, d as bind_props, c as attr, a as ensure_array_like, h as slot, g as attr_style } from "./renderer.js";
import { a as formatRelativeTime } from "./time.js";
import { f as formatProjectVoteRequirement, a as formatProjectVoteSummary } from "./data.js";
import { R as RoundPlusButton } from "./RoundPlusButton.js";
async function tick() {
}
function VoteCardFooter($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let authorUsername = $$props["authorUsername"];
    let createdAt = $$props["createdAt"];
    let activeVote = fallback($$props["activeVote"], null);
    let canVote = fallback($$props["canVote"], false);
    let showMeta = fallback($$props["showMeta"], true);
    let onVote = fallback($$props["onVote"], () => {
    });
    $$renderer2.push(`<div${attr_class("vote-card-footer svelte-1tpk1m3", void 0, { "actions-only": !showMeta })}>`);
    if (canVote) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="vote-card-actions svelte-1tpk1m3"><button${attr_class("vote-chip svelte-1tpk1m3", void 0, { "active-vote": activeVote === "yes" })} type="button">Approve</button> <button${attr_class("vote-chip negative svelte-1tpk1m3", void 0, { "active-vote": activeVote === "no" })} type="button">Reject</button></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (showMeta) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span class="vote-card-meta svelte-1tpk1m3">${escape_html(authorUsername)} · ${escape_html(formatRelativeTime(createdAt))}</span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, {
      authorUsername,
      createdAt,
      activeVote,
      canVote,
      showMeta,
      onVote
    });
  });
}
function DecisionHistoryCard($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let entry = $$props["entry"];
    let onVote = fallback($$props["onVote"], () => {
    });
    let open = false;
    function statusLabel(status) {
      switch (status) {
        case "approved":
          return "Approved";
        case "rejected":
          return "Rejected";
        default:
          return "Active";
      }
    }
    function requirementLabel(entry2) {
      if (entry2.status === "open") {
        return formatProjectVoteRequirement(entry2.voteSummary, entry2.approvalThresholdPercent);
      }
      return `${entry2.approvalThresholdPercent}% approval needed`;
    }
    function historyVoteSummary(entry2) {
      const baseSummary = formatProjectVoteSummary(entry2.voteSummary);
      if (entry2.status === "open") {
        return baseSummary;
      }
      const castLabel = entry2.voteSummary.totalVotes === 1 ? "vote" : "votes";
      const quorumLabel = entry2.voteSummary.votesRequired === 1 ? "vote" : "votes";
      return `${baseSummary} · ${entry2.voteSummary.totalVotes} ${castLabel} cast out of ${entry2.voteSummary.votesRequired} quorum ${quorumLabel}`;
    }
    $$renderer2.push(`<article${attr_class("history-card svelte-1gon562", void 0, { "expanded": open })}><button${attr("aria-expanded", open)}${attr("aria-controls", `history-details-${entry.id}`)} class="history-toggle svelte-1gon562" type="button"><div class="history-status-row svelte-1gon562"><div class="history-status-left svelte-1gon562"><span class="history-kicker svelte-1gon562">${escape_html(entry.kindLabel)}</span> <span${attr_class(`status-pill ${entry.status}`, "svelte-1gon562")}>${escape_html(statusLabel(entry.status))}</span></div> <span class="history-requirement svelte-1gon562">${escape_html(requirementLabel(entry))}</span></div></button> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <button${attr("aria-controls", `history-details-${entry.id}`)}${attr("aria-expanded", open)} class="history-toggle history-toggle-footer svelte-1gon562" type="button"><div class="history-meta-row svelte-1gon562"><span class="history-meta-left svelte-1gon562">${escape_html(historyVoteSummary(entry))}</span> <span class="history-meta-right svelte-1gon562">${escape_html(entry.authorUsername)} · ${escape_html(formatRelativeTime(entry.createdAt))}</span></div></button></article>`);
    bind_props($$props, { entry, onVote });
  });
}
function DecisionHistoryList($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let activeEntries, completedEntries;
    let title = fallback($$props["title"], "History");
    let description = fallback($$props["description"], "");
    let entries = fallback($$props["entries"], () => [], true);
    let emptyMessage = fallback($$props["emptyMessage"], "No decision history yet.");
    let onVote = fallback($$props["onVote"], () => {
    });
    activeEntries = entries.filter((entry) => entry.status === "open");
    completedEntries = entries.filter((entry) => entry.status !== "open");
    $$renderer2.push(`<section class="history-shell svelte-wlhm3k"><div class="section-copy svelte-wlhm3k"><h2 class="svelte-wlhm3k">${escape_html(title)}</h2> `);
    if (description) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="svelte-wlhm3k">${escape_html(description)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> <section class="history-group svelte-wlhm3k"><div class="group-head svelte-wlhm3k"><h3 class="svelte-wlhm3k">Active Decisions</h3> <span class="svelte-wlhm3k">${escape_html(activeEntries.length)}</span></div> `);
    if (activeEntries.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="empty-card svelte-wlhm3k"><p class="svelte-wlhm3k">No active decisions.</p></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div${attr_class("history-list svelte-wlhm3k", void 0, { "scrollable": activeEntries.length > 5 })}><!--[-->`);
      const each_array = ensure_array_like(activeEntries);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let entry = each_array[$$index];
        $$renderer2.push(`<div class="history-rail-card svelte-wlhm3k">`);
        DecisionHistoryCard($$renderer2, { entry, onVote });
        $$renderer2.push(`<!----></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></section> <section class="history-group svelte-wlhm3k"><div class="group-head svelte-wlhm3k"><h3 class="svelte-wlhm3k">Resolutions</h3> <span class="svelte-wlhm3k">${escape_html(completedEntries.length)}</span></div> `);
    if (completedEntries.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="empty-card svelte-wlhm3k"><p class="svelte-wlhm3k">${escape_html(entries.length === 0 ? emptyMessage : "No resolutions yet.")}</p></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div${attr_class("history-list svelte-wlhm3k", void 0, { "scrollable": completedEntries.length > 5 })}><!--[-->`);
      const each_array_1 = ensure_array_like(completedEntries);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let entry = each_array_1[$$index_1];
        $$renderer2.push(`<div class="history-rail-card svelte-wlhm3k">`);
        DecisionHistoryCard($$renderer2, { entry, onVote });
        $$renderer2.push(`<!----></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></section></section>`);
    bind_props($$props, { title, description, entries, emptyMessage, onVote });
  });
}
function CollapsibleActivityCard($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let resolvedBadgeLabel, resolvedBadgeClass;
    let activity = $$props["activity"];
    let expanded = fallback($$props["expanded"], false);
    let highlighted = fallback($$props["highlighted"], false);
    let readOnly = fallback($$props["readOnly"], false);
    let badgeLabel = fallback($$props["badgeLabel"], null);
    let badgeClass = fallback($$props["badgeClass"], null);
    let changecommitment = fallback($$props["changecommitment"], () => {
    });
    function sameCalendarDay(left, right) {
      return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
    }
    function formatDayDate(value) {
      return value.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
    }
    function formatTime(value) {
      return value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    function timeLabel() {
      const start = new Date(activity.startAt);
      const end = new Date(activity.endAt);
      if (sameCalendarDay(start, end)) {
        return `${formatDayDate(start)}, ${formatTime(start)} - ${formatTime(end)}`;
      }
      return `${formatDayDate(start)}, ${formatTime(start)} - ${formatDayDate(end)}, ${formatTime(end)}`;
    }
    function roleHasOpenCapacity(role) {
      return role.maximumCount == null || role.filledCount < role.maximumCount;
    }
    function commitmentButtonLabel(role) {
      if (role.isViewerAssigned) {
        return "Leave role";
      }
      return roleHasOpenCapacity(role) ? "Take role" : "Role full";
    }
    let open = expanded;
    resolvedBadgeLabel = badgeLabel ?? (activity.isActive ? "Active" : "Pending roles");
    resolvedBadgeClass = badgeClass ?? (activity.isActive ? "complete" : "upcoming");
    if (expanded || highlighted) {
      open = true;
    }
    $$renderer2.push(`<details${attr("id", `activity-${activity.id}`)}${attr("open", open, true)}${attr_class("activity-card-shell svelte-9lm7m7", void 0, { "expanded": open, "highlighted": highlighted })}><summary class="collapse-toggle svelte-9lm7m7"><div class="activity-header svelte-9lm7m7"><div class="activity-copy svelte-9lm7m7"><strong class="svelte-9lm7m7">${escape_html(activity.title)}</strong> <span class="svelte-9lm7m7">${escape_html(timeLabel())}</span></div> <span${attr_class(`phase-badge ${resolvedBadgeClass}`, "svelte-9lm7m7")}>${escape_html(resolvedBadgeLabel)}</span></div> <div class="activity-footer svelte-9lm7m7"><span>${escape_html(activity.locationLabel)}</span> <span class="commitment-summary svelte-9lm7m7"><span>${escape_html(activity.committedCount)}/${escape_html(activity.minimumParticipants)} committed</span> `);
    if (activity.maximumParticipants && activity.maximumParticipants > activity.minimumParticipants) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span>Up to ${escape_html(activity.maximumParticipants)} total</span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (!open) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<a class="creator-link creator-tag svelte-9lm7m7"${attr("href", `/profile/${activity.authorUsername}`)}>${escape_html(activity.authorUsername)}</a>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></span></div></summary> `);
    if (open) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="activity-body svelte-9lm7m7"><p>${escape_html(activity.note)}</p> <div class="activity-footer low-key svelte-9lm7m7"><span>Minimum ${escape_html(activity.minimumParticipants)} needed</span> `);
      if (activity.maximumParticipants && activity.maximumParticipants > activity.minimumParticipants) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span>Up to ${escape_html(activity.maximumParticipants)} total</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (activity.linkedPlanPhaseLabel) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span>Stage: ${escape_html(activity.linkedPlanPhaseLabel)}</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> <div class="role-grid svelte-9lm7m7"><!--[-->`);
      const each_array = ensure_array_like(activity.roles);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let role = each_array[$$index];
        $$renderer2.push(`<div class="role-card svelte-9lm7m7"><strong>${escape_html(role.label)}</strong> <span>${escape_html(role.filledCount)} joined</span> <span>Minimum ${escape_html(role.requiredCount)} `);
        if (role.maximumCount != null) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`· Maximum ${escape_html(role.maximumCount)}`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></span> `);
        if (!readOnly) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<button${attr_class("vote-chip svelte-9lm7m7", void 0, { "selected": activity.viewerAssignedRoleLabel === role.label })}${attr("disabled", !role.isViewerAssigned && !roleHasOpenCapacity(role), true)} type="button">${escape_html(commitmentButtonLabel(role))}</button>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div> <!--[-->`);
      slot($$renderer2, $$props, "default", {});
      $$renderer2.push(`<!--]--> <div class="expanded-footer svelte-9lm7m7"><a class="creator-link creator-tag svelte-9lm7m7"${attr("href", `/profile/${activity.authorUsername}`)}>${escape_html(activity.authorUsername)}</a></div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></details>`);
    bind_props($$props, {
      activity,
      expanded,
      highlighted,
      readOnly,
      badgeLabel,
      badgeClass,
      changecommitment
    });
  });
}
function ProjectActivityCalendarCard($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let plannedDaySet;
    let activities = fallback($$props["activities"], () => [], true);
    let plannedDayIsos = fallback($$props["plannedDayIsos"], () => [], true);
    let selectedDayIso = fallback($$props["selectedDayIso"], "");
    let selectedActivityId = fallback($$props["selectedActivityId"], "");
    let canCreate = fallback($$props["canCreate"], false);
    let createActive = fallback($$props["createActive"], false);
    let createLabel = fallback($$props["createLabel"], "");
    let createSubtitle = fallback($$props["createSubtitle"], "");
    let createAriaLabel = fallback($$props["createAriaLabel"], "Add activity");
    let daySelect = fallback($$props["daySelect"], () => {
    });
    let activitySelect = fallback($$props["activitySelect"], () => {
    });
    let createAction = fallback($$props["createAction"], () => {
    });
    const minutesPerDay = 24 * 60;
    let calendarDays = [];
    let hoveredDayIso = "";
    let hoveredActivityId = "";
    let visibleMonthLabel = "";
    let visibleMonthStart = defaultVisibleMonthStart(activities, selectedDayIso, plannedDayIsos);
    let lastSelectedDayIso = selectedDayIso;
    let lastCalendarSignature = `${activities.map((activity) => activity.id).join("|")}::${plannedDayIsos.join("|")}`;
    function isoDayValue(date) {
      const year = date.getFullYear();
      const month = `${date.getMonth() + 1}`.padStart(2, "0");
      const day = `${date.getDate()}`.padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    function formatTimeLabel(value) {
      const date = value instanceof Date ? value : new Date(value);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    function dateFromValue(value) {
      if (!value) {
        return null;
      }
      const parts = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
      if (parts) {
        return new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
      }
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    function monthStartFor(date) {
      return new Date(date.getFullYear(), date.getMonth(), 1);
    }
    function defaultVisibleMonthStart(sourceActivities, selectedDayValue, plannedDayValues) {
      const selectedDate = dateFromValue(selectedDayValue);
      if (selectedDate) {
        return monthStartFor(selectedDate);
      }
      const firstPlannedDay = plannedDayValues.map((isoDay) => dateFromValue(isoDay)).filter((date) => !!date).sort((left, right) => left.getTime() - right.getTime())[0];
      if (firstPlannedDay) {
        return monthStartFor(firstPlannedDay);
      }
      const now = Date.now();
      const upcomingActivity = sourceActivities.map((activity) => new Date(activity.startAt)).filter((date) => !Number.isNaN(date.getTime()) && date.getTime() >= now).sort((left, right) => left.getTime() - right.getTime())[0];
      const firstActivity = sourceActivities.map((activity) => new Date(activity.startAt)).filter((date) => !Number.isNaN(date.getTime())).sort((left, right) => left.getTime() - right.getTime())[0];
      return monthStartFor(upcomingActivity ?? firstActivity ?? /* @__PURE__ */ new Date());
    }
    function overlaps(left, right) {
      return left.startMinutes < right.endMinutes && right.startMinutes < left.endMinutes;
    }
    function dayRange(isoDay) {
      const start = /* @__PURE__ */ new Date(`${isoDay}T00:00:00`);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { start, end };
    }
    function dayItems(isoDay, sourceActivities) {
      const { start: dayStart, end: dayEnd } = dayRange(isoDay);
      const ranged = sourceActivities.filter((activity) => new Date(activity.startAt).getTime() < dayEnd.getTime() && new Date(activity.endAt).getTime() > dayStart.getTime()).map((activity) => {
        const start = new Date(activity.startAt);
        const end = new Date(activity.endAt);
        const segmentStart = start.getTime() < dayStart.getTime() ? dayStart : start;
        const segmentEnd = end.getTime() > dayEnd.getTime() ? dayEnd : end;
        const startMinutes = (segmentStart.getTime() - dayStart.getTime()) / (60 * 1e3);
        const endMinutes = Math.max((segmentEnd.getTime() - dayStart.getTime()) / (60 * 1e3), startMinutes + 30);
        return {
          id: activity.id,
          title: activity.title,
          statusTone: activity.statusTone,
          startTimeLabel: formatTimeLabel(segmentStart),
          endTimeLabel: formatTimeLabel(segmentEnd),
          startMinutes,
          endMinutes,
          col: 0,
          overlapCount: 1
        };
      }).sort((left, right) => left.startMinutes - right.startMinutes);
      const colEnds = [];
      for (const item of ranged) {
        let assigned = false;
        for (let col = 0; col < colEnds.length; col += 1) {
          if (colEnds[col] <= item.startMinutes) {
            item.col = col;
            colEnds[col] = item.endMinutes;
            assigned = true;
            break;
          }
        }
        if (!assigned) {
          item.col = colEnds.length;
          colEnds.push(item.endMinutes);
        }
      }
      for (const item of ranged) {
        item.overlapCount = Math.max(1, ranged.filter((other) => overlaps(item, other)).length);
      }
      return ranged.map((item) => ({
        id: item.id,
        title: item.title,
        statusTone: item.statusTone,
        startTimeLabel: item.startTimeLabel,
        endTimeLabel: item.endTimeLabel,
        topPercent: item.startMinutes / minutesPerDay * 100,
        heightPercent: (item.endMinutes - item.startMinutes) / minutesPerDay * 100,
        leftPercent: item.col / item.overlapCount * 100,
        widthPercent: 100 / item.overlapCount,
        showTitle: item.overlapCount === 1 && item.endMinutes - item.startMinutes >= 180
      }));
    }
    function buildCalendarDays(sourceActivities, anchor, plannedDaySet2) {
      const start = new Date(anchor);
      const offset = (anchor.getDay() + 6) % 7;
      start.setDate(anchor.getDate() - offset);
      return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(start);
        date.setDate(start.getDate() + index);
        const isoDay = isoDayValue(date);
        return {
          isoDay,
          dayNumber: date.getDate(),
          isCurrentMonth: date.getMonth() === anchor.getMonth(),
          isPlanned: plannedDaySet2.has(isoDay),
          items: dayItems(isoDay, sourceActivities)
        };
      });
    }
    function elementAnchor(element) {
      const rect = element.getBoundingClientRect();
      return {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2
      };
    }
    function eventAnchor(event, element) {
      if (event.clientX || event.clientY) {
        return { clientX: event.clientX, clientY: event.clientY };
      }
      return elementAnchor(element);
    }
    function isPastDay(isoDay) {
      const date = dateFromValue(isoDay);
      if (!date) {
        return false;
      }
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      return date.getTime() < today.getTime();
    }
    function isSelectableDay(isoDay) {
      if (isPastDay(isoDay)) {
        return false;
      }
      return plannedDayIsos.length === 0 || plannedDaySet.has(isoDay);
    }
    if (selectedDayIso !== lastSelectedDayIso) {
      const selectedDate = dateFromValue(selectedDayIso);
      if (selectedDate) {
        visibleMonthStart = monthStartFor(selectedDate);
      }
      lastSelectedDayIso = selectedDayIso;
    }
    {
      const nextCalendarSignature = `${activities.map((activity) => activity.id).join("|")}::${plannedDayIsos.join("|")}`;
      if (!selectedDayIso && nextCalendarSignature !== lastCalendarSignature) {
        visibleMonthStart = defaultVisibleMonthStart(activities, selectedDayIso, plannedDayIsos);
        lastCalendarSignature = nextCalendarSignature;
      }
    }
    visibleMonthLabel = visibleMonthStart.toLocaleDateString([], { month: "long", year: "numeric" });
    plannedDaySet = new Set(plannedDayIsos);
    calendarDays = buildCalendarDays(activities, visibleMonthStart, plannedDaySet);
    $$renderer2.push(`<div class="calendar-shell surface-card svelte-1v15e36"><div class="calendar-toolbar svelte-1v15e36"><button class="month-button svelte-1v15e36" type="button">Prev</button> <strong class="month-label svelte-1v15e36">${escape_html(visibleMonthLabel)}</strong> <button class="month-button svelte-1v15e36" type="button">Next</button></div> <div class="calendar-grid calendar-header-row svelte-1v15e36"><span>Mon</span> <span>Tue</span> <span>Wed</span> <span>Thu</span> <span>Fri</span> <span>Sat</span> <span>Sun</span></div> <div class="calendar-grid svelte-1v15e36"><!--[-->`);
    const each_array = ensure_array_like(calendarDays);
    for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
      let day = each_array[$$index_1];
      $$renderer2.push(`<div${attr_class("calendar-cell svelte-1v15e36", void 0, {
        "muted-day": !day.isCurrentMonth,
        "past-day": isPastDay(day.isoDay),
        "planned-day": day.isPlanned,
        "unplanned-day": plannedDayIsos.length > 0 && !day.isPlanned,
        "hovered-day": hoveredDayIso === day.isoDay,
        "selected-day": selectedDayIso.startsWith(day.isoDay)
      })} role="button"${attr("tabindex", isSelectableDay(day.isoDay) ? 0 : -1)}${attr("aria-disabled", !isSelectableDay(day.isoDay))}><span class="calendar-day-number svelte-1v15e36">${escape_html(day.dayNumber)}</span> `);
      if (day.isPlanned) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span class="planned-indicator svelte-1v15e36" aria-hidden="true"></span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="timeline-track svelte-1v15e36"><!--[-->`);
      const each_array_1 = ensure_array_like(day.items);
      for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
        let item = each_array_1[$$index];
        $$renderer2.push(`<button${attr_class(`timeline-item tone-${item.statusTone}`, "svelte-1v15e36", {
          "hovered-activity": hoveredActivityId === item.id,
          "selected-activity": selectedActivityId === item.id
        })}${attr_style(`top:${item.topPercent}%;height:${item.heightPercent}%;left:${item.leftPercent}%;width:${item.widthPercent}%;`)} type="button"><span class="band-label band-start svelte-1v15e36">${escape_html(item.startTimeLabel)}</span> `);
        if (item.showTitle) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<span class="band-title svelte-1v15e36">${escape_html(item.title)}</span>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> <span class="band-label band-end svelte-1v15e36">${escape_html(item.endTimeLabel)}</span></button>`);
      }
      $$renderer2.push(`<!--]--></div></div>`);
    }
    $$renderer2.push(`<!--]--></div></div> `);
    if (canCreate) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="create-row svelte-1v15e36">`);
      if (createLabel || createSubtitle) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="create-row-copy svelte-1v15e36">`);
        if (createLabel) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<strong class="svelte-1v15e36">${escape_html(createLabel)}</strong>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (createSubtitle) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<span class="svelte-1v15e36">${escape_html(createSubtitle)}</span>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      RoundPlusButton($$renderer2, {
        action: (event) => createAction(event ? eventAnchor(event, event.currentTarget) : void 0),
        active: createActive,
        ariaLabel: createAriaLabel
      });
      $$renderer2.push(`<!----></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, {
      activities,
      plannedDayIsos,
      selectedDayIso,
      selectedActivityId,
      canCreate,
      createActive,
      createLabel,
      createSubtitle,
      createAriaLabel,
      daySelect,
      activitySelect,
      createAction
    });
  });
}
function ProjectActivityRolesEditor($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let roles = fallback($$props["roles"], () => [{ label: "", requiredCount: 1 }], true);
    let title = fallback($$props["title"], "Roles needed");
    function emptyRole() {
      return { label: "", requiredCount: 1 };
    }
    function addRole() {
      roles = [...roles, emptyRole()];
    }
    $$renderer2.push(`<div class="role-editor-shell svelte-1pjtrn6"><div class="role-editor-header"><div><span class="field-inline-label svelte-1pjtrn6">${escape_html(title)}</span> <p class="role-editor-note svelte-1pjtrn6">Add one row per role. Set the minimum needed, and leave max blank if that role has no cap.</p></div></div> <div class="role-row-stack svelte-1pjtrn6"><!--[-->`);
    const each_array = ensure_array_like(roles);
    for (let index = 0, $$length = each_array.length; index < $$length; index++) {
      let role = each_array[index];
      $$renderer2.push(`<div class="role-row svelte-1pjtrn6"><label class="role-field role-name-field svelte-1pjtrn6"><span class="field-inline-label svelte-1pjtrn6">Role</span> <input maxlength="80" placeholder="For example: Intake desk" type="text"${attr("value", role.label)} class="svelte-1pjtrn6"/></label> <label class="role-field role-count-field svelte-1pjtrn6"><span class="field-inline-label svelte-1pjtrn6">Minimum</span> <input min="1" type="number"${attr("value", role.requiredCount)} class="svelte-1pjtrn6"/></label> <label class="role-field role-count-field svelte-1pjtrn6"><span class="field-inline-label svelte-1pjtrn6">Maximum</span> <input${attr("min", role.requiredCount)} placeholder="No cap" type="number"${attr("value", role.maximumCount ?? "")} class="svelte-1pjtrn6"/></label> <div class="role-remove-cell svelte-1pjtrn6">`);
      if (roles.length > 1) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<button class="secondary-button svelte-1pjtrn6" type="button">Remove</button>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div></div>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="role-add-row svelte-1pjtrn6">`);
    RoundPlusButton($$renderer2, { ariaLabel: "Add role", action: addRole });
    $$renderer2.push(`<!----></div></div>`);
    bind_props($$props, { roles, title });
  });
}
function CollapsiblePlanCard($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let plan = $$props["plan"];
    let expanded = fallback($$props["expanded"], false);
    let canVote = fallback($$props["canVote"], false);
    let showRequestSystem = fallback($$props["showRequestSystem"], false);
    let statusLabel = fallback($$props["statusLabel"], null);
    let valuevote = fallback($$props["valuevote"], () => {
    });
    let overallvote = fallback($$props["overallvote"], () => {
    });
    let open = expanded;
    $$renderer2.push(`<details${attr("open", open, true)}${attr_class("surface-card plan-card collapsible-card svelte-ftum7p", void 0, { "expanded": open })}><summary class="collapse-toggle svelte-ftum7p"><span class="plan-card-copy svelte-ftum7p"><span class="plan-header svelte-ftum7p"><strong class="plan-title svelte-ftum7p">${escape_html(plan.title)}</strong> `);
    if ("projectSubtypeLabel" in plan) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span class="subtype-badge svelte-ftum7p">${escape_html(plan.projectSubtypeLabel)}</span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (statusLabel) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span class="phase-badge complete svelte-ftum7p">${escape_html(statusLabel)}</span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></span> <span class="plan-description svelte-ftum7p">${escape_html(plan.description)}</span> `);
    if (!open) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span class="plan-footer-meta base-footer svelte-ftum7p"><span>Overall approval ${escape_html(plan.overallApproval.approvalPercent)}% yes · ${escape_html(plan.overallApproval.yesCount)} yes / ${escape_html(plan.overallApproval.noCount)} no</span> <span>${escape_html(plan.authorUsername)}</span></span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></span></summary> `);
    if (open) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="plan-phase-stack svelte-ftum7p">`);
      if ("schedule" in plan) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="event-plan-meta-stack svelte-ftum7p"><div class="event-plan-meta-item svelte-ftum7p"><strong class="svelte-ftum7p">Timing</strong> <span>${escape_html(plan.schedule.label)}</span></div> <div class="event-plan-meta-item svelte-ftum7p"><strong class="svelte-ftum7p">Location</strong> <span>${escape_html(plan.locationLabel)}</span></div></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="demand-context-card svelte-ftum7p"><strong>Demand at submission</strong> <span class="plan-description svelte-ftum7p">`);
      if (plan.demandSignalSnapshot === null) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`Legacy plan. No demand snapshot was recorded when this plan was created.`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`${escape_html(plan.demandSignalSnapshot)} demand signals were active when this plan was posted.`);
      }
      $$renderer2.push(`<!--]--></span> `);
      if ("schedule" in plan) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="detail-copy svelte-ftum7p"><span class="detail-section-title svelte-ftum7p">Response to demand signal</span> <p>${escape_html(plan.demandConsiderationNote)}</p></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<p>${escape_html(plan.demandConsiderationNote)}</p>`);
      }
      $$renderer2.push(`<!--]--></div> <!--[-->`);
      const each_array = ensure_array_like(plan.planPhases);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let phase = each_array[$$index];
        $$renderer2.push(`<div class="step-card svelte-ftum7p"><strong>Stage: ${escape_html(phase.title)}</strong> <p>${escape_html(phase.details)}</p> `);
        if ("materialsLabel" in phase || "costLabel" in phase) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="plan-footer-meta svelte-ftum7p">`);
          if ("materialsLabel" in phase) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<span>${escape_html(phase.materialsLabel)}</span>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--> `);
          if ("costLabel" in phase) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<span>${escape_html(phase.costLabel)}</span>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--> `);
      if ("totalCostLabel" in plan) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="plan-footer-meta total-cost-row svelte-ftum7p"><span>Total cost</span> <span>${escape_html(plan.totalCostLabel)}</span></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (showRequestSystem && "requestSystemEnabled" in plan) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="plan-footer-meta total-cost-row svelte-ftum7p"><span>Request system</span> <span>${escape_html(plan.requestSystemEnabled ? "Enabled in Phase 5" : "Disabled")}</span></div> `);
        if (plan.requestSystemEnabled) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="plan-footer-meta total-cost-row svelte-ftum7p"><span>Request mode</span> <span>${escape_html(plan.requestMode === "calendar" ? "Calendar only" : plan.requestMode === "direct" ? "Direct only" : "Calendar and direct")}</span></div> <div class="plan-footer-meta total-cost-row svelte-ftum7p"><span>Off-schedule requests</span> <span>${escape_html(plan.allowOffScheduleRequests ? "Allowed" : "Slot-bound only")}</span></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]-->`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> <div class="evaluation-divider svelte-ftum7p"><strong class="svelte-ftum7p">Demand and value criteria</strong> <span class="svelte-ftum7p">The evaluation zone starts with whether the plan accounts for current demand, then moves through the shared values.</span></div> <div class="assessment-stack"><!--[-->`);
      const each_array_1 = ensure_array_like(plan.valueAssessments);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let assessment = each_array_1[$$index_1];
        $$renderer2.push(`<div class="assessment-row svelte-ftum7p"><div class="assessment-copy svelte-ftum7p"><strong>${escape_html(assessment.valueLabel)}</strong> <span class="assessment-votes svelte-ftum7p">${escape_html(assessment.yesCount)} yes · ${escape_html(assessment.noCount)} no</span> <span class="assessment-approval svelte-ftum7p">${escape_html(assessment.approvalPercent)}% yes</span></div> <div class="assessment-actions svelte-ftum7p"><button${attr_class("vote-chip svelte-ftum7p", void 0, { "selected": assessment.activeVote === "yes" })}${attr("disabled", !canVote, true)} type="button">Yes</button> <button${attr_class("vote-chip negative svelte-ftum7p", void 0, { "selected": assessment.activeVote === "no" })}${attr("disabled", !canVote, true)} type="button">No</button></div></div>`);
      }
      $$renderer2.push(`<!--]--></div> <div class="overall-actions-row svelte-ftum7p"><div class="binary-row overall-actions svelte-ftum7p"><button${attr_class("vote-chip svelte-ftum7p", void 0, { "selected": plan.overallApproval.activeVote === "yes" })}${attr("disabled", !canVote, true)} type="button">Approve</button> <button${attr_class("vote-chip negative svelte-ftum7p", void 0, { "selected": plan.overallApproval.activeVote === "no" })}${attr("disabled", !canVote, true)} type="button">Reject</button></div></div> <div class="plan-footer-meta base-footer expanded-footer svelte-ftum7p"><span>Overall approval ${escape_html(plan.overallApproval.approvalPercent)}% yes · ${escape_html(plan.overallApproval.yesCount)} yes / ${escape_html(plan.overallApproval.noCount)} no</span> <span>${escape_html(plan.authorUsername)}</span></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></details>`);
    bind_props($$props, {
      plan,
      expanded,
      canVote,
      showRequestSystem,
      statusLabel,
      valuevote,
      overallvote
    });
  });
}
function DiscreteScale($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let options = fallback($$props["options"], () => [], true);
    let selectedValue = fallback($$props["selectedValue"], 0);
    let disabled = fallback($$props["disabled"], false);
    let leftLabel = fallback($$props["leftLabel"], "");
    let rightLabel = fallback($$props["rightLabel"], "");
    let onSelect = fallback($$props["onSelect"], () => {
    });
    $$renderer2.push(`<div class="scale svelte-7phl2b"><div${attr("aria-label", `${leftLabel} to ${rightLabel}`)} class="track svelte-7phl2b" role="group"><!--[-->`);
    const each_array = ensure_array_like(options);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let option = each_array[$$index];
      $$renderer2.push(`<button${attr("aria-label", option.label)}${attr_class("notch svelte-7phl2b", void 0, {
        "filled": selectedValue >= option.value,
        "selected": selectedValue === option.value
      })}${attr("disabled", disabled, true)}${attr("title", option.label)} type="button"></button>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="labels svelte-7phl2b"><span>${escape_html(leftLabel)}</span> <span>${escape_html(rightLabel)}</span></div></div>`);
    bind_props($$props, {
      options,
      selectedValue,
      disabled,
      leftLabel,
      rightLabel,
      onSelect
    });
  });
}
function ProjectValueCard($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let scoreLabel, voteLabel;
    let value = $$props["value"];
    let canVote = fallback($$props["canVote"], false);
    let options = fallback($$props["options"], () => [], true);
    let vote = fallback($$props["vote"], () => {
    });
    scoreLabel = value.voteCount === 0 ? "No rating" : `${value.importanceScore.toFixed(1).replace(/\.0$/, "")}/10`;
    voteLabel = `${value.voteCount} vote${value.voteCount === 1 ? "" : "s"}`;
    $$renderer2.push(`<article class="value-card svelte-kjbhjm"><strong class="value-title svelte-kjbhjm">${escape_html(value.label)}</strong> `);
    DiscreteScale($$renderer2, {
      disabled: !canVote,
      leftLabel: "Unnecessary",
      onSelect: (selectedValue) => vote(value.id, selectedValue),
      options,
      rightLabel: "Required",
      selectedValue: value.activeImportanceVote
    });
    $$renderer2.push(`<!----> <div class="value-footer svelte-kjbhjm"><span>${escape_html(scoreLabel)} · ${escape_html(voteLabel)}</span> <span>${escape_html(value.authorUsername)}</span></div></article>`);
    bind_props($$props, { value, canVote, options, vote });
  });
}
function ShareUserMenu($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let normalizedQuery;
    let buttonLabel = fallback($$props["buttonLabel"], "Share +");
    let menuTitle = fallback($$props["menuTitle"], "Share");
    let placeholder = fallback($$props["placeholder"], "Type a username");
    let submitLabel = fallback($$props["submitLabel"], "Share");
    let createPostLabel = fallback($$props["createPostLabel"], "Create post");
    let createPost = fallback($$props["createPost"], null);
    let contacts = fallback($$props["contacts"], () => [], true);
    let submitShare = fallback($$props["submitShare"], async () => ({ ok: false, error: "Sharing is unavailable." }));
    let open = false;
    let query = "";
    normalizedQuery = query.trim().toLowerCase();
    normalizedQuery ? contacts.filter((contact) => contact.username.toLowerCase().includes(normalizedQuery)).slice(0, 6) : [];
    $$renderer2.push(`<div class="share-shell svelte-1j420fz"><button${attr("aria-expanded", open)}${attr_class("share-button svelte-1j420fz", void 0, { "active-toggle": open })} type="button">${escape_html(buttonLabel)}</button> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, {
      buttonLabel,
      menuTitle,
      placeholder,
      submitLabel,
      createPostLabel,
      createPost,
      contacts,
      submitShare
    });
  });
}
function DetailUpdateCard($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let isHighlighted;
    let update = $$props["update"];
    let highlightedUpdateId = fallback($$props["highlightedUpdateId"], null);
    isHighlighted = highlightedUpdateId === update.id;
    $$renderer2.push(`<article${attr("id", `update-${update.id}`)}${attr_class("update-card svelte-qyd90v", void 0, { "highlighted": isHighlighted })}><p class="update-body svelte-qyd90v">${escape_html(update.body)}</p> <div class="update-meta svelte-qyd90v"><a class="inline-link svelte-qyd90v"${attr("href", `/profile/${update.authorUsername}`)}>${escape_html(update.authorUsername)}</a> <span class="svelte-qyd90v">updated ${escape_html(formatRelativeTime(update.createdAt))}</span></div></article>`);
    bind_props($$props, { update, highlightedUpdateId });
  });
}
export {
  CollapsibleActivityCard as C,
  DecisionHistoryList as D,
  ProjectActivityCalendarCard as P,
  ShareUserMenu as S,
  VoteCardFooter as V,
  ProjectActivityRolesEditor as a,
  CollapsiblePlanCard as b,
  ProjectValueCard as c,
  DetailUpdateCard as d,
  tick as t
};
