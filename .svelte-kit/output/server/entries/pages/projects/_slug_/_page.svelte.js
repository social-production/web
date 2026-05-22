import { f as fallback, d as bind_props, a as ensure_array_like, e as escape_html, b as attr_class, c as attr, g as attr_style, h as slot, s as store_get, u as unsubscribe_stores } from "../../../../chunks/renderer.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/root.js";
import "../../../../chunks/state.svelte.js";
import { p as page } from "../../../../chunks/stores.js";
import { L as LiveChatPanel } from "../../../../chunks/LiveChatPanel.js";
import { i as invalidateAll, g as goto } from "../../../../chunks/client.js";
import { D as DecisionHistoryList, a as ProjectActivityRolesEditor, C as CollapsibleActivityCard, c as ProjectValueCard, b as CollapsiblePlanCard, P as ProjectActivityCalendarCard, t as tick, V as VoteCardFooter, S as ShareUserMenu, d as DetailUpdateCard } from "../../../../chunks/DetailUpdateCard.js";
import { n as setProjectRepositoryReplacementVote, o as setProjectMergeCapabilityChangeVote, p as setProjectPullRequestVote, q as setProjectServiceRequestSettingsChangeVote, t as setProjectEditVote, u as setProjectUpdateVote, v as setProjectPhaseChangeVote, w as addProjectDistributionPlan, x as addProjectProductionPlan, y as requestProjectPhaseChange, z as setProjectValueImportance, A as setProjectPlanValueVote, B as setProjectPlanOverallVote, C as addProjectValue, D as addProjectActivity, E as addProjectServiceRequest, F as setProjectServiceRequestStatus, G as planProjectServiceRequest, H as requestProjectServiceRequestSettingsChange, I as toggleProjectServiceHistoryCompletion, J as advanceProjectPhase, K as revertProjectPhase, L as addProjectPullRequest, M as requestProjectMergeCapabilityChange, N as requestProjectRepositoryReplacement, O as recordProjectPullRequestMerge, P as setProjectActivityCommitment, Q as shareProjectWithUser } from "../../../../chunks/details.js";
import { i as isPersonalServiceProject, aQ as isCollectiveServiceProject, aR as projectSubtypeOptions, a as formatProjectVoteSummary, f as formatProjectVoteRequirement, aS as isProductiveProject, aT as supportsProjectDemandSignals } from "../../../../chunks/data.js";
import { R as RoundPlusButton } from "../../../../chunks/RoundPlusButton.js";
import { a as formatRelativeTime } from "../../../../chunks/time.js";
import { C as CountBadge } from "../../../../chunks/CountBadge.js";
import { R as ReportControl } from "../../../../chunks/ReportControl.js";
import { S as SubjectTablet } from "../../../../chunks/SubjectTablet.js";
import { T as TagList } from "../../../../chunks/TagList.js";
import { V as VoteStrip } from "../../../../chunks/VoteStrip.js";
function ProjectChatTab($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    let highlightedCommentId = fallback($$props["highlightedCommentId"], null);
    $$renderer2.push(`<section class="chat-shell svelte-1xz5wzc">`);
    LiveChatPanel($$renderer2, {
      comments: data.discussion,
      emptyCopy: "No project chat yet.",
      fitViewport: true,
      highlightedCommentId,
      placeholder: "Message the project...",
      subjectId: data.id,
      submitLabel: "Send",
      title: "# project-chat",
      variant: "message"
    });
    $$renderer2.push(`<!----></section>`);
    bind_props($$props, { data, highlightedCommentId });
  });
}
function ProjectHistoryTab($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    async function handleVote(entry, vote) {
      switch (entry.kind) {
        case "project-phase-change":
          await setProjectPhaseChangeVote(data.slug, entry.id, vote);
          break;
        case "project-update":
          await setProjectUpdateVote(data.slug, entry.id, vote);
          break;
        case "project-edit":
          await setProjectEditVote(data.slug, entry.id, vote);
          break;
        case "project-request-settings-change":
          await setProjectServiceRequestSettingsChangeVote(data.slug, entry.id, vote);
          break;
        case "project-pull-request-approval":
        case "project-pull-request-confirmation":
          await setProjectPullRequestVote(data.slug, entry.id, vote);
          break;
        case "project-merge-capability-change":
          await setProjectMergeCapabilityChangeVote(data.slug, entry.id, vote);
          break;
        case "project-repository-replacement":
          await setProjectRepositoryReplacementVote(data.slug, entry.id, vote);
          break;
        default:
          return;
      }
      await invalidateAll();
    }
    DecisionHistoryList($$renderer2, {
      title: "History",
      description: "Open, approved, and rejected project decisions stay here in one timeline. Open decisions can still be voted from this tab.",
      entries: data.history,
      emptyMessage: "No project decision history yet.",
      onVote: handleVote
    });
    bind_props($$props, { data });
  });
}
function ProjectInventorySummary($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let frame = $$props["frame"];
    let requestedAssetQuantities = fallback($$props["requestedAssetQuantities"], () => ({}), true);
    let setRequestedQuantity = fallback($$props["setRequestedQuantity"], () => {
    });
    function requestedQuantity(assetId) {
      return requestedAssetQuantities[assetId] ?? 0;
    }
    function maxRequestableQuantity(asset) {
      return Math.max(asset.availableQuantity ?? asset.quantity ?? 1, 0);
    }
    function quantitySummary(asset) {
      if (!asset.quantity || asset.quantity <= 1) {
        return asset.availabilityLabel ?? asset.statusLabel;
      }
      return `${asset.availableQuantity ?? asset.quantity} of ${asset.quantity} available`;
    }
    $$renderer2.push(`<section class="inventory-list svelte-8v7rk"><!--[-->`);
    const each_array = ensure_array_like(frame.assetGroups);
    for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
      let group = each_array[$$index_1];
      $$renderer2.push(`<section class="group-block svelte-8v7rk"><h2 class="svelte-8v7rk">${escape_html(group.title)}</h2> `);
      if (group.assets.length === 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<p class="group-empty svelte-8v7rk">No ${escape_html(group.kind === "land-asset" ? "land asset" : "asset")} records are seeded yet.</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<ul class="asset-items svelte-8v7rk"><!--[-->`);
        const each_array_1 = ensure_array_like(group.assets);
        for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
          let asset = each_array_1[$$index];
          $$renderer2.push(`<li${attr_class(`asset-item ${group.kind}`, "svelte-8v7rk")}><div class="asset-copy svelte-8v7rk">`);
          if (asset.href) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<a class="asset-link svelte-8v7rk"${attr("href", asset.href)}>${escape_html(asset.title)}</a>`);
          } else {
            $$renderer2.push("<!--[-1-->");
            $$renderer2.push(`<span class="asset-link muted svelte-8v7rk">${escape_html(asset.title)}</span>`);
          }
          $$renderer2.push(`<!--]--> `);
          if (group.kind === "land-asset") {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<span class="asset-meta svelte-8v7rk">${escape_html(asset.summary)}</span>`);
          } else if (asset.locationLabel) {
            $$renderer2.push("<!--[1-->");
            $$renderer2.push(`<span class="asset-meta svelte-8v7rk">Current location: ${escape_html(asset.locationLabel)}</span>`);
          } else {
            $$renderer2.push("<!--[-1-->");
            $$renderer2.push(`<span class="asset-meta svelte-8v7rk">${escape_html(asset.summary)}</span>`);
          }
          $$renderer2.push(`<!--]--> `);
          if (group.kind === "asset") {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<span class="asset-meta svelte-8v7rk">${escape_html(quantitySummary(asset))}</span>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></div> `);
          if (frame.canRequestAssets) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<div class="asset-control svelte-8v7rk">`);
            if (asset.quantity && asset.quantity > 1) {
              $$renderer2.push("<!--[0-->");
              $$renderer2.push(`<button${attr("aria-label", `Decrease requested quantity for ${asset.title}`)} class="quantity-button svelte-8v7rk"${attr("disabled", requestedQuantity(asset.id) === 0, true)} type="button">-</button> <span class="quantity-value svelte-8v7rk">${escape_html(requestedQuantity(asset.id))}</span> <button${attr("aria-label", `Increase requested quantity for ${asset.title}`)} class="quantity-button svelte-8v7rk"${attr("disabled", requestedQuantity(asset.id) >= maxRequestableQuantity(asset), true)} type="button">+</button>`);
            } else {
              $$renderer2.push("<!--[-1-->");
              $$renderer2.push(`<input${attr("aria-label", `Select ${asset.title}`)}${attr("checked", requestedQuantity(asset.id) > 0, true)} class="asset-checkbox" type="checkbox"/>`);
            }
            $$renderer2.push(`<!--]--></div>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></li>`);
        }
        $$renderer2.push(`<!--]--></ul>`);
      }
      $$renderer2.push(`<!--]--></section>`);
    }
    $$renderer2.push(`<!--]--></section>`);
    bind_props($$props, { frame, requestedAssetQuantities, setRequestedQuantity });
  });
}
function ProjectInventoryTab($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let frame = $$props["frame"];
    let requestedAssetQuantities = {};
    let requestUse = null;
    function allAssets() {
      return frame.assetGroups.flatMap((group) => group.assets);
    }
    function maxRequestableQuantity(assetId) {
      const asset = allAssets().find((entry) => entry.id === assetId);
      if (!asset) {
        return 0;
      }
      return Math.max(asset.availableQuantity ?? asset.quantity ?? 1, 0);
    }
    function selectedAssetRequests() {
      const assetMap = new Map(allAssets().map((asset) => [asset.id, asset]));
      return Object.entries(requestedAssetQuantities).flatMap(([assetId, quantity]) => {
        const asset = assetMap.get(assetId);
        return asset && quantity > 0 ? [{ asset, quantity }] : [];
      });
    }
    function setRequestedQuantity(assetId, quantity) {
      const nextQuantity = Math.max(0, Math.min(quantity, maxRequestableQuantity(assetId)));
      if (nextQuantity === 0) {
        const { [assetId]: _removed, ...rest } = requestedAssetQuantities;
        requestedAssetQuantities = rest;
        return;
      }
      requestedAssetQuantities = { ...requestedAssetQuantities, [assetId]: nextQuantity };
    }
    function selectedAssetLineCount() {
      return selectedAssetRequests().length;
    }
    function selectedUnitCount() {
      return selectedAssetRequests().reduce((total, entry) => total + entry.quantity, 0);
    }
    if (selectedAssetLineCount() === 0 && requestUse) ;
    $$renderer2.push(`<section class="inventory-tab svelte-1bxv17s">`);
    ProjectInventorySummary($$renderer2, { frame, requestedAssetQuantities, setRequestedQuantity });
    $$renderer2.push(`<!----> `);
    if (frame.canRequestAssets) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<section class="request-toolbar svelte-1bxv17s"><span class="selection-copy svelte-1bxv17s">`);
      if (selectedAssetLineCount() === 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`Choose assets and quantities from the rows below.`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`${escape_html(selectedUnitCount())} units across ${escape_html(selectedAssetLineCount())} assets selected`);
      }
      $$renderer2.push(`<!--]--></span> <div class="action-row svelte-1bxv17s"><button class="secondary-button"${attr("disabled", selectedAssetLineCount() === 0, true)} type="button">Request for project use</button> <button class="secondary-button"${attr("disabled", selectedAssetLineCount() === 0, true)} type="button">Request for individual use</button></div></section> `);
      {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></section>`);
    bind_props($$props, { frame });
  });
}
function ProductiveLifecyclePhaseOne($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let minimumParticipants;
    let data = $$props["data"];
    let draftValue = fallback($$props["draftValue"], "");
    let showValueComposer = fallback($$props["showValueComposer"], false);
    let showPersonalActivityComposer = fallback($$props["showPersonalActivityComposer"], false);
    let serviceRequestForm = fallback($$props["serviceRequestForm"], () => ({ title: "", body: "" }), true);
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
    let activityComposerElement = fallback($$props["activityComposerElement"], null);
    let activityStartInputElement = fallback($$props["activityStartInputElement"], null);
    let activityEndInputElement = fallback($$props["activityEndInputElement"], null);
    let highlightedActivityId = fallback($$props["highlightedActivityId"], null);
    let importanceOptions = fallback($$props["importanceOptions"], () => [], true);
    let submitValue = fallback($$props["submitValue"], () => {
    });
    let submitServiceRequest = fallback($$props["submitServiceRequest"], () => {
    });
    let updateRequestStatus = fallback($$props["updateRequestStatus"], () => {
    });
    let openPersonalActivityComposer = fallback($$props["openPersonalActivityComposer"], () => {
    });
    let submitActivity = fallback($$props["submitActivity"], () => {
    });
    let changecommitment = fallback($$props["changecommitment"], () => {
    });
    let vote = fallback($$props["vote"], () => {
    });
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
    function minimumParticipantsForRoles(roleRequirements) {
      return roleRequirements.reduce((total, role) => total + Math.max(1, Number(role.requiredCount) || 1), 0);
    }
    minimumParticipants = minimumParticipantsForRoles(activityForm.roleRequirements);
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<section class="phase-surface svelte-l6zhmq">`);
      if (isPersonalServiceProject(data.projectMode)) {
        $$renderer3.push("<!--[0-->");
        if (data.lifecycle.personalService) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="plan-grid single-column svelte-l6zhmq"><div class="meta-card svelte-l6zhmq"><strong class="svelte-l6zhmq">Availability</strong> <p class="svelte-l6zhmq">${escape_html(data.lifecycle.personalService.availabilitySummary)}</p></div> `);
          if (data.lifecycle.personalService.travelRadiusLabel) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<div class="meta-card svelte-l6zhmq"><strong class="svelte-l6zhmq">Travel radius</strong> <p class="svelte-l6zhmq">${escape_html(data.lifecycle.personalService.travelRadiusLabel)}</p></div>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--></div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (data.lifecycle.requestSystem?.enabled) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="mechanics-card request-card-shell svelte-l6zhmq"><div class="request-header-row svelte-l6zhmq"><div><h3 class="svelte-l6zhmq">Open requests</h3> <p class="svelte-l6zhmq">${escape_html(data.lifecycle.requestSystem.requestCount)} active request${escape_html(data.lifecycle.requestSystem.requestCount === 1 ? "" : "s")}</p></div> `);
          if (data.lifecycle.requestSystem.viewerCanSubmitRequests) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<span class="phase-badge current svelte-l6zhmq">Requests open</span>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--></div> `);
          if (data.lifecycle.requestSystem.viewerCanSubmitRequests) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<div class="composer-card svelte-l6zhmq"><input${attr("value", serviceRequestForm.title)} maxlength="120" placeholder="Request title" class="svelte-l6zhmq"/> <textarea rows="3" placeholder="What help is needed, and when?" class="svelte-l6zhmq">`);
            const $$body = escape_html(serviceRequestForm.body);
            if ($$body) {
              $$renderer3.push(`${$$body}`);
            }
            $$renderer3.push(`</textarea> <div class="composer-actions svelte-l6zhmq"><button class="primary-button svelte-l6zhmq" type="button">Send request</button></div></div>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--> <div class="surface-stack svelte-l6zhmq">`);
          if (data.lifecycle.requestSystem.requests.length === 0) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<div class="empty-card svelte-l6zhmq">No requests yet.</div>`);
          } else {
            $$renderer3.push("<!--[-1-->");
            $$renderer3.push(`<!--[-->`);
            const each_array = ensure_array_like(data.lifecycle.requestSystem.requests);
            for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
              let request = each_array[$$index];
              $$renderer3.push(`<article class="surface-card request-card svelte-l6zhmq"><div class="request-header-row svelte-l6zhmq"><div><strong class="svelte-l6zhmq">${escape_html(request.title)}</strong> <span class="svelte-l6zhmq">${escape_html(formatRelativeTime(request.createdAt))}</span></div> <span${attr_class(
                `phase-badge ${request.status === "accepted" ? "complete" : request.status === "declined" ? "locked" : "upcoming"}`,
                "svelte-l6zhmq"
              )}>${escape_html(requestStatusLabel(request.status))}</span></div> <p class="svelte-l6zhmq">${escape_html(request.body)}</p> `);
              if (data.lifecycle.requestSystem.viewerCanReviewRequests && request.status === "open") {
                $$renderer3.push("<!--[0-->");
                $$renderer3.push(`<div class="binary-row svelte-l6zhmq"><button class="vote-chip svelte-l6zhmq" type="button">Accept</button> <button class="vote-chip negative svelte-l6zhmq" type="button">Decline</button></div>`);
              } else {
                $$renderer3.push("<!--[-1-->");
              }
              $$renderer3.push(`<!--]--></article>`);
            }
            $$renderer3.push(`<!--]-->`);
          }
          $$renderer3.push(`<!--]--></div></div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (data.lifecycle.phaseFive.viewerCanCreateActivities) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="composer-toggle-row svelte-l6zhmq">`);
          RoundPlusButton($$renderer3, {
            active: showPersonalActivityComposer,
            ariaLabel: "Add activity",
            action: () => showPersonalActivityComposer ? showPersonalActivityComposer = false : openPersonalActivityComposer()
          });
          $$renderer3.push(`<!----></div> `);
          if (showPersonalActivityComposer) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<div class="composer-card svelte-l6zhmq"><input${attr("value", activityForm.title)} maxlength="120" placeholder="Activity title" class="svelte-l6zhmq"/> <div class="number-grid svelte-l6zhmq"><label><span class="field-inline-label svelte-l6zhmq">Start time</span> <input${attr("value", activityForm.scheduledAt)} type="datetime-local" class="svelte-l6zhmq"/></label> <label><span class="field-inline-label svelte-l6zhmq">Finish time</span> <input${attr("value", activityForm.endsAt)} type="datetime-local" class="svelte-l6zhmq"/></label></div> <input${attr("value", activityForm.locationLabel)} maxlength="120" placeholder="Location" class="svelte-l6zhmq"/> `);
            ProjectActivityRolesEditor($$renderer3, {
              get roles() {
                return activityForm.roleRequirements;
              },
              set roles($$value) {
                activityForm.roleRequirements = $$value;
                $$settled = false;
              }
            });
            $$renderer3.push(`<!----> <div class="count-field svelte-l6zhmq"><span class="count-field-label svelte-l6zhmq"><span class="field-inline-label svelte-l6zhmq">Minimum people:</span> <span class="count-note svelte-l6zhmq">Calculated from the role minimums above. Leave a role max blank if it has no cap.</span></span> <div class="count-readout svelte-l6zhmq"><strong class="svelte-l6zhmq">${escape_html(minimumParticipants)}</strong></div></div> <textarea rows="3" placeholder="What needs to happen and why?" class="svelte-l6zhmq">`);
            const $$body_1 = escape_html(activityForm.note);
            if ($$body_1) {
              $$renderer3.push(`${$$body_1}`);
            }
            $$renderer3.push(`</textarea> <div class="composer-actions svelte-l6zhmq"><button class="secondary-button svelte-l6zhmq" type="button">Cancel</button> <button class="primary-button svelte-l6zhmq" type="button">Create activity</button></div></div>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]-->`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> <div class="surface-stack svelte-l6zhmq">`);
        if (data.lifecycle.phaseFive.activities.length === 0) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="empty-card svelte-l6zhmq">No activity scheduled yet.</div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
          $$renderer3.push(`<!--[-->`);
          const each_array_1 = ensure_array_like(data.lifecycle.phaseFive.activities);
          for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
            let activity = each_array_1[$$index_1];
            $$renderer3.push(`<div${attr("id", `activity-card-${activity.id}`)} class="svelte-l6zhmq">`);
            CollapsibleActivityCard($$renderer3, {
              activity,
              highlighted: highlightedActivityId === activity.id,
              changecommitment
            });
            $$renderer3.push(`<!----></div>`);
          }
          $$renderer3.push(`<!--]-->`);
        }
        $$renderer3.push(`<!--]--></div>`);
      } else {
        $$renderer3.push("<!--[-1-->");
        if (data.lifecycle.phaseOne.viewerCanAddValue) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="composer-toggle-row svelte-l6zhmq">`);
          RoundPlusButton($$renderer3, {
            active: showValueComposer,
            ariaLabel: "Add value proposal",
            action: () => showValueComposer = !showValueComposer
          });
          $$renderer3.push(`<!----></div> `);
          if (showValueComposer) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<div class="composer-card svelte-l6zhmq"><input${attr("value", draftValue)} maxlength="160" placeholder="Add a value, for example: should make use of unused space" class="svelte-l6zhmq"/> <div class="composer-actions svelte-l6zhmq"><button class="secondary-button svelte-l6zhmq" type="button">Cancel</button> <button class="primary-button svelte-l6zhmq" type="button">Add value</button></div></div>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]-->`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> <div class="surface-stack compact-stack svelte-l6zhmq">`);
        if (data.lifecycle.phaseOne.values.length === 0) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="empty-card svelte-l6zhmq">No values added yet.</div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
          $$renderer3.push(`<!--[-->`);
          const each_array_2 = ensure_array_like(data.lifecycle.phaseOne.values);
          for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
            let value = each_array_2[$$index_2];
            ProjectValueCard($$renderer3, {
              canVote: data.lifecycle.phaseOne.viewerCanVoteOnValues,
              options: importanceOptions,
              value,
              vote
            });
          }
          $$renderer3.push(`<!--]-->`);
        }
        $$renderer3.push(`<!--]--></div>`);
      }
      $$renderer3.push(`<!--]--></section>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, {
      data,
      draftValue,
      showValueComposer,
      showPersonalActivityComposer,
      serviceRequestForm,
      activityForm,
      activityComposerElement,
      activityStartInputElement,
      activityEndInputElement,
      highlightedActivityId,
      importanceOptions,
      submitValue,
      submitServiceRequest,
      updateRequestStatus,
      openPersonalActivityComposer,
      submitActivity,
      changecommitment,
      vote
    });
  });
}
function ProjectLifecyclePlanPhaseContent$1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let isPhaseTwo, collectiveService, plans, canSubmitPlans, canVoteOnPlans, winningPlanId, subtypeOptions, selectedSubtype, currentRepositoryUrl;
    let data = $$props["data"];
    let phaseId = fallback($$props["phaseId"], "phase-2");
    let form = $$props["form"];
    let showComposer = fallback($$props["showComposer"], false);
    let submitLabel = fallback($$props["submitLabel"], "Submit plan");
    let addPlanPhase = fallback($$props["addPlanPhase"], () => {
    });
    let removePlanPhase = fallback($$props["removePlanPhase"], () => {
    });
    let submitPlan = fallback($$props["submitPlan"], () => {
    });
    let isExpandedPlan = fallback($$props["isExpandedPlan"], () => false);
    let valuevote = fallback($$props["valuevote"], () => {
    });
    let overallvote = fallback($$props["overallvote"], () => {
    });
    function emptyCopy() {
      if (isPhaseTwo) {
        return `No ${collectiveService ? "operations" : "production"} plans submitted yet.`;
      }
      return `No ${collectiveService ? "access" : "distribution"} plans submitted yet.`;
    }
    function descriptionPlaceholder() {
      if (isPhaseTwo) {
        return collectiveService ? "Describe the overall operating plan." : "Describe the overall production plan.";
      }
      return collectiveService ? "Describe the overall access plan." : "Describe the overall distribution plan.";
    }
    function demandPlaceholder() {
      return "Explain whether this plan meets the current demand signal. If it does not, explain the gap and why.";
    }
    function statusLabel(planId) {
      if (planId !== winningPlanId) {
        return null;
      }
      return data.lifecycle.currentPhaseId === phaseId ? "Leading above threshold" : "Selected";
    }
    isPhaseTwo = phaseId === "phase-2";
    collectiveService = isCollectiveServiceProject(data.projectMode);
    plans = isPhaseTwo ? data.lifecycle.phaseTwo.plans : data.lifecycle.phaseThree.plans;
    canSubmitPlans = isPhaseTwo ? data.lifecycle.phaseTwo.viewerCanSubmitPlans : data.lifecycle.phaseThree.viewerCanSubmitPlans;
    canVoteOnPlans = isPhaseTwo ? data.lifecycle.phaseTwo.viewerCanVoteOnPlans : data.lifecycle.phaseThree.viewerCanVoteOnPlans;
    winningPlanId = isPhaseTwo ? data.lifecycle.phaseTwo.winningPlanId : data.lifecycle.phaseThree.winningPlanId;
    subtypeOptions = projectSubtypeOptions(data.projectMode);
    selectedSubtype = form.projectSubtype ?? data.lifecycle.currentSubtype ?? "standard";
    currentRepositoryUrl = isPhaseTwo && data.lifecycle.currentSubtype === "software" ? data.lifecycle.phaseTwo.plans.find((plan) => plan.id === data.lifecycle.phaseTwo.winningPlanId)?.repositoryUrl ?? null : null;
    $$renderer2.push(`<section class="phase-surface svelte-1lrybwq">`);
    if (canSubmitPlans) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="composer-toggle-row svelte-1lrybwq">`);
      RoundPlusButton($$renderer2, {
        active: showComposer,
        ariaLabel: "Add plan",
        action: () => showComposer = !showComposer
      });
      $$renderer2.push(`<!----></div> `);
      if (showComposer) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="composer-card svelte-1lrybwq">`);
        if ((form.validationMessages?.length ?? 0) > 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="warning-card svelte-1lrybwq" role="alert"><strong class="svelte-1lrybwq">Plan could not be submitted</strong> <ul class="warning-list svelte-1lrybwq"><!--[-->`);
          const each_array = ensure_array_like(form.validationMessages ?? []);
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let message = each_array[$$index];
            $$renderer2.push(`<li>${escape_html(message)}</li>`);
          }
          $$renderer2.push(`<!--]--></ul></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> <input${attr("value", form.title)} maxlength="120" placeholder="Plan title" class="svelte-1lrybwq"/> <textarea rows="3"${attr("placeholder", descriptionPlaceholder())} class="svelte-1lrybwq">`);
        const $$body = escape_html(form.description);
        if ($$body) {
          $$renderer2.push(`${$$body}`);
        }
        $$renderer2.push(`</textarea> `);
        if (isPhaseTwo) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<label><span class="field-inline-label svelte-1lrybwq">Subtype</span> `);
          $$renderer2.select(
            { value: form.projectSubtype, class: "" },
            ($$renderer3) => {
              $$renderer3.push(`<!--[-->`);
              const each_array_1 = ensure_array_like(subtypeOptions);
              for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
                let option = each_array_1[$$index_1];
                $$renderer3.option({ disabled: option.disabled, value: option.value }, ($$renderer4) => {
                  $$renderer4.push(`${escape_html(option.label)}`);
                });
              }
              $$renderer3.push(`<!--]-->`);
            },
            "svelte-1lrybwq"
          );
          $$renderer2.push(`</label> `);
          if (selectedSubtype === "software") {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<input${attr("value", form.repositoryUrl)} maxlength="240" placeholder="Official repository URL" class="svelte-1lrybwq"/>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]-->`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> <div class="demand-context-card svelte-1lrybwq"><strong class="svelte-1lrybwq">Current demand signal</strong> <span class="svelte-1lrybwq">${escape_html(data.signalCount)} demand signals are active right now.</span> <span class="svelte-1lrybwq">State whether this plan actually meets that demand and, if not, why it still falls short.</span></div> <textarea rows="3"${attr("placeholder", demandPlaceholder())} class="svelte-1lrybwq">`);
        const $$body_1 = escape_html(form.demandConsiderationNote);
        if ($$body_1) {
          $$renderer2.push(`${$$body_1}`);
        }
        $$renderer2.push(`</textarea> <div class="step-stack svelte-1lrybwq"><!--[-->`);
        const each_array_2 = ensure_array_like(form.planPhases);
        for (let index = 0, $$length = each_array_2.length; index < $$length; index++) {
          let phase = each_array_2[index];
          $$renderer2.push(`<div class="step-card svelte-1lrybwq"><div class="step-header-row svelte-1lrybwq"><strong class="svelte-1lrybwq">Stage ${escape_html(index + 1)}</strong> `);
          if (form.planPhases.length > 1) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<button class="secondary-button svelte-1lrybwq" type="button">Remove</button>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></div> <input${attr("value", phase.title)} maxlength="120" placeholder="Stage title" class="svelte-1lrybwq"/> <textarea rows="2" placeholder="Stage description" class="svelte-1lrybwq">`);
          const $$body_2 = escape_html(phase.details);
          if ($$body_2) {
            $$renderer2.push(`${$$body_2}`);
          }
          $$renderer2.push(`</textarea> <input${attr("value", phase.materialsLabel)} maxlength="140" placeholder="Material or resource" class="svelte-1lrybwq"/> <input${attr("value", phase.costLabel)} maxlength="80" placeholder="Stage cost" readonly="" class="blocked-field svelte-1lrybwq"/></div>`);
        }
        $$renderer2.push(`<!--]--></div> <input${attr("value", form.totalCostLabel)} maxlength="80" placeholder="Total cost" readonly="" class="blocked-field svelte-1lrybwq"/> `);
        if (!isPhaseTwo && collectiveService) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<label class="checkbox-row svelte-1lrybwq"><input${attr("checked", form.requestSystemEnabled, true)} type="checkbox" class="svelte-1lrybwq"/> <span class="svelte-1lrybwq">Allow users to request the service in Phase 5</span></label> `);
          if (form.requestSystemEnabled) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<label><span class="field-inline-label svelte-1lrybwq">Request mode</span> `);
            $$renderer2.select(
              { value: form.requestMode, class: "" },
              ($$renderer3) => {
                $$renderer3.option({ value: "calendar" }, ($$renderer4) => {
                  $$renderer4.push(`Scheduled slots only`);
                });
                $$renderer3.option({ value: "direct" }, ($$renderer4) => {
                  $$renderer4.push(`Message requests only`);
                });
                $$renderer3.option({ value: "both" }, ($$renderer4) => {
                  $$renderer4.push(`Scheduled slots and message requests`);
                });
              },
              "svelte-1lrybwq"
            );
            $$renderer2.push(`</label> <label class="checkbox-row svelte-1lrybwq"><input${attr("checked", form.allowOffScheduleRequests, true)} type="checkbox" class="svelte-1lrybwq"/> <span class="svelte-1lrybwq">Allow message requests when no slot is listed</span></label>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]-->`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> <div class="composer-actions svelte-1lrybwq"><button class="secondary-button svelte-1lrybwq" type="button">Add stage</button></div> <div class="composer-actions svelte-1lrybwq"><button class="secondary-button svelte-1lrybwq" type="button">Cancel</button> <button class="primary-button svelte-1lrybwq" type="button">${escape_html(submitLabel)}</button></div></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="surface-stack svelte-1lrybwq">`);
    if (isPhaseTwo && data.lifecycle.currentSubtypeLabel) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="subtype-card svelte-1lrybwq"><strong class="svelte-1lrybwq">Current subtype</strong> <span>${escape_html(data.lifecycle.currentSubtypeLabel)}</span> `);
      if (currentRepositoryUrl) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<a${attr("href", currentRepositoryUrl)} rel="noreferrer" target="_blank">${escape_html(currentRepositoryUrl)}</a>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (plans.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="empty-card svelte-1lrybwq">${escape_html(emptyCopy())}</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<!--[-->`);
      const each_array_3 = ensure_array_like(plans);
      for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
        let plan = each_array_3[$$index_3];
        CollapsiblePlanCard($$renderer2, {
          canVote: canVoteOnPlans,
          expanded: isExpandedPlan(plan.id),
          showRequestSystem: !isPhaseTwo && collectiveService,
          plan,
          statusLabel: statusLabel(plan.id),
          valuevote,
          overallvote
        });
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></section>`);
    bind_props($$props, {
      data,
      phaseId,
      form,
      showComposer,
      submitLabel,
      addPlanPhase,
      removePlanPhase,
      submitPlan,
      isExpandedPlan,
      valuevote,
      overallvote
    });
  });
}
function ProductiveLifecyclePhaseTwo($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let submitLabel;
    let data = $$props["data"];
    let form = $$props["form"];
    let showComposer = fallback($$props["showComposer"], false);
    let addPlanPhase = fallback($$props["addPlanPhase"], () => {
    });
    let removePlanPhase = fallback($$props["removePlanPhase"], () => {
    });
    let submitPlan = fallback($$props["submitPlan"], () => {
    });
    let isExpandedPlan = fallback($$props["isExpandedPlan"], () => false);
    let valuevote = fallback($$props["valuevote"], () => {
    });
    let overallvote = fallback($$props["overallvote"], () => {
    });
    submitLabel = isCollectiveServiceProject(data.projectMode) ? "Submit operations plan" : "Submit production plan";
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (isPersonalServiceProject(data.projectMode)) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<section class="phase-surface svelte-4zu65w"><div class="empty-card svelte-4zu65w">This phase closes the current personal service or converts it into a collective service or productive project when the work grows beyond one person.</div></section>`);
      } else {
        $$renderer3.push("<!--[-1-->");
        ProjectLifecyclePlanPhaseContent$1($$renderer3, {
          data,
          phaseId: "phase-2",
          form,
          submitLabel,
          addPlanPhase,
          removePlanPhase,
          submitPlan,
          isExpandedPlan,
          valuevote,
          overallvote,
          get showComposer() {
            return showComposer;
          },
          set showComposer($$value) {
            showComposer = $$value;
            $$settled = false;
          }
        });
      }
      $$renderer3.push(`<!--]-->`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, {
      data,
      form,
      showComposer,
      addPlanPhase,
      removePlanPhase,
      submitPlan,
      isExpandedPlan,
      valuevote,
      overallvote
    });
  });
}
function ProductiveLifecyclePhaseThree($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let submitLabel;
    let data = $$props["data"];
    let form = $$props["form"];
    let showComposer = fallback($$props["showComposer"], false);
    let addPlanPhase = fallback($$props["addPlanPhase"], () => {
    });
    let removePlanPhase = fallback($$props["removePlanPhase"], () => {
    });
    let submitPlan = fallback($$props["submitPlan"], () => {
    });
    let isExpandedPlan = fallback($$props["isExpandedPlan"], () => false);
    let valuevote = fallback($$props["valuevote"], () => {
    });
    let overallvote = fallback($$props["overallvote"], () => {
    });
    submitLabel = isCollectiveServiceProject(data.projectMode) ? "Submit access plan" : "Submit distribution plan";
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      ProjectLifecyclePlanPhaseContent$1($$renderer3, {
        data,
        phaseId: "phase-3",
        form,
        submitLabel,
        addPlanPhase,
        removePlanPhase,
        submitPlan,
        isExpandedPlan,
        valuevote,
        overallvote,
        get showComposer() {
          return showComposer;
        },
        set showComposer($$value) {
          showComposer = $$value;
          $$settled = false;
        }
      });
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, {
      data,
      form,
      showComposer,
      addPlanPhase,
      removePlanPhase,
      submitPlan,
      isExpandedPlan,
      valuevote,
      overallvote
    });
  });
}
function ProjectAcquisitionPreview($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let preview = $$props["preview"];
    $$renderer2.push(`<section class="acquisition-stack svelte-cqyxbf"><div class="intro-card svelte-cqyxbf"><div class="intro-head svelte-cqyxbf"><h2 class="svelte-cqyxbf">Acquisition preview</h2> <span class="status-pill svelte-cqyxbf">Fake preview</span></div> <p class="svelte-cqyxbf">${escape_html(preview.intro)}</p> <p class="preview-note svelte-cqyxbf">${escape_html(preview.previewNote)}</p></div> `);
    if (preview.fund) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="fund-card svelte-cqyxbf"><div class="fund-head svelte-cqyxbf"><strong class="svelte-cqyxbf">${escape_html(preview.fund.title)}</strong> <span class="status-pill muted-pill svelte-cqyxbf">${escape_html(preview.fund.statusLabel)}</span></div> <div class="progress-track svelte-cqyxbf" aria-hidden="true"><span class="progress-fill svelte-cqyxbf"${attr_style(`width: ${preview.fund.progressPercent}%`)}></span></div> <div class="fund-meta svelte-cqyxbf"><span class="svelte-cqyxbf">${escape_html(preview.fund.raisedLabel)}</span> <span class="svelte-cqyxbf">${escape_html(preview.fund.targetLabel)}</span></div> <p class="svelte-cqyxbf">${escape_html(preview.fund.note)}</p></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="split-grid svelte-cqyxbf"><section class="detail-card svelte-cqyxbf"><h3 class="svelte-cqyxbf">Existing collective assets</h3> `);
    if (preview.existingAssets.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="svelte-cqyxbf">No existing asset previews are seeded.</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="item-stack svelte-cqyxbf"><!--[-->`);
      const each_array = ensure_array_like(preview.existingAssets);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let item = each_array[$$index];
        $$renderer2.push(`<article class="item-card svelte-cqyxbf"><div class="item-head svelte-cqyxbf"><strong class="svelte-cqyxbf">${escape_html(item.title)}</strong> <span class="status-pill muted-pill svelte-cqyxbf">${escape_html(item.statusLabel)}</span></div> <span class="item-meta svelte-cqyxbf">${escape_html(item.sourceLabel)} · ${escape_html(item.costLabel)}</span> <p class="svelte-cqyxbf">${escape_html(item.note)}</p> `);
        if (item.href) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<a class="open-link svelte-cqyxbf"${attr("href", item.href)}>Open related asset record</a>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></article>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></section> <section class="detail-card svelte-cqyxbf"><h3 class="svelte-cqyxbf">Collective purchase targets</h3> `);
    if (preview.purchaseTargets.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="svelte-cqyxbf">No purchase-target previews are seeded.</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="item-stack svelte-cqyxbf"><!--[-->`);
      const each_array_1 = ensure_array_like(preview.purchaseTargets);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let item = each_array_1[$$index_1];
        $$renderer2.push(`<article class="item-card svelte-cqyxbf"><div class="item-head svelte-cqyxbf"><strong class="svelte-cqyxbf">${escape_html(item.title)}</strong> <span class="status-pill muted-pill svelte-cqyxbf">${escape_html(item.statusLabel)}</span></div> <span class="item-meta svelte-cqyxbf">${escape_html(item.sourceLabel)} · ${escape_html(item.costLabel)}</span> <p class="svelte-cqyxbf">${escape_html(item.note)}</p></article>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></section></div> <div class="frame-grid svelte-cqyxbf"><!--[-->`);
    const each_array_2 = ensure_array_like(preview.placeholderSections);
    for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
      let section = each_array_2[$$index_2];
      $$renderer2.push(`<article class="frame-card svelte-cqyxbf"><div class="item-head svelte-cqyxbf"><strong class="svelte-cqyxbf">${escape_html(section.title)}</strong> `);
      if (section.statusLabel) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span class="status-pill muted-pill svelte-cqyxbf">${escape_html(section.statusLabel)}</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div> <p class="svelte-cqyxbf">${escape_html(section.body)}</p></article>`);
    }
    $$renderer2.push(`<!--]--></div></section>`);
    bind_props($$props, { preview });
  });
}
function ProductiveLifecyclePhaseFour($$renderer, $$props) {
  let phaseFour = fallback($$props["phaseFour"], null);
  $$renderer.push(`<section class="phase-surface svelte-zo3yoe">`);
  if (phaseFour) {
    $$renderer.push("<!--[0-->");
    ProjectAcquisitionPreview($$renderer, { preview: phaseFour });
  } else {
    $$renderer.push("<!--[-1-->");
    $$renderer.push(`<div class="empty-card locked-card svelte-zo3yoe">Acquisition preview data is not seeded for this project yet.</div>`);
  }
  $$renderer.push(`<!--]--></section>`);
  bind_props($$props, { phaseFour });
}
function ProjectActivityHistorySection($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let title = fallback($$props["title"], "");
    let description = fallback($$props["description"], "");
    let items = fallback($$props["items"], () => [], true);
    let emptyMessage = fallback($$props["emptyMessage"], "");
    let highlightedHistoryId = fallback($$props["highlightedHistoryId"], null);
    let toggleHistoryCompletion = fallback($$props["toggleHistoryCompletion"], () => {
    });
    function completionStatusText(summary) {
      if (summary.totalEligible === 0) {
        return "No eligible people are assigned on this side yet.";
      }
      const statusParts = [
        `${summary.completedCount}/${summary.totalEligible} completed`,
        `${summary.uncompletedCount} uncompleted`
      ];
      if (summary.pendingCount > 0) {
        statusParts.push(`${summary.pendingCount} pending`);
      }
      return statusParts.join(" · ");
    }
    function isCompletionChoiceActive(summary, selection) {
      return summary.viewerSelection === selection;
    }
    function historyBadgeClass(item) {
      switch (item.aggregateCompletionTone) {
        case "uncompleted":
          return "locked";
        case "mixed":
          return "upcoming";
        default:
          return "complete";
      }
    }
    $$renderer2.push(`<section class="card-rail-section svelte-1aa34n2"><div class="section-head svelte-1aa34n2"><div class="section-copy svelte-1aa34n2"><h3 class="svelte-1aa34n2">${escape_html(title)}</h3> <p class="svelte-1aa34n2">${escape_html(description)}</p></div></div> `);
    if (items.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="empty-card svelte-1aa34n2">${escape_html(emptyMessage)}</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="card-rail svelte-1aa34n2"><!--[-->`);
      const each_array = ensure_array_like(items);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let item = each_array[$$index];
        $$renderer2.push(`<div${attr("id", `history-card-${item.id}`)} class="rail-card svelte-1aa34n2">`);
        CollapsibleActivityCard($$renderer2, {
          activity: item.activity,
          badgeLabel: item.aggregateCompletionLabel,
          badgeClass: historyBadgeClass(item),
          highlighted: highlightedHistoryId === item.id,
          readOnly: true,
          children: ($$renderer3) => {
            if (item.requesterUsername) {
              $$renderer3.push("<!--[0-->");
              $$renderer3.push(`<div class="history-meta-row svelte-1aa34n2"><span class="svelte-1aa34n2">Requester: ${escape_html(item.requesterUsername)}</span> <span class="svelte-1aa34n2">${escape_html(formatRelativeTime(item.activity.endAt))}</span></div>`);
            } else {
              $$renderer3.push("<!--[-1-->");
            }
            $$renderer3.push(`<!--]--> <div class="history-state-row svelte-1aa34n2"><strong class="svelte-1aa34n2">${escape_html(item.historyStateLabel)}</strong> <span class="svelte-1aa34n2">${escape_html(item.historyStateDescription)}</span></div> `);
            if (item.historyState !== "unanswered-request") {
              $$renderer3.push("<!--[0-->");
              $$renderer3.push(`<div${attr_class("completion-grid svelte-1aa34n2", void 0, { "single-column": !item.requesterCompletion })}>`);
              if (item.requesterCompletion) {
                $$renderer3.push("<!--[0-->");
                $$renderer3.push(`<div class="completion-card svelte-1aa34n2"><strong class="svelte-1aa34n2">${escape_html(item.requesterCompletion.label)}</strong> <span class="svelte-1aa34n2">${escape_html(completionStatusText(item.requesterCompletion))}</span> `);
                if (item.requesterCompletion.viewerCanSet) {
                  $$renderer3.push("<!--[0-->");
                  $$renderer3.push(`<div class="completion-actions svelte-1aa34n2"><button${attr_class("vote-chip svelte-1aa34n2", void 0, {
                    "selected": isCompletionChoiceActive(item.requesterCompletion, "completed")
                  })} type="button">Completed</button> <button${attr_class("vote-chip negative svelte-1aa34n2", void 0, {
                    "selected": isCompletionChoiceActive(item.requesterCompletion, "uncompleted")
                  })} type="button">Uncompleted</button></div>`);
                } else {
                  $$renderer3.push("<!--[-1-->");
                }
                $$renderer3.push(`<!--]--></div>`);
              } else {
                $$renderer3.push("<!--[-1-->");
              }
              $$renderer3.push(`<!--]--> <div class="completion-card svelte-1aa34n2"><strong class="svelte-1aa34n2">${escape_html(item.participantCompletion.label)}</strong> <span class="svelte-1aa34n2">${escape_html(completionStatusText(item.participantCompletion))}</span> `);
              if (item.participantCompletion.viewerCanSet) {
                $$renderer3.push("<!--[0-->");
                $$renderer3.push(`<div class="completion-actions svelte-1aa34n2"><button${attr_class("vote-chip svelte-1aa34n2", void 0, {
                  "selected": isCompletionChoiceActive(item.participantCompletion, "completed")
                })} type="button">Completed</button> <button${attr_class("vote-chip negative svelte-1aa34n2", void 0, {
                  "selected": isCompletionChoiceActive(item.participantCompletion, "uncompleted")
                })} type="button">Uncompleted</button></div>`);
              } else {
                $$renderer3.push("<!--[-1-->");
              }
              $$renderer3.push(`<!--]--></div></div>`);
            } else {
              $$renderer3.push("<!--[-1-->");
            }
            $$renderer3.push(`<!--]-->`);
          },
          $$slots: { default: true }
        });
        $$renderer2.push(`<!----></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></section>`);
    bind_props($$props, {
      title,
      description,
      items,
      emptyMessage,
      highlightedHistoryId,
      toggleHistoryCompletion
    });
  });
}
function ProjectSoftwareGovernancePanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let governance = fallback($$props["governance"], null);
    let createPullRequest = fallback($$props["createPullRequest"], () => {
    });
    let requestMergeCapabilityChange = fallback($$props["requestMergeCapabilityChange"], () => {
    });
    let requestRepositoryReplacement = fallback($$props["requestRepositoryReplacement"], () => {
    });
    let recordMerge = fallback($$props["recordMerge"], () => {
    });
    let showComposer = false;
    let showMergeCapabilityComposer = false;
    let showRepositoryReplacementComposer = false;
    let mergeIdsByRequestId = {};
    if (governance) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<section class="software-panel svelte-1gza8fl"><div class="panel-header svelte-1gza8fl"><div><h3 class="svelte-1gza8fl">Software governance</h3> <p class="svelte-1gza8fl">Pull requests move through approval, merge recording, and merge confirmation without leaving the project lifecycle.</p></div> <div class="panel-actions svelte-1gza8fl">`);
      if (governance.viewerCanCreatePullRequests) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<button class="secondary-button svelte-1gza8fl" type="button">${escape_html("New pull request")}</button>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (governance.viewerCanRequestMergeCapabilityChanges) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<button class="secondary-button svelte-1gza8fl" type="button">${escape_html("Change merge capability")}</button>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (governance.viewerCanRequestRepositoryReplacement) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<button class="secondary-button svelte-1gza8fl" type="button">${escape_html("Propose repository replacement")}</button>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div></div> <div class="software-grid svelte-1gza8fl"><div class="detail-card svelte-1gza8fl"><span class="svelte-1gza8fl">Official repository</span> <a${attr("href", governance.repositoryUrl)} rel="noreferrer" target="_blank">${escape_html(governance.repositoryUrl)}</a></div> <div class="detail-card svelte-1gza8fl"><span class="svelte-1gza8fl">License path</span> <strong>${escape_html(governance.licenseLabel)}</strong></div></div> `);
      if (governance.repositoryHistory.length > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="detail-card svelte-1gza8fl"><span class="svelte-1gza8fl">Repository replacement history</span> <div class="history-list svelte-1gza8fl"><!--[-->`);
        const each_array = ensure_array_like(governance.repositoryHistory);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let entry = each_array[$$index];
          $$renderer2.push(`<div class="history-item svelte-1gza8fl"><strong>${escape_html(entry.repositoryUrl)}</strong> <small class="svelte-1gza8fl">Replaced ${escape_html(entry.previousRepositoryUrl)} after ${escape_html(entry.relatedPullRequestId)}</small> <small class="svelte-1gza8fl">${escape_html(entry.reason)}</small> <small class="svelte-1gza8fl">Recorded by ${escape_html(entry.replacedByUsername)} ${escape_html(formatRelativeTime(entry.replacedAt))}</small></div>`);
        }
        $$renderer2.push(`<!--]--></div></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="detail-card svelte-1gza8fl"><span class="svelte-1gza8fl">Merge capability</span> `);
      if (governance.mergeCapabilityMembers.length === 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<strong>No merge-capable members recorded yet.</strong>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<div class="member-list svelte-1gza8fl"><!--[-->`);
        const each_array_1 = ensure_array_like(governance.mergeCapabilityMembers);
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let member = each_array_1[$$index_1];
          $$renderer2.push(`<div class="member-chip svelte-1gza8fl"><strong>${escape_html(member.username)}</strong> <small class="svelte-1gza8fl">${escape_html(member.sourceLabel)}</small></div>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div> `);
      if (governance.viewerCanRequestMergeCapabilityChanges && showMergeCapabilityComposer) ;
      else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (governance.viewerCanRequestRepositoryReplacement && showRepositoryReplacementComposer) ;
      else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (governance.viewerCanCreatePullRequests && showComposer) ;
      else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="request-stack svelte-1gza8fl">`);
      if (governance.mergeCapabilityChangeRequests.length > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<h4 class="stack-title svelte-1gza8fl">Open merge capability votes</h4> <!--[-->`);
        const each_array_4 = ensure_array_like(governance.mergeCapabilityChangeRequests);
        for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
          let request = each_array_4[$$index_4];
          $$renderer2.push(`<article class="request-card svelte-1gza8fl"><div class="request-head svelte-1gza8fl"><div><h4 class="svelte-1gza8fl">${escape_html(request.actionLabel)}</h4> <p class="svelte-1gza8fl">${escape_html(request.targetMember.username)}</p></div> <span class="stage-pill svelte-1gza8fl">Open vote</span></div> <div class="detail-card svelte-1gza8fl"><span class="svelte-1gza8fl">Requested by</span> <strong>${escape_html(request.authorUsername)}</strong> <small class="svelte-1gza8fl">${escape_html(formatRelativeTime(request.createdAt))}</small></div> `);
          if (request.voteSummary) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<div class="vote-card svelte-1gza8fl"><strong>${escape_html(formatProjectVoteSummary(request.voteSummary))}</strong> <small class="svelte-1gza8fl">${escape_html(formatProjectVoteRequirement(request.voteSummary, request.approvalThresholdPercent))}</small> <small class="svelte-1gza8fl">Vote from the History tab.</small></div>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></article>`);
        }
        $$renderer2.push(`<!--]-->`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (governance.repositoryReplacementRequests.length > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<h4 class="stack-title svelte-1gza8fl">Open repository replacement votes</h4> <!--[-->`);
        const each_array_5 = ensure_array_like(governance.repositoryReplacementRequests);
        for (let $$index_5 = 0, $$length = each_array_5.length; $$index_5 < $$length; $$index_5++) {
          let request = each_array_5[$$index_5];
          $$renderer2.push(`<article class="request-card svelte-1gza8fl"><div class="request-head svelte-1gza8fl"><div><h4 class="svelte-1gza8fl">Repository replacement</h4> <p class="svelte-1gza8fl">${escape_html(request.repositoryUrl)}</p></div> <span class="stage-pill svelte-1gza8fl">Open vote</span></div> <div class="software-grid svelte-1gza8fl"><div class="detail-card svelte-1gza8fl"><span class="svelte-1gza8fl">Current repository</span> <a${attr("href", request.previousRepositoryUrl)} rel="noreferrer" target="_blank">${escape_html(request.previousRepositoryUrl)}</a></div> <div class="detail-card svelte-1gza8fl"><span class="svelte-1gza8fl">Blocked pull request</span> <strong>${escape_html(request.relatedPullRequestId)}</strong></div></div> <div class="detail-card svelte-1gza8fl"><span class="svelte-1gza8fl">Reason</span> <strong>${escape_html(request.reason)}</strong> <small class="svelte-1gza8fl">Requested by ${escape_html(request.authorUsername)} ${escape_html(formatRelativeTime(request.createdAt))}</small></div> `);
          if (request.voteSummary) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<div class="vote-card svelte-1gza8fl"><strong>${escape_html(formatProjectVoteSummary(request.voteSummary))}</strong> <small class="svelte-1gza8fl">${escape_html(formatProjectVoteRequirement(request.voteSummary, request.approvalThresholdPercent))}</small> <small class="svelte-1gza8fl">Vote from the History tab.</small></div>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></article>`);
        }
        $$renderer2.push(`<!--]-->`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (governance.pullRequests.length > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<h4 class="stack-title svelte-1gza8fl">Pull requests</h4> <!--[-->`);
        const each_array_6 = ensure_array_like(governance.pullRequests);
        for (let $$index_6 = 0, $$length = each_array_6.length; $$index_6 < $$length; $$index_6++) {
          let request = each_array_6[$$index_6];
          $$renderer2.push(`<article class="request-card svelte-1gza8fl"><div class="request-head svelte-1gza8fl"><div><h4 class="svelte-1gza8fl">${escape_html(request.title)}</h4> <p class="svelte-1gza8fl">${escape_html(request.summary)}</p></div> <span class="stage-pill svelte-1gza8fl">${escape_html(request.stageLabel)}</span></div> <div class="software-grid svelte-1gza8fl"><div class="detail-card svelte-1gza8fl"><span class="svelte-1gza8fl">Pull request</span> <a${attr("href", request.pullRequestUrl)} rel="noreferrer" target="_blank">${escape_html(request.pullRequestId)}</a></div> <div class="detail-card svelte-1gza8fl"><span class="svelte-1gza8fl">Opened by</span> <strong>${escape_html(request.authorUsername)}</strong> <small class="svelte-1gza8fl">${escape_html(formatRelativeTime(request.createdAt))}</small></div></div> `);
          if (request.voteSummary) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<div class="vote-card svelte-1gza8fl"><strong>${escape_html(formatProjectVoteSummary(request.voteSummary))}</strong> <small class="svelte-1gza8fl">${escape_html(formatProjectVoteRequirement(request.voteSummary, request.approvalThresholdPercent))}</small> <small class="svelte-1gza8fl">Vote from the History tab.</small></div>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--> `);
          if (request.mergeId) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<div class="detail-card svelte-1gza8fl"><span class="svelte-1gza8fl">Merged commit</span> <strong>${escape_html(request.mergeId)}</strong> `);
            if (request.mergedByUsername) {
              $$renderer2.push("<!--[0-->");
              $$renderer2.push(`<small class="svelte-1gza8fl">Recorded by ${escape_html(request.mergedByUsername)}</small>`);
            } else {
              $$renderer2.push("<!--[-1-->");
            }
            $$renderer2.push(`<!--]--></div>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--> `);
          if (request.viewerCanRecordMerge) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<div class="merge-row svelte-1gza8fl"><input${attr("value", mergeIdsByRequestId[request.id])} maxlength="120" placeholder="Merge commit or release ID" class="svelte-1gza8fl"/> <button class="primary-button svelte-1gza8fl" type="button">Record merge</button></div>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></article>`);
        }
        $$renderer2.push(`<!--]-->`);
      } else if (governance.mergeCapabilityChangeRequests.length === 0 && governance.repositoryReplacementRequests.length === 0) {
        $$renderer2.push("<!--[1-->");
        $$renderer2.push(`<div class="empty-card svelte-1gza8fl">No software governance decisions are active in this project yet.</div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div></section>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, {
      governance,
      createPullRequest,
      requestMergeCapabilityChange,
      requestRepositoryReplacement,
      recordMerge
    });
  });
}
function ProjectActivityViewTabs($$renderer, $$props) {
  let activeTab = fallback($$props["activeTab"], "live");
  let ariaLabel = fallback($$props["ariaLabel"], "Activity view");
  let liveLabel = fallback($$props["liveLabel"], "Live");
  let historyLabel = fallback($$props["historyLabel"], "History");
  $$renderer.push(`<div class="tab-row svelte-16tjozo" role="tablist"${attr("aria-label", ariaLabel)}><button${attr_class("tab-button svelte-16tjozo", void 0, { "active-tab": activeTab === "live" })} type="button">${escape_html(liveLabel)}</button> <button${attr_class("tab-button svelte-16tjozo", void 0, { "active-tab": activeTab === "history" })} type="button">${escape_html(historyLabel)}</button></div>`);
  bind_props($$props, { activeTab, ariaLabel, liveLabel, historyLabel });
}
function ProductiveLifecyclePhaseFive($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let minimumParticipants, calendarActivities;
    let data = $$props["data"];
    let activityForm = $$props["activityForm"];
    let showComposer = fallback($$props["showComposer"], false);
    let highlightedActivityId = fallback($$props["highlightedActivityId"], null);
    let activityComposerElement = fallback($$props["activityComposerElement"], null);
    let activityStartInputElement = fallback($$props["activityStartInputElement"], null);
    let activityEndInputElement = fallback($$props["activityEndInputElement"], null);
    let openComposer = fallback($$props["openComposer"], () => {
    });
    let openComposerForDay = fallback($$props["openComposerForDay"], () => {
    });
    let focusActivityCard = fallback($$props["focusActivityCard"], () => {
    });
    let submitActivity = fallback($$props["submitActivity"], () => {
    });
    let changecommitment = fallback($$props["changecommitment"], () => {
    });
    let createPullRequest = fallback($$props["createPullRequest"], () => {
    });
    let requestMergeCapabilityChange = fallback($$props["requestMergeCapabilityChange"], () => {
    });
    let requestRepositoryReplacement = fallback($$props["requestRepositoryReplacement"], () => {
    });
    let recordPullRequestMerge = fallback($$props["recordPullRequestMerge"], () => {
    });
    let toggleHistoryCompletion = fallback($$props["toggleHistoryCompletion"], () => {
    });
    let activeTab = "live";
    let highlightedHistoryId = null;
    let historyHighlightResetHandle = null;
    function minimumParticipantsForRoles(roleRequirements) {
      return roleRequirements.reduce((total, role) => total + Math.max(1, Number(role.requiredCount) || 1), 0);
    }
    function historyItemByActivityId(activityId) {
      return data.lifecycle.phaseFive.history.find((item) => item.activity.id === activityId) ?? null;
    }
    function scrollHistoryCardIntoView(historyId) {
      if (typeof document === "undefined") {
        return;
      }
      document.getElementById(`history-card-${historyId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    async function focusHistoryCard(historyId) {
      if (historyHighlightResetHandle) {
        clearTimeout(historyHighlightResetHandle);
      }
      highlightedHistoryId = historyId;
      await tick();
      scrollHistoryCardIntoView(historyId);
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            scrollHistoryCardIntoView(historyId);
          });
        });
      }
      historyHighlightResetHandle = setTimeout(
        () => {
          if (highlightedHistoryId === historyId) {
            highlightedHistoryId = null;
          }
          historyHighlightResetHandle = null;
        },
        1800
      );
    }
    async function openLiveComposer() {
      activeTab = "live";
      await openComposer();
    }
    async function openLiveComposerForDay(isoDay) {
      activeTab = "live";
      await openComposerForDay(isoDay);
    }
    async function toggleActivityComposer() {
      if (showComposer) {
        showComposer = false;
        return;
      }
      await openLiveComposer();
    }
    async function handleActivitySelection(activityId) {
      const historyItem = historyItemByActivityId(activityId);
      if (historyItem && historyItem.activity.statusTone === "green") {
        activeTab = "history";
        await focusHistoryCard(historyItem.id);
        return;
      }
      activeTab = "live";
      await focusActivityCard(activityId);
    }
    minimumParticipants = minimumParticipantsForRoles(activityForm.roleRequirements);
    calendarActivities = [
      ...data.lifecycle.phaseFive.activities,
      ...data.lifecycle.phaseFive.history.filter((item) => item.historyState !== "request-only" && item.activity.statusTone === "green").map((item) => item.activity)
    ];
    if (highlightedActivityId) {
      activeTab = "live";
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<section class="phase-surface svelte-13hnzha">`);
      ProjectSoftwareGovernancePanel($$renderer3, {
        governance: data.lifecycle.phaseFive.softwareGovernance,
        createPullRequest,
        requestMergeCapabilityChange,
        requestRepositoryReplacement,
        recordMerge: recordPullRequestMerge
      });
      $$renderer3.push(`<!----> `);
      ProjectActivityCalendarCard($$renderer3, {
        activities: calendarActivities,
        canCreate: data.lifecycle.phaseFive.viewerCanCreateActivities,
        createActive: showComposer,
        selectedDayIso: activityForm.scheduledAt,
        daySelect: openLiveComposerForDay,
        createAction: toggleActivityComposer,
        activitySelect: handleActivitySelection
      });
      $$renderer3.push(`<!----> `);
      ProjectActivityViewTabs($$renderer3, {
        ariaLabel: "Productive activity view",
        get activeTab() {
          return activeTab;
        },
        set activeTab($$value) {
          activeTab = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> `);
      if (activeTab === "live") {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<section class="card-rail-section svelte-13hnzha"><div class="section-head svelte-13hnzha"><div class="section-copy svelte-13hnzha"><h3 class="svelte-13hnzha">Activity setup</h3> <p class="svelte-13hnzha">Schedule productive work blocks and track which ones have enough committed roles to activate.</p></div> `);
        if (data.lifecycle.phaseFive.viewerCanCreateActivities) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="section-actions svelte-13hnzha"><button class="secondary-button svelte-13hnzha" type="button">${escape_html(showComposer ? "Hide composer" : "New activity")}</button></div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--></div> `);
        if (data.lifecycle.phaseFive.viewerCanCreateActivities && showComposer) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="composer-card svelte-13hnzha"><input${attr("value", activityForm.title)} maxlength="120" placeholder="Activity title" class="svelte-13hnzha"/> <div class="number-grid svelte-13hnzha"><label><span class="field-inline-label svelte-13hnzha">Start time</span> <input${attr("value", activityForm.scheduledAt)} type="datetime-local" class="svelte-13hnzha"/></label> <label><span class="field-inline-label svelte-13hnzha">Finish time</span> <input${attr("value", activityForm.endsAt)} type="datetime-local" class="svelte-13hnzha"/></label></div> <input${attr("value", activityForm.locationLabel)} maxlength="120" placeholder="Place" class="svelte-13hnzha"/> `);
          $$renderer3.select(
            { value: activityForm.linkedPlanPhaseId, class: "" },
            ($$renderer4) => {
              $$renderer4.option({ value: "", disabled: true }, ($$renderer5) => {
                $$renderer5.push(`Choose stage`);
              });
              $$renderer4.push(`<!--[-->`);
              const each_array = ensure_array_like(data.lifecycle.phaseFive.selectablePlanPhases);
              for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                let stage = each_array[$$index];
                $$renderer4.option({ value: stage.id }, ($$renderer5) => {
                  $$renderer5.push(`${escape_html(stage.label)}`);
                });
              }
              $$renderer4.push(`<!--]-->`);
            },
            "svelte-13hnzha"
          );
          $$renderer3.push(` `);
          ProjectActivityRolesEditor($$renderer3, {
            get roles() {
              return activityForm.roleRequirements;
            },
            set roles($$value) {
              activityForm.roleRequirements = $$value;
              $$settled = false;
            }
          });
          $$renderer3.push(`<!----> <div class="count-field svelte-13hnzha"><span class="count-field-label svelte-13hnzha"><span class="field-inline-label svelte-13hnzha">Minimum people:</span> <span class="count-note svelte-13hnzha">Calculated from the role minimums above. Leave a role max blank if it has no cap.</span></span> <div class="count-readout svelte-13hnzha"><strong class="svelte-13hnzha">${escape_html(minimumParticipants)}</strong></div></div> <textarea rows="3" placeholder="What should happen in this activity?" class="svelte-13hnzha">`);
          const $$body = escape_html(activityForm.note);
          if ($$body) {
            $$renderer3.push(`${$$body}`);
          }
          $$renderer3.push(`</textarea> <div class="composer-actions svelte-13hnzha"><button class="secondary-button svelte-13hnzha" type="button">Cancel</button> <button class="primary-button svelte-13hnzha" type="button">Create activity</button></div></div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (data.lifecycle.phaseFive.activities.length === 0) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="empty-card svelte-13hnzha">No activities scheduled yet.</div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
          $$renderer3.push(`<div class="card-rail svelte-13hnzha"><!--[-->`);
          const each_array_1 = ensure_array_like(data.lifecycle.phaseFive.activities);
          for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
            let activity = each_array_1[$$index_1];
            $$renderer3.push(`<div${attr("id", `activity-card-${activity.id}`)} class="rail-card svelte-13hnzha">`);
            CollapsibleActivityCard($$renderer3, {
              activity,
              expanded: highlightedActivityId === activity.id,
              highlighted: highlightedActivityId === activity.id,
              changecommitment
            });
            $$renderer3.push(`<!----></div>`);
          }
          $$renderer3.push(`<!--]--></div>`);
        }
        $$renderer3.push(`<!--]--></section>`);
      } else {
        $$renderer3.push("<!--[-1-->");
        $$renderer3.push(`<div class="history-stack svelte-13hnzha">`);
        ProjectActivityHistorySection($$renderer3, {
          title: "History",
          description: "Past productive activity and completion check-in.",
          items: data.lifecycle.phaseFive.history,
          emptyMessage: "No activity has moved into history yet.",
          highlightedHistoryId,
          toggleHistoryCompletion
        });
        $$renderer3.push(`<!----></div>`);
      }
      $$renderer3.push(`<!--]--></section>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, {
      data,
      activityForm,
      showComposer,
      highlightedActivityId,
      activityComposerElement,
      activityStartInputElement,
      activityEndInputElement,
      openComposer,
      openComposerForDay,
      focusActivityCard,
      submitActivity,
      changecommitment,
      createPullRequest,
      requestMergeCapabilityChange,
      requestRepositoryReplacement,
      recordPullRequestMerge,
      toggleHistoryCompletion
    });
  });
}
function ProductiveLifecyclePhaseSix($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    let activePhaseId = $$props["activePhaseId"];
    let createPullRequest = fallback($$props["createPullRequest"], () => {
    });
    let requestMergeCapabilityChange = fallback($$props["requestMergeCapabilityChange"], () => {
    });
    let requestRepositoryReplacement = fallback($$props["requestRepositoryReplacement"], () => {
    });
    let recordPullRequestMerge = fallback($$props["recordPullRequestMerge"], () => {
    });
    function completionCopy() {
      if (data.linksFrame.conversionLineage) {
        return "This project is already framed as a governed conversion. Keep the permanent predecessor/successor link and inherited inventory note visible in Links while the follow-on service history takes over.";
      }
      if (data.lifecycle.usesPlatformLifecycle && activePhaseId === "phase-6") {
        return "This platform project is waiting for execution review before it can fully close. Keep merge confirmation and any final execution evidence visible in the history before advancing to Closed.";
      }
      if (isPersonalServiceProject(data.projectMode)) {
        return "This phase records the service as closed, while still leaving room to point people toward a future collective service or productive project if the work grows beyond one person.";
      }
      if (isCollectiveServiceProject(data.projectMode)) {
        return "This phase closes the service while keeping its history visible. If related work continues later, it should either move back into planning or link to a new project.";
      }
      return "This phase records the project as closed or converted into an ongoing service. The history above stays visible either way.";
    }
    $$renderer2.push(`<section class="phase-surface svelte-mq9w6y">`);
    if (data.lifecycle.usesPlatformLifecycle && data.lifecycle.phaseFive.softwareGovernance) {
      $$renderer2.push("<!--[0-->");
      ProjectSoftwareGovernancePanel($$renderer2, {
        governance: data.lifecycle.phaseFive.softwareGovernance,
        createPullRequest,
        requestMergeCapabilityChange,
        requestRepositoryReplacement,
        recordMerge: recordPullRequestMerge
      });
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="empty-card svelte-mq9w6y">${escape_html(completionCopy())}</div></section>`);
    bind_props($$props, {
      data,
      activePhaseId,
      createPullRequest,
      requestMergeCapabilityChange,
      requestRepositoryReplacement,
      recordPullRequestMerge
    });
  });
}
function ProductiveLifecycleContent($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    let activePhaseId = $$props["activePhaseId"];
    let importanceOptions = fallback($$props["importanceOptions"], () => [], true);
    let draftValue = fallback($$props["draftValue"], "");
    let showPhaseOneComposer = fallback($$props["showPhaseOneComposer"], false);
    let showPhaseTwoComposer = fallback($$props["showPhaseTwoComposer"], false);
    let showPhaseThreeComposer = fallback($$props["showPhaseThreeComposer"], false);
    let showPhaseFiveComposer = fallback($$props["showPhaseFiveComposer"], false);
    let productionForm = $$props["productionForm"];
    let distributionForm = $$props["distributionForm"];
    let activityForm = $$props["activityForm"];
    let highlightedActivityId = fallback($$props["highlightedActivityId"], null);
    let activityComposerElement = fallback($$props["activityComposerElement"], null);
    let activityStartInputElement = fallback($$props["activityStartInputElement"], null);
    let activityEndInputElement = fallback($$props["activityEndInputElement"], null);
    let submitValue = fallback($$props["submitValue"], () => {
    });
    let setProjectValueVote = fallback($$props["setProjectValueVote"], () => {
    });
    let addProductionPlanPhase = fallback($$props["addProductionPlanPhase"], () => {
    });
    let removeProductionPlanPhase = fallback($$props["removeProductionPlanPhase"], () => {
    });
    let submitProductionPlan = fallback($$props["submitProductionPlan"], () => {
    });
    let setPhaseTwoPlanValueVote = fallback($$props["setPhaseTwoPlanValueVote"], () => {
    });
    let setPhaseTwoPlanOverallVote = fallback($$props["setPhaseTwoPlanOverallVote"], () => {
    });
    let addDistributionPlanPhase = fallback($$props["addDistributionPlanPhase"], () => {
    });
    let removeDistributionPlanPhase = fallback($$props["removeDistributionPlanPhase"], () => {
    });
    let submitDistributionPlan = fallback($$props["submitDistributionPlan"], () => {
    });
    let setPhaseThreePlanValueVote = fallback($$props["setPhaseThreePlanValueVote"], () => {
    });
    let setPhaseThreePlanOverallVote = fallback($$props["setPhaseThreePlanOverallVote"], () => {
    });
    let isExpandedPlan = fallback($$props["isExpandedPlan"], () => false);
    let openActivityComposer = fallback($$props["openActivityComposer"], () => {
    });
    let openActivityComposerForDay = fallback($$props["openActivityComposerForDay"], () => {
    });
    let focusActivityCard = fallback($$props["focusActivityCard"], () => {
    });
    let submitActivity = fallback($$props["submitActivity"], () => {
    });
    let updateActivityCommitment = fallback($$props["updateActivityCommitment"], () => {
    });
    let createPullRequest = fallback($$props["createPullRequest"], () => {
    });
    let requestMergeCapabilityChange = fallback($$props["requestMergeCapabilityChange"], () => {
    });
    let requestRepositoryReplacement = fallback($$props["requestRepositoryReplacement"], () => {
    });
    let recordPullRequestMerge = fallback($$props["recordPullRequestMerge"], () => {
    });
    let toggleHistoryCompletion = fallback($$props["toggleHistoryCompletion"], () => {
    });
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (activePhaseId === "phase-1") {
        $$renderer3.push("<!--[0-->");
        ProductiveLifecyclePhaseOne($$renderer3, {
          data,
          importanceOptions,
          submitValue,
          vote: setProjectValueVote,
          get draftValue() {
            return draftValue;
          },
          set draftValue($$value) {
            draftValue = $$value;
            $$settled = false;
          },
          get showValueComposer() {
            return showPhaseOneComposer;
          },
          set showValueComposer($$value) {
            showPhaseOneComposer = $$value;
            $$settled = false;
          }
        });
      } else if (activePhaseId === "phase-2") {
        $$renderer3.push("<!--[1-->");
        ProductiveLifecyclePhaseTwo($$renderer3, {
          data,
          form: productionForm,
          addPlanPhase: addProductionPlanPhase,
          removePlanPhase: removeProductionPlanPhase,
          submitPlan: submitProductionPlan,
          isExpandedPlan: (planId) => isExpandedPlan("phase-2", planId),
          valuevote: setPhaseTwoPlanValueVote,
          overallvote: setPhaseTwoPlanOverallVote,
          get showComposer() {
            return showPhaseTwoComposer;
          },
          set showComposer($$value) {
            showPhaseTwoComposer = $$value;
            $$settled = false;
          }
        });
      } else if (activePhaseId === "phase-3") {
        $$renderer3.push("<!--[2-->");
        ProductiveLifecyclePhaseThree($$renderer3, {
          data,
          form: distributionForm,
          addPlanPhase: addDistributionPlanPhase,
          removePlanPhase: removeDistributionPlanPhase,
          submitPlan: submitDistributionPlan,
          isExpandedPlan: (planId) => isExpandedPlan("phase-3", planId),
          valuevote: setPhaseThreePlanValueVote,
          overallvote: setPhaseThreePlanOverallVote,
          get showComposer() {
            return showPhaseThreeComposer;
          },
          set showComposer($$value) {
            showPhaseThreeComposer = $$value;
            $$settled = false;
          }
        });
      } else if (activePhaseId === "phase-4") {
        $$renderer3.push("<!--[3-->");
        ProductiveLifecyclePhaseFour($$renderer3, { phaseFour: data.lifecycle.phaseFour });
      } else if (activePhaseId === "phase-5") {
        $$renderer3.push("<!--[4-->");
        ProductiveLifecyclePhaseFive($$renderer3, {
          data,
          activityForm,
          highlightedActivityId,
          openComposer: openActivityComposer,
          openComposerForDay: openActivityComposerForDay,
          focusActivityCard,
          submitActivity,
          changecommitment: updateActivityCommitment,
          createPullRequest,
          requestMergeCapabilityChange,
          requestRepositoryReplacement,
          recordPullRequestMerge,
          toggleHistoryCompletion,
          get activityComposerElement() {
            return activityComposerElement;
          },
          set activityComposerElement($$value) {
            activityComposerElement = $$value;
            $$settled = false;
          },
          get activityEndInputElement() {
            return activityEndInputElement;
          },
          set activityEndInputElement($$value) {
            activityEndInputElement = $$value;
            $$settled = false;
          },
          get activityStartInputElement() {
            return activityStartInputElement;
          },
          set activityStartInputElement($$value) {
            activityStartInputElement = $$value;
            $$settled = false;
          },
          get showComposer() {
            return showPhaseFiveComposer;
          },
          set showComposer($$value) {
            showPhaseFiveComposer = $$value;
            $$settled = false;
          }
        });
      } else if (activePhaseId === "phase-6" || activePhaseId === "phase-7") {
        $$renderer3.push("<!--[5-->");
        ProductiveLifecyclePhaseSix($$renderer3, {
          data,
          activePhaseId,
          createPullRequest,
          requestMergeCapabilityChange,
          requestRepositoryReplacement,
          recordPullRequestMerge
        });
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]-->`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, {
      data,
      activePhaseId,
      importanceOptions,
      draftValue,
      showPhaseOneComposer,
      showPhaseTwoComposer,
      showPhaseThreeComposer,
      showPhaseFiveComposer,
      productionForm,
      distributionForm,
      activityForm,
      highlightedActivityId,
      activityComposerElement,
      activityStartInputElement,
      activityEndInputElement,
      submitValue,
      setProjectValueVote,
      addProductionPlanPhase,
      removeProductionPlanPhase,
      submitProductionPlan,
      setPhaseTwoPlanValueVote,
      setPhaseTwoPlanOverallVote,
      addDistributionPlanPhase,
      removeDistributionPlanPhase,
      submitDistributionPlan,
      setPhaseThreePlanValueVote,
      setPhaseThreePlanOverallVote,
      isExpandedPlan,
      openActivityComposer,
      openActivityComposerForDay,
      focusActivityCard,
      submitActivity,
      updateActivityCommitment,
      createPullRequest,
      requestMergeCapabilityChange,
      requestRepositoryReplacement,
      recordPullRequestMerge,
      toggleHistoryCompletion
    });
  });
}
function CollectiveServicePhaseOne($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let minimumParticipants;
    let data = $$props["data"];
    let draftValue = fallback($$props["draftValue"], "");
    let showValueComposer = fallback($$props["showValueComposer"], false);
    let showPersonalActivityComposer = fallback($$props["showPersonalActivityComposer"], false);
    let serviceRequestForm = fallback($$props["serviceRequestForm"], () => ({ title: "", body: "" }), true);
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
    let activityComposerElement = fallback($$props["activityComposerElement"], null);
    let activityStartInputElement = fallback($$props["activityStartInputElement"], null);
    let activityEndInputElement = fallback($$props["activityEndInputElement"], null);
    let highlightedActivityId = fallback($$props["highlightedActivityId"], null);
    let importanceOptions = fallback($$props["importanceOptions"], () => [], true);
    let submitValue = fallback($$props["submitValue"], () => {
    });
    let submitServiceRequest = fallback($$props["submitServiceRequest"], () => {
    });
    let updateRequestStatus = fallback($$props["updateRequestStatus"], () => {
    });
    let openPersonalActivityComposer = fallback($$props["openPersonalActivityComposer"], () => {
    });
    let submitActivity = fallback($$props["submitActivity"], () => {
    });
    let changecommitment = fallback($$props["changecommitment"], () => {
    });
    let vote = fallback($$props["vote"], () => {
    });
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
    function minimumParticipantsForRoles(roleRequirements) {
      return roleRequirements.reduce((total, role) => total + Math.max(1, Number(role.requiredCount) || 1), 0);
    }
    minimumParticipants = minimumParticipantsForRoles(activityForm.roleRequirements);
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<section class="phase-surface svelte-s104yn">`);
      if (isPersonalServiceProject(data.projectMode)) {
        $$renderer3.push("<!--[0-->");
        if (data.lifecycle.personalService) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="plan-grid single-column svelte-s104yn"><div class="meta-card svelte-s104yn"><strong class="svelte-s104yn">Availability</strong> <p class="svelte-s104yn">${escape_html(data.lifecycle.personalService.availabilitySummary)}</p></div> `);
          if (data.lifecycle.personalService.travelRadiusLabel) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<div class="meta-card svelte-s104yn"><strong class="svelte-s104yn">Travel radius</strong> <p class="svelte-s104yn">${escape_html(data.lifecycle.personalService.travelRadiusLabel)}</p></div>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--></div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (data.lifecycle.requestSystem?.enabled) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="mechanics-card request-card-shell svelte-s104yn"><div class="request-header-row svelte-s104yn"><div><h3 class="svelte-s104yn">Open requests</h3> <p class="svelte-s104yn">${escape_html(data.lifecycle.requestSystem.requestCount)} active request${escape_html(data.lifecycle.requestSystem.requestCount === 1 ? "" : "s")}</p></div> `);
          if (data.lifecycle.requestSystem.viewerCanSubmitRequests) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<span class="phase-badge current svelte-s104yn">Requests open</span>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--></div> `);
          if (data.lifecycle.requestSystem.viewerCanSubmitRequests) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<div class="composer-card svelte-s104yn"><input${attr("value", serviceRequestForm.title)} maxlength="120" placeholder="Request title" class="svelte-s104yn"/> <textarea rows="3" placeholder="What help is needed, and when?" class="svelte-s104yn">`);
            const $$body = escape_html(serviceRequestForm.body);
            if ($$body) {
              $$renderer3.push(`${$$body}`);
            }
            $$renderer3.push(`</textarea> <div class="composer-actions svelte-s104yn"><button class="primary-button svelte-s104yn" type="button">Send request</button></div></div>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--> <div class="surface-stack svelte-s104yn">`);
          if (data.lifecycle.requestSystem.requests.length === 0) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<div class="empty-card svelte-s104yn">No requests yet.</div>`);
          } else {
            $$renderer3.push("<!--[-1-->");
            $$renderer3.push(`<!--[-->`);
            const each_array = ensure_array_like(data.lifecycle.requestSystem.requests);
            for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
              let request = each_array[$$index];
              $$renderer3.push(`<article class="surface-card request-card svelte-s104yn"><div class="request-header-row svelte-s104yn"><div><strong class="svelte-s104yn">${escape_html(request.title)}</strong> <span class="svelte-s104yn">${escape_html(formatRelativeTime(request.createdAt))}</span></div> <span${attr_class(
                `phase-badge ${request.status === "accepted" ? "complete" : request.status === "declined" ? "locked" : "upcoming"}`,
                "svelte-s104yn"
              )}>${escape_html(requestStatusLabel(request.status))}</span></div> <p class="svelte-s104yn">${escape_html(request.body)}</p> `);
              if (data.lifecycle.requestSystem.viewerCanReviewRequests && request.status === "open") {
                $$renderer3.push("<!--[0-->");
                $$renderer3.push(`<div class="binary-row svelte-s104yn"><button class="vote-chip svelte-s104yn" type="button">Accept</button> <button class="vote-chip negative svelte-s104yn" type="button">Decline</button></div>`);
              } else {
                $$renderer3.push("<!--[-1-->");
              }
              $$renderer3.push(`<!--]--></article>`);
            }
            $$renderer3.push(`<!--]-->`);
          }
          $$renderer3.push(`<!--]--></div></div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (data.lifecycle.phaseFive.viewerCanCreateActivities) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="composer-toggle-row svelte-s104yn">`);
          RoundPlusButton($$renderer3, {
            active: showPersonalActivityComposer,
            ariaLabel: "Add activity",
            action: () => showPersonalActivityComposer ? showPersonalActivityComposer = false : openPersonalActivityComposer()
          });
          $$renderer3.push(`<!----></div> `);
          if (showPersonalActivityComposer) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<div class="composer-card svelte-s104yn"><input${attr("value", activityForm.title)} maxlength="120" placeholder="Activity title" class="svelte-s104yn"/> <div class="number-grid svelte-s104yn"><label><span class="field-inline-label svelte-s104yn">Start time</span> <input${attr("value", activityForm.scheduledAt)} type="datetime-local" class="svelte-s104yn"/></label> <label><span class="field-inline-label svelte-s104yn">Finish time</span> <input${attr("value", activityForm.endsAt)} type="datetime-local" class="svelte-s104yn"/></label></div> <input${attr("value", activityForm.locationLabel)} maxlength="120" placeholder="Location" class="svelte-s104yn"/> `);
            ProjectActivityRolesEditor($$renderer3, {
              get roles() {
                return activityForm.roleRequirements;
              },
              set roles($$value) {
                activityForm.roleRequirements = $$value;
                $$settled = false;
              }
            });
            $$renderer3.push(`<!----> <div class="count-field svelte-s104yn"><span class="count-field-label svelte-s104yn"><span class="field-inline-label svelte-s104yn">Minimum people:</span> <span class="count-note svelte-s104yn">Calculated from the role minimums above. Leave a role max blank if it has no cap.</span></span> <div class="count-readout svelte-s104yn"><strong class="svelte-s104yn">${escape_html(minimumParticipants)}</strong></div></div> <textarea rows="3" placeholder="What needs to happen and why?" class="svelte-s104yn">`);
            const $$body_1 = escape_html(activityForm.note);
            if ($$body_1) {
              $$renderer3.push(`${$$body_1}`);
            }
            $$renderer3.push(`</textarea> <div class="composer-actions svelte-s104yn"><button class="secondary-button svelte-s104yn" type="button">Cancel</button> <button class="primary-button svelte-s104yn" type="button">Create activity</button></div></div>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]-->`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> <div class="surface-stack svelte-s104yn">`);
        if (data.lifecycle.phaseFive.activities.length === 0) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="empty-card svelte-s104yn">No activity scheduled yet.</div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
          $$renderer3.push(`<!--[-->`);
          const each_array_1 = ensure_array_like(data.lifecycle.phaseFive.activities);
          for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
            let activity = each_array_1[$$index_1];
            $$renderer3.push(`<div${attr("id", `activity-card-${activity.id}`)} class="svelte-s104yn">`);
            CollapsibleActivityCard($$renderer3, {
              activity,
              highlighted: highlightedActivityId === activity.id,
              changecommitment
            });
            $$renderer3.push(`<!----></div>`);
          }
          $$renderer3.push(`<!--]-->`);
        }
        $$renderer3.push(`<!--]--></div>`);
      } else {
        $$renderer3.push("<!--[-1-->");
        if (data.lifecycle.phaseOne.viewerCanAddValue) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="composer-toggle-row svelte-s104yn">`);
          RoundPlusButton($$renderer3, {
            active: showValueComposer,
            ariaLabel: "Add value proposal",
            action: () => showValueComposer = !showValueComposer
          });
          $$renderer3.push(`<!----></div> `);
          if (showValueComposer) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<div class="composer-card svelte-s104yn"><input${attr("value", draftValue)} maxlength="160" placeholder="Add a value, for example: should make use of unused space" class="svelte-s104yn"/> <div class="composer-actions svelte-s104yn"><button class="secondary-button svelte-s104yn" type="button">Cancel</button> <button class="primary-button svelte-s104yn" type="button">Add value</button></div></div>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]-->`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> <div class="surface-stack compact-stack svelte-s104yn">`);
        if (data.lifecycle.phaseOne.values.length === 0) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="empty-card svelte-s104yn">No values added yet.</div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
          $$renderer3.push(`<!--[-->`);
          const each_array_2 = ensure_array_like(data.lifecycle.phaseOne.values);
          for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
            let value = each_array_2[$$index_2];
            ProjectValueCard($$renderer3, {
              canVote: data.lifecycle.phaseOne.viewerCanVoteOnValues,
              options: importanceOptions,
              value,
              vote
            });
          }
          $$renderer3.push(`<!--]-->`);
        }
        $$renderer3.push(`<!--]--></div>`);
      }
      $$renderer3.push(`<!--]--></section>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, {
      data,
      draftValue,
      showValueComposer,
      showPersonalActivityComposer,
      serviceRequestForm,
      activityForm,
      activityComposerElement,
      activityStartInputElement,
      activityEndInputElement,
      highlightedActivityId,
      importanceOptions,
      submitValue,
      submitServiceRequest,
      updateRequestStatus,
      openPersonalActivityComposer,
      submitActivity,
      changecommitment,
      vote
    });
  });
}
function ProjectLifecyclePlanPhaseContent($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let isPhaseTwo, collectiveService, plans, canSubmitPlans, canVoteOnPlans, winningPlanId, subtypeOptions, selectedSubtype, currentRepositoryUrl;
    let data = $$props["data"];
    let phaseId = fallback($$props["phaseId"], "phase-2");
    let form = $$props["form"];
    let showComposer = fallback($$props["showComposer"], false);
    let submitLabel = fallback($$props["submitLabel"], "Submit plan");
    let addPlanPhase = fallback($$props["addPlanPhase"], () => {
    });
    let removePlanPhase = fallback($$props["removePlanPhase"], () => {
    });
    let submitPlan = fallback($$props["submitPlan"], () => {
    });
    let isExpandedPlan = fallback($$props["isExpandedPlan"], () => false);
    let valuevote = fallback($$props["valuevote"], () => {
    });
    let overallvote = fallback($$props["overallvote"], () => {
    });
    function emptyCopy() {
      if (isPhaseTwo) {
        return `No ${collectiveService ? "operations" : "production"} plans submitted yet.`;
      }
      return `No ${collectiveService ? "access" : "distribution"} plans submitted yet.`;
    }
    function descriptionPlaceholder() {
      if (isPhaseTwo) {
        return collectiveService ? "Describe the overall operating plan." : "Describe the overall production plan.";
      }
      return collectiveService ? "Describe the overall access plan." : "Describe the overall distribution plan.";
    }
    function demandPlaceholder() {
      return "Explain whether this plan meets the current demand signal. If it does not, explain the gap and why.";
    }
    function statusLabel(planId) {
      if (planId !== winningPlanId) {
        return null;
      }
      return data.lifecycle.currentPhaseId === phaseId ? "Leading above threshold" : "Selected";
    }
    isPhaseTwo = phaseId === "phase-2";
    collectiveService = isCollectiveServiceProject(data.projectMode);
    plans = isPhaseTwo ? data.lifecycle.phaseTwo.plans : data.lifecycle.phaseThree.plans;
    canSubmitPlans = isPhaseTwo ? data.lifecycle.phaseTwo.viewerCanSubmitPlans : data.lifecycle.phaseThree.viewerCanSubmitPlans;
    canVoteOnPlans = isPhaseTwo ? data.lifecycle.phaseTwo.viewerCanVoteOnPlans : data.lifecycle.phaseThree.viewerCanVoteOnPlans;
    winningPlanId = isPhaseTwo ? data.lifecycle.phaseTwo.winningPlanId : data.lifecycle.phaseThree.winningPlanId;
    subtypeOptions = projectSubtypeOptions(data.projectMode);
    selectedSubtype = form.projectSubtype ?? data.lifecycle.currentSubtype ?? "standard";
    currentRepositoryUrl = isPhaseTwo && data.lifecycle.currentSubtype === "software" ? data.lifecycle.phaseTwo.plans.find((plan) => plan.id === data.lifecycle.phaseTwo.winningPlanId)?.repositoryUrl ?? null : null;
    $$renderer2.push(`<section class="phase-surface svelte-1wtfxux">`);
    if (canSubmitPlans) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="composer-toggle-row svelte-1wtfxux">`);
      RoundPlusButton($$renderer2, {
        active: showComposer,
        ariaLabel: "Add plan",
        action: () => showComposer = !showComposer
      });
      $$renderer2.push(`<!----></div> `);
      if (showComposer) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="composer-card svelte-1wtfxux">`);
        if ((form.validationMessages?.length ?? 0) > 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="warning-card svelte-1wtfxux" role="alert"><strong class="svelte-1wtfxux">Plan could not be submitted</strong> <ul class="warning-list svelte-1wtfxux"><!--[-->`);
          const each_array = ensure_array_like(form.validationMessages ?? []);
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let message = each_array[$$index];
            $$renderer2.push(`<li>${escape_html(message)}</li>`);
          }
          $$renderer2.push(`<!--]--></ul></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> <input${attr("value", form.title)} maxlength="120" placeholder="Plan title" class="svelte-1wtfxux"/> <textarea rows="3"${attr("placeholder", descriptionPlaceholder())} class="svelte-1wtfxux">`);
        const $$body = escape_html(form.description);
        if ($$body) {
          $$renderer2.push(`${$$body}`);
        }
        $$renderer2.push(`</textarea> `);
        if (isPhaseTwo) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<label><span class="field-inline-label svelte-1wtfxux">Subtype</span> `);
          $$renderer2.select(
            { value: form.projectSubtype, class: "" },
            ($$renderer3) => {
              $$renderer3.push(`<!--[-->`);
              const each_array_1 = ensure_array_like(subtypeOptions);
              for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
                let option = each_array_1[$$index_1];
                $$renderer3.option({ disabled: option.disabled, value: option.value }, ($$renderer4) => {
                  $$renderer4.push(`${escape_html(option.label)}`);
                });
              }
              $$renderer3.push(`<!--]-->`);
            },
            "svelte-1wtfxux"
          );
          $$renderer2.push(`</label> `);
          if (selectedSubtype === "software") {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<input${attr("value", form.repositoryUrl)} maxlength="240" placeholder="Official repository URL" class="svelte-1wtfxux"/>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]-->`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> <div class="demand-context-card svelte-1wtfxux"><strong class="svelte-1wtfxux">Current demand signal</strong> <span class="svelte-1wtfxux">${escape_html(data.signalCount)} demand signals are active right now.</span> <span class="svelte-1wtfxux">State whether this plan actually meets that demand and, if not, why it still falls short.</span></div> <textarea rows="3"${attr("placeholder", demandPlaceholder())} class="svelte-1wtfxux">`);
        const $$body_1 = escape_html(form.demandConsiderationNote);
        if ($$body_1) {
          $$renderer2.push(`${$$body_1}`);
        }
        $$renderer2.push(`</textarea> <div class="step-stack svelte-1wtfxux"><!--[-->`);
        const each_array_2 = ensure_array_like(form.planPhases);
        for (let index = 0, $$length = each_array_2.length; index < $$length; index++) {
          let phase = each_array_2[index];
          $$renderer2.push(`<div class="step-card svelte-1wtfxux"><div class="step-header-row svelte-1wtfxux"><strong class="svelte-1wtfxux">Stage ${escape_html(index + 1)}</strong> `);
          if (form.planPhases.length > 1) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<button class="secondary-button svelte-1wtfxux" type="button">Remove</button>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--></div> <input${attr("value", phase.title)} maxlength="120" placeholder="Stage title" class="svelte-1wtfxux"/> <textarea rows="2" placeholder="Stage description" class="svelte-1wtfxux">`);
          const $$body_2 = escape_html(phase.details);
          if ($$body_2) {
            $$renderer2.push(`${$$body_2}`);
          }
          $$renderer2.push(`</textarea> <input${attr("value", phase.materialsLabel)} maxlength="140" placeholder="Material or resource" class="svelte-1wtfxux"/> <input${attr("value", phase.costLabel)} maxlength="80" placeholder="Stage cost" readonly="" class="blocked-field svelte-1wtfxux"/></div>`);
        }
        $$renderer2.push(`<!--]--></div> <input${attr("value", form.totalCostLabel)} maxlength="80" placeholder="Total cost" readonly="" class="blocked-field svelte-1wtfxux"/> `);
        if (!isPhaseTwo && collectiveService) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<label class="checkbox-row svelte-1wtfxux"><input${attr("checked", form.requestSystemEnabled, true)} type="checkbox" class="svelte-1wtfxux"/> <span class="svelte-1wtfxux">Allow users to request the service in Phase 5</span></label> `);
          if (form.requestSystemEnabled) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<label><span class="field-inline-label svelte-1wtfxux">Request mode</span> `);
            $$renderer2.select(
              { value: form.requestMode, class: "" },
              ($$renderer3) => {
                $$renderer3.option({ value: "calendar" }, ($$renderer4) => {
                  $$renderer4.push(`Scheduled slots only`);
                });
                $$renderer3.option({ value: "direct" }, ($$renderer4) => {
                  $$renderer4.push(`Message requests only`);
                });
                $$renderer3.option({ value: "both" }, ($$renderer4) => {
                  $$renderer4.push(`Scheduled slots and message requests`);
                });
              },
              "svelte-1wtfxux"
            );
            $$renderer2.push(`</label> <label class="checkbox-row svelte-1wtfxux"><input${attr("checked", form.allowOffScheduleRequests, true)} type="checkbox" class="svelte-1wtfxux"/> <span class="svelte-1wtfxux">Allow message requests when no slot is listed</span></label>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]-->`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> <div class="composer-actions svelte-1wtfxux"><button class="secondary-button svelte-1wtfxux" type="button">Add stage</button></div> <div class="composer-actions svelte-1wtfxux"><button class="secondary-button svelte-1wtfxux" type="button">Cancel</button> <button class="primary-button svelte-1wtfxux" type="button">${escape_html(submitLabel)}</button></div></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="surface-stack svelte-1wtfxux">`);
    if (isPhaseTwo && data.lifecycle.currentSubtypeLabel) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="subtype-card svelte-1wtfxux"><strong class="svelte-1wtfxux">Current subtype</strong> <span>${escape_html(data.lifecycle.currentSubtypeLabel)}</span> `);
      if (currentRepositoryUrl) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<a${attr("href", currentRepositoryUrl)} rel="noreferrer" target="_blank">${escape_html(currentRepositoryUrl)}</a>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (plans.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="empty-card svelte-1wtfxux">${escape_html(emptyCopy())}</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<!--[-->`);
      const each_array_3 = ensure_array_like(plans);
      for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
        let plan = each_array_3[$$index_3];
        CollapsiblePlanCard($$renderer2, {
          canVote: canVoteOnPlans,
          expanded: isExpandedPlan(plan.id),
          showRequestSystem: !isPhaseTwo && collectiveService,
          plan,
          statusLabel: statusLabel(plan.id),
          valuevote,
          overallvote
        });
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></section>`);
    bind_props($$props, {
      data,
      phaseId,
      form,
      showComposer,
      submitLabel,
      addPlanPhase,
      removePlanPhase,
      submitPlan,
      isExpandedPlan,
      valuevote,
      overallvote
    });
  });
}
function CollectiveServicePhaseTwo($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let submitLabel;
    let data = $$props["data"];
    let form = $$props["form"];
    let showComposer = fallback($$props["showComposer"], false);
    let addPlanPhase = fallback($$props["addPlanPhase"], () => {
    });
    let removePlanPhase = fallback($$props["removePlanPhase"], () => {
    });
    let submitPlan = fallback($$props["submitPlan"], () => {
    });
    let isExpandedPlan = fallback($$props["isExpandedPlan"], () => false);
    let valuevote = fallback($$props["valuevote"], () => {
    });
    let overallvote = fallback($$props["overallvote"], () => {
    });
    submitLabel = isCollectiveServiceProject(data.projectMode) ? "Submit operations plan" : "Submit production plan";
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (isPersonalServiceProject(data.projectMode)) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<section class="phase-surface svelte-2sj67h"><div class="empty-card svelte-2sj67h">This phase closes the current personal service or converts it into a collective service or productive project when the work grows beyond one person.</div></section>`);
      } else {
        $$renderer3.push("<!--[-1-->");
        ProjectLifecyclePlanPhaseContent($$renderer3, {
          data,
          phaseId: "phase-2",
          form,
          submitLabel,
          addPlanPhase,
          removePlanPhase,
          submitPlan,
          isExpandedPlan,
          valuevote,
          overallvote,
          get showComposer() {
            return showComposer;
          },
          set showComposer($$value) {
            showComposer = $$value;
            $$settled = false;
          }
        });
      }
      $$renderer3.push(`<!--]-->`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, {
      data,
      form,
      showComposer,
      addPlanPhase,
      removePlanPhase,
      submitPlan,
      isExpandedPlan,
      valuevote,
      overallvote
    });
  });
}
function CollectiveServicePhaseThree($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let submitLabel;
    let data = $$props["data"];
    let form = $$props["form"];
    let showComposer = fallback($$props["showComposer"], false);
    let addPlanPhase = fallback($$props["addPlanPhase"], () => {
    });
    let removePlanPhase = fallback($$props["removePlanPhase"], () => {
    });
    let submitPlan = fallback($$props["submitPlan"], () => {
    });
    let isExpandedPlan = fallback($$props["isExpandedPlan"], () => false);
    let valuevote = fallback($$props["valuevote"], () => {
    });
    let overallvote = fallback($$props["overallvote"], () => {
    });
    submitLabel = isCollectiveServiceProject(data.projectMode) ? "Submit access plan" : "Submit distribution plan";
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      ProjectLifecyclePlanPhaseContent($$renderer3, {
        data,
        phaseId: "phase-3",
        form,
        submitLabel,
        addPlanPhase,
        removePlanPhase,
        submitPlan,
        isExpandedPlan,
        valuevote,
        overallvote,
        get showComposer() {
          return showComposer;
        },
        set showComposer($$value) {
          showComposer = $$value;
          $$settled = false;
        }
      });
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, {
      data,
      form,
      showComposer,
      addPlanPhase,
      removePlanPhase,
      submitPlan,
      isExpandedPlan,
      valuevote,
      overallvote
    });
  });
}
function CollectiveServicePhaseFour($$renderer, $$props) {
  let phaseFour = fallback($$props["phaseFour"], null);
  $$renderer.push(`<section class="phase-surface svelte-o45wdn">`);
  if (phaseFour) {
    $$renderer.push("<!--[0-->");
    ProjectAcquisitionPreview($$renderer, { preview: phaseFour });
  } else {
    $$renderer.push("<!--[-1-->");
    $$renderer.push(`<div class="empty-card locked-card svelte-o45wdn">Acquisition preview data is not seeded for this project yet.</div>`);
  }
  $$renderer.push(`<!--]--></section>`);
  bind_props($$props, { phaseFour });
}
function CollapsibleServiceRequestCard($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let request = $$props["request"];
    let expanded = fallback($$props["expanded"], false);
    let highlighted = fallback($$props["highlighted"], false);
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
      if (!request.scheduledAt || !request.endsAt) {
        return "Requested time pending";
      }
      const start = new Date(request.scheduledAt);
      const end = new Date(request.endsAt);
      if (sameCalendarDay(start, end)) {
        return `${formatDayDate(start)}, ${formatTime(start)} - ${formatTime(end)}`;
      }
      return `${formatDayDate(start)}, ${formatTime(start)} - ${formatDayDate(end)}, ${formatTime(end)}`;
    }
    function statusLabel(status) {
      switch (status) {
        case "planned":
          return "Scheduled";
        case "accepted":
          return "Accepted";
        case "declined":
          return "Declined";
        default:
          return "Open";
      }
    }
    function statusTone(status) {
      if (status === "accepted") {
        return "complete";
      }
      if (status === "planned") {
        return "current";
      }
      if (status === "declined") {
        return "locked";
      }
      return "upcoming";
    }
    let open = expanded;
    if (expanded || highlighted) {
      open = true;
    }
    $$renderer2.push(`<details${attr("id", `request-${request.id}`)}${attr("open", open, true)}${attr_class("request-card-shell svelte-1vg4tuk", void 0, { "expanded": open, "highlighted": highlighted })}><summary class="collapse-toggle svelte-1vg4tuk"><div class="request-header svelte-1vg4tuk"><div class="request-copy svelte-1vg4tuk"><strong class="svelte-1vg4tuk">${escape_html(request.title)}</strong> <span class="svelte-1vg4tuk">${escape_html(timeLabel())}</span></div> <span${attr_class(`phase-badge ${statusTone(request.status)}`, "svelte-1vg4tuk")}>${escape_html(statusLabel(request.status))}</span></div> <div class="request-footer svelte-1vg4tuk"><span class="request-meta svelte-1vg4tuk">${escape_html(request.requesterUsername)} · ${escape_html(formatRelativeTime(request.createdAt))}</span></div></summary> `);
    if (open) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="request-body svelte-1vg4tuk"><p class="svelte-1vg4tuk">${escape_html(request.body)}</p> <!--[-->`);
      slot($$renderer2, $$props, "default", {});
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></details>`);
    bind_props($$props, { request, expanded, highlighted });
  });
}
function CollectiveServicePhaseFive($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let minimumParticipants, requestPlanningMinimumParticipants, selectedRequestActivity, sortedRequests, canCreateActivities, canSubmitRequests, hasQuickAction, calendarSelectedDayIso, calendarSelectedActivityId, actionPickerStyle, requestSettingsVotes, requestSettingsVoteCount, requestHistory, selfPlannedHistory, requestFormSubtype, requestFormCopy, calendarActivities, currentRequestSettings, draftRequestSettings, requestSettingsChanged;
    let data = $$props["data"];
    let activityForm = $$props["activityForm"];
    let serviceRequestForm = $$props["serviceRequestForm"];
    let showComposer = fallback($$props["showComposer"], false);
    let showRequestComposer = fallback($$props["showRequestComposer"], false);
    let highlightedActivityId = fallback($$props["highlightedActivityId"], null);
    let highlightedRequestId = fallback($$props["highlightedRequestId"], null);
    let selectedRequestActivityId = fallback($$props["selectedRequestActivityId"], null);
    let activityComposerElement = fallback($$props["activityComposerElement"], null);
    let serviceRequestComposerElement = fallback($$props["serviceRequestComposerElement"], null);
    let activityStartInputElement = fallback($$props["activityStartInputElement"], null);
    let activityEndInputElement = fallback($$props["activityEndInputElement"], null);
    let openComposer = fallback($$props["openComposer"], () => {
    });
    let openComposerForDay = fallback($$props["openComposerForDay"], () => {
    });
    let openRequestComposer = fallback($$props["openRequestComposer"], () => {
    });
    let openRequestComposerForDay = fallback($$props["openRequestComposerForDay"], () => {
    });
    let openRequestComposerForActivity = fallback($$props["openRequestComposerForActivity"], () => {
    });
    let closeRequestComposer = fallback($$props["closeRequestComposer"], () => {
    });
    let focusActivityCard = fallback($$props["focusActivityCard"], () => {
    });
    let planServiceRequest = fallback($$props["planServiceRequest"], () => {
    });
    let submitActivity = fallback($$props["submitActivity"], () => {
    });
    let submitServiceRequest = fallback($$props["submitServiceRequest"], () => {
    });
    let updateRequestStatus = fallback($$props["updateRequestStatus"], () => {
    });
    let changecommitment = fallback($$props["changecommitment"], () => {
    });
    let requestServiceRequestSettingsChange = fallback($$props["requestServiceRequestSettingsChange"], () => {
    });
    let voteOnRequestSettingsChange = fallback($$props["voteOnRequestSettingsChange"], () => {
    });
    let createPullRequest = fallback($$props["createPullRequest"], () => {
    });
    let requestMergeCapabilityChange = fallback($$props["requestMergeCapabilityChange"], () => {
    });
    let requestRepositoryReplacement = fallback($$props["requestRepositoryReplacement"], () => {
    });
    let recordPullRequestMerge = fallback($$props["recordPullRequestMerge"], () => {
    });
    let toggleHistoryCompletion = fallback($$props["toggleHistoryCompletion"], () => {
    });
    function createDraftActivityRole(label = "") {
      return { label, requiredCount: 1 };
    }
    function createRequestPlanningForm(request) {
      return {
        title: "",
        locationLabel: data.locationLabel,
        roleRequirements: [createDraftActivityRole("Service lead")],
        linkedPlanPhaseId: "",
        note: ""
      };
    }
    function createRequestSettingsForm() {
      const settings = data.lifecycle.requestSystem?.settings;
      return {
        enabled: settings?.enabled ?? false,
        requestMode: settings?.requestMode ?? "both",
        allowOffScheduleRequests: settings?.allowOffScheduleRequests ?? false,
        reason: ""
      };
    }
    function createSpecializedRequestForm() {
      return {
        requestUse: "project",
        itemSummary: "",
        pickupLabel: "",
        destinationLabel: "",
        description: "",
        needsDelivery: false
      };
    }
    function currentSubtype() {
      return data.lifecycle.currentSubtype ?? data.projectSubtype ?? "standard";
    }
    function requestComposerCopy(subtype) {
      switch (subtype) {
        case "land-management":
          return {
            sectionTitle: "Land management requests",
            actionLabel: "Request land management",
            composerTitle: "Create land management request",
            descriptionLabel: "Description",
            descriptionPlaceholder: "Describe the land access, site work, or land asset support needed during this time.",
            startLabel: "Requested start",
            endLabel: "Requested finish",
            submitLabel: "Create request",
            selectionHelp: "Use this form for land access, stewardship work, or land asset coordination when the inventory list is not the entry point.",
            usesAssetFields: true,
            usesDeliveryFields: false,
            itemLabel: "Land asset or site use",
            itemPlaceholder: "Which land asset or site use is this request about?"
          };
        case "storage":
          return {
            sectionTitle: "Storage requests",
            actionLabel: "Request storage",
            composerTitle: "Create storage request",
            descriptionLabel: "Description",
            descriptionPlaceholder: "Describe what needs storing, any handling constraints, and how long the storage window should last.",
            startLabel: "Requested start",
            endLabel: "Requested finish",
            submitLabel: "Create request",
            selectionHelp: "Use this form for storage coordination when the inventory list is not the entry point.",
            usesAssetFields: true,
            usesDeliveryFields: false,
            itemLabel: "Asset or storage need",
            itemPlaceholder: "What needs storing or reserving?"
          };
        case "delivery":
          return {
            sectionTitle: "Delivery requests",
            actionLabel: "Request delivery",
            composerTitle: "Create delivery request",
            descriptionLabel: "Delivery notes",
            descriptionPlaceholder: "Describe the handoff, handling needs, and who is expecting the delivery at the destination.",
            startLabel: "Pickup start",
            endLabel: "Needed by",
            submitLabel: "Create delivery request",
            selectionHelp: "Use this form to coordinate a pickup, route, and destination for the requested delivery.",
            usesAssetFields: false,
            usesDeliveryFields: true,
            itemLabel: "What needs moving",
            itemPlaceholder: "What needs moving?",
            pickupLabel: "Pickup location",
            destinationLabel: "Destination"
          };
        default:
          return {
            sectionTitle: "Requests",
            actionLabel: "Request service",
            composerTitle: "Create request",
            descriptionLabel: "Request details",
            descriptionPlaceholder: "What should happen during this requested window?",
            startLabel: "Requested start",
            endLabel: "Requested finish",
            submitLabel: "Create request",
            selectionHelp: "Use this form to request service during the selected time.",
            usesAssetFields: false,
            usesDeliveryFields: false,
            titlePlaceholder: "Request title",
            bodyPlaceholder: "What should happen during this requested window?"
          };
      }
    }
    function resolveRequestSettings(settings) {
      const enabled = settings?.enabled ?? false;
      const requestMode = settings?.requestMode ?? "both";
      return {
        enabled,
        requestMode,
        allowOffScheduleRequests: enabled && requestMode === "both" ? settings?.allowOffScheduleRequests ?? false : false
      };
    }
    function requestSettingsMatch(left, right) {
      return left.enabled === right.enabled && left.requestMode === right.requestMode && left.allowOffScheduleRequests === right.allowOffScheduleRequests;
    }
    function formatRequestedWindow(start, end) {
      if (!start || !end) {
        return "Requested time pending";
      }
      const startDate = new Date(start);
      const endDate = new Date(end);
      const dayLabel = startDate.toLocaleDateString([], { month: "short", day: "numeric" });
      const startLabel = startDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      const endLabel = endDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      return `${dayLabel} · ${startLabel} to ${endLabel}`;
    }
    function minimumParticipantsForRoles(roleRequirements) {
      return roleRequirements.reduce((total, role) => total + Math.max(1, Number(role.requiredCount) || 1), 0);
    }
    function buildActionPickerStyle(anchor, popupHeight) {
      const maxWidth = "min(320px, calc(100vw - 24px))";
      if (!anchor || typeof window === "undefined") {
        return `left: 12px; top: 12px; width: ${maxWidth}; transform: none;`;
      }
      const popupWidth = Math.min(320, Math.max(220, window.innerWidth - 24));
      const left = Math.max(12, Math.min(anchor.clientX + 14, window.innerWidth - popupWidth - 12));
      const top = Math.max(12, Math.min(anchor.clientY + 14, window.innerHeight - popupHeight - 12));
      return `left: ${left}px; top: ${top}px; width: ${maxWidth}; transform: none;`;
    }
    function historyItemByActivityId(activityId) {
      return data.lifecycle.phaseFive.history.find((item) => item.activity.id === activityId) ?? null;
    }
    function scrollHistoryCardIntoView(historyId) {
      if (typeof document === "undefined") {
        return;
      }
      document.getElementById(`history-card-${historyId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    async function focusHistoryCard(historyId) {
      if (historyHighlightResetHandle) {
        clearTimeout(historyHighlightResetHandle);
      }
      highlightedHistoryId = historyId;
      await tick();
      scrollHistoryCardIntoView(historyId);
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            scrollHistoryCardIntoView(historyId);
          });
        });
      }
      historyHighlightResetHandle = setTimeout(
        () => {
          if (highlightedHistoryId === historyId) {
            highlightedHistoryId = null;
          }
          historyHighlightResetHandle = null;
        },
        1800
      );
    }
    function closeComposer() {
      showComposer = false;
    }
    function closeCalendarActionTarget() {
      calendarActionTarget = null;
      calendarActionAnchor = null;
    }
    async function openQuickActions(anchor) {
      planningRequestId = null;
      if (calendarActionTarget?.kind === "general") {
        closeCalendarActionTarget();
        return;
      }
      if (showComposer) {
        closeComposer();
      }
      if (showRequestComposer) {
        await closeRequestComposer();
      }
      if (canCreateActivities && canSubmitRequests) {
        calendarActionAnchor = anchor ?? null;
        calendarActionTarget = { kind: "general" };
        return;
      }
      if (canCreateActivities) {
        activeTab = "live";
        await openComposer();
        return;
      }
      if (canSubmitRequests) {
        activeTab = "live";
        await openRequestComposer();
      }
    }
    async function handleDaySelection(isoDay, anchor) {
      if (calendarActionTarget?.kind === "day" && calendarActionTarget.isoDay === isoDay) {
        closeCalendarActionTarget();
        return;
      }
      if (showRequestComposer) {
        activeTab = "live";
        closeCalendarActionTarget();
        await openRequestComposerForDay(isoDay);
        return;
      }
      if (showComposer) {
        activeTab = "live";
        closeCalendarActionTarget();
        await openComposerForDay(isoDay);
        return;
      }
      if (canCreateActivities && canSubmitRequests) {
        calendarActionAnchor = anchor ?? null;
        calendarActionTarget = { kind: "day", isoDay };
        return;
      }
      if (canSubmitRequests) {
        activeTab = "live";
        closeCalendarActionTarget();
        await openRequestComposerForDay(isoDay);
        return;
      }
      if (canCreateActivities) {
        activeTab = "live";
        closeCalendarActionTarget();
        await openComposerForDay(isoDay);
      }
    }
    async function handleActivitySelection(activityId, anchor) {
      const historyItem = historyItemByActivityId(activityId);
      if (historyItem && historyItem.historyState !== "request-only") {
        activeTab = "history";
        closeCalendarActionTarget();
        await focusHistoryCard(historyItem.id);
        return;
      }
      if (showRequestComposer) {
        activeTab = "live";
        closeCalendarActionTarget();
        await openRequestComposerForActivity(activityId);
        return;
      }
      if (canSubmitRequests) {
        calendarActionAnchor = anchor ?? null;
        calendarActionTarget = { kind: "activity", activityId };
        return;
      }
      closeCalendarActionTarget();
      await focusActivityCard(activityId);
    }
    let activeTab = "live";
    let calendarActionTarget = null;
    let calendarActionAnchor = null;
    let highlightedHistoryId = null;
    let historyHighlightResetHandle = null;
    let planningRequestId = null;
    let requestPlanningForm = createRequestPlanningForm();
    let showRequestSettingsComposer = false;
    let showRequestSettingsVote = false;
    let requestSettingsForm = createRequestSettingsForm();
    let specializedRequestForm = createSpecializedRequestForm();
    minimumParticipants = minimumParticipantsForRoles(activityForm.roleRequirements);
    requestPlanningMinimumParticipants = minimumParticipantsForRoles(requestPlanningForm.roleRequirements);
    selectedRequestActivity = data.lifecycle.phaseFive.activities.find((activity) => activity.id === selectedRequestActivityId) ?? null;
    sortedRequests = [...data.lifecycle.requestSystem?.requests ?? []].sort((left, right) => +new Date(right.createdAt) - +new Date(left.createdAt));
    canCreateActivities = data.lifecycle.phaseFive.viewerCanCreateActivities;
    canSubmitRequests = data.lifecycle.requestSystem?.viewerCanSubmitRequests ?? false;
    hasQuickAction = canCreateActivities || canSubmitRequests;
    calendarSelectedDayIso = showRequestComposer ? serviceRequestForm.scheduledAt : activityForm.scheduledAt;
    calendarSelectedActivityId = selectedRequestActivityId ?? (calendarActionTarget?.kind === "activity" ? calendarActionTarget.activityId : "");
    actionPickerStyle = buildActionPickerStyle(calendarActionAnchor, 260);
    requestSettingsVotes = data.lifecycle.requestSystem?.settingsChangeRequests ?? [];
    requestSettingsVoteCount = requestSettingsVotes.length;
    requestHistory = data.lifecycle.phaseFive.history.filter((item) => item.source === "request");
    selfPlannedHistory = data.lifecycle.phaseFive.history.filter((item) => item.source === "self-planned");
    requestFormSubtype = currentSubtype();
    requestFormCopy = requestComposerCopy(requestFormSubtype);
    calendarActivities = [
      ...data.lifecycle.phaseFive.activities,
      ...data.lifecycle.phaseFive.history.filter((item) => item.historyState !== "request-only" && item.activity.statusTone === "green").map((item) => item.activity)
    ];
    currentRequestSettings = resolveRequestSettings(data.lifecycle.requestSystem?.settings);
    {
      requestSettingsForm = createRequestSettingsForm();
    }
    draftRequestSettings = resolveRequestSettings(requestSettingsForm);
    requestSettingsChanged = !requestSettingsMatch(currentRequestSettings, draftRequestSettings);
    requestSettingsChanged && requestSettingsForm.reason.trim().length > 0;
    if (!showRequestComposer) {
      specializedRequestForm = createSpecializedRequestForm();
    }
    if (requestSettingsVoteCount === 0) {
      showRequestSettingsVote = false;
    }
    if (highlightedActivityId || highlightedRequestId) {
      activeTab = "live";
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<section class="phase-surface svelte-162ynbv">`);
      ProjectSoftwareGovernancePanel($$renderer3, {
        governance: data.lifecycle.phaseFive.softwareGovernance,
        createPullRequest,
        requestMergeCapabilityChange,
        requestRepositoryReplacement,
        recordMerge: recordPullRequestMerge
      });
      $$renderer3.push(`<!----> `);
      if (calendarActionTarget) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<div class="mechanics-card action-picker-card svelte-162ynbv"${attr_style(actionPickerStyle)}><div class="request-header-row svelte-162ynbv"><div><h3 class="svelte-162ynbv">`);
        if (calendarActionTarget.kind === "general") {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`Choose next step`);
        } else if (calendarActionTarget.kind === "day") {
          $$renderer3.push("<!--[1-->");
          $$renderer3.push(`Choose action for ${escape_html(calendarActionTarget.isoDay)}`);
        } else {
          $$renderer3.push("<!--[-1-->");
          $$renderer3.push(`Choose action for this slot`);
        }
        $$renderer3.push(`<!--]--></h3> <p class="svelte-162ynbv">`);
        if (calendarActionTarget.kind === "general") {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`Start a new scheduled activity or open a new ${escape_html(requestFormCopy.actionLabel.toLowerCase())} form.`);
        } else if (calendarActionTarget.kind === "activity") {
          $$renderer3.push("<!--[1-->");
          $$renderer3.push(`Open the scheduled activity to sign up, or use its time window to place a ${escape_html(requestFormCopy.actionLabel.toLowerCase())} request.`);
        } else {
          $$renderer3.push("<!--[-1-->");
          $$renderer3.push(`Choose whether this time should become a new activity or a ${escape_html(requestFormCopy.actionLabel.toLowerCase())} request.`);
        }
        $$renderer3.push(`<!--]--></p></div></div> <div class="action-picker-grid svelte-162ynbv">`);
        if (calendarActionTarget.kind === "general" || calendarActionTarget.kind === "day") {
          $$renderer3.push("<!--[0-->");
          if (canCreateActivities) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<button class="action-choice svelte-162ynbv" type="button"><strong class="svelte-162ynbv">Create activity</strong> <span class="svelte-162ynbv">${escape_html(calendarActionTarget.kind === "day" ? "Open the activity planner with this day prefilled." : "Open the activity planner.")}</span></button>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--> `);
          if (canSubmitRequests) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<button class="action-choice svelte-162ynbv" type="button"><strong class="svelte-162ynbv">${escape_html(requestFormCopy.actionLabel)}</strong> <span class="svelte-162ynbv">${escape_html(calendarActionTarget.kind === "day" ? "Open the request form and prefill the selected time." : "Open the request form.")}</span></button>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]-->`);
        } else {
          $$renderer3.push("<!--[-1-->");
          $$renderer3.push(`<button class="action-choice svelte-162ynbv" type="button"><strong class="svelte-162ynbv">Open activity / sign up</strong> <span class="svelte-162ynbv">Jump to the scheduled activity below the calendar and choose a role.</span></button> `);
          if (canSubmitRequests) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<button class="action-choice svelte-162ynbv" type="button"><strong class="svelte-162ynbv">${escape_html(requestFormCopy.actionLabel)}</strong> <span class="svelte-162ynbv">Use this slot's window as the request time.</span></button>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]-->`);
        }
        $$renderer3.push(`<!--]--></div> <div class="action-picker-actions svelte-162ynbv"><button class="secondary-button svelte-162ynbv" type="button">Close</button></div></div>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> `);
      ProjectActivityCalendarCard($$renderer3, {
        activities: calendarActivities,
        canCreate: hasQuickAction,
        createActive: showComposer || showRequestComposer || calendarActionTarget?.kind === "general",
        createAriaLabel: "Open activity or request actions",
        selectedDayIso: calendarSelectedDayIso,
        selectedActivityId: calendarSelectedActivityId,
        daySelect: handleDaySelection,
        createAction: openQuickActions,
        activitySelect: handleActivitySelection
      });
      $$renderer3.push(`<!----> `);
      ProjectActivityViewTabs($$renderer3, {
        ariaLabel: "Service activity view",
        get activeTab() {
          return activeTab;
        },
        set activeTab($$value) {
          activeTab = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> `);
      if (activeTab === "live") {
        $$renderer3.push("<!--[0-->");
        if (data.lifecycle.requestSystem) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<section class="card-rail-section svelte-162ynbv"><div class="section-head svelte-162ynbv"><div class="section-copy svelte-162ynbv"><h3 class="svelte-162ynbv">${escape_html(requestFormCopy.sectionTitle)}</h3> <p class="svelte-162ynbv">${escape_html(data.lifecycle.requestSystem.settings.summary)}</p></div> <div class="section-actions svelte-162ynbv">`);
          if (requestSettingsVoteCount > 0) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<button class="vote-chip notice-chip svelte-162ynbv" type="button">Vote Active `);
            CountBadge($$renderer3, { count: requestSettingsVoteCount });
            $$renderer3.push(`<!----></button>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--> `);
          if (data.lifecycle.requestSystem.viewerCanRequestSettingsChanges) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<button${attr_class("secondary-button svelte-162ynbv", void 0, { "active-toggle": showRequestSettingsComposer })} type="button">Edit request settings</button>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--></div></div> `);
          if (requestSettingsVoteCount > 0 && showRequestSettingsVote) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<div class="composer-card settings-panel svelte-162ynbv"><div class="request-header-row svelte-162ynbv"><div><h3 class="svelte-162ynbv">Active request settings votes</h3> <p class="svelte-162ynbv">`);
            if (requestSettingsVoteCount === 1) {
              $$renderer3.push("<!--[0-->");
              $$renderer3.push(`One settings change vote is open right now.`);
            } else {
              $$renderer3.push("<!--[-1-->");
              $$renderer3.push(`${escape_html(requestSettingsVoteCount)} settings change votes are open right now.`);
            }
            $$renderer3.push(`<!--]--></p></div></div> <div class="surface-stack svelte-162ynbv"><!--[-->`);
            const each_array = ensure_array_like(requestSettingsVotes);
            for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
              let requestSettingsVote = each_array[$$index];
              $$renderer3.push(`<article class="vote-request-card svelte-162ynbv"><div class="vote-card-top svelte-162ynbv"><div class="vote-card-copy svelte-162ynbv"><span class="vote-kicker svelte-162ynbv">Settings change</span> <strong class="svelte-162ynbv">${escape_html(requestSettingsVote.proposedSettings.summary)}</strong></div> <span class="vote-requirement svelte-162ynbv">${escape_html(formatProjectVoteRequirement(requestSettingsVote.voteSummary, requestSettingsVote.approvalThresholdPercent))}</span></div> <p class="svelte-162ynbv">${escape_html(requestSettingsVote.reason)}</p> <div class="vote-summary-row svelte-162ynbv"><span class="svelte-162ynbv">${escape_html(formatProjectVoteSummary(requestSettingsVote.voteSummary))}</span></div> `);
              VoteCardFooter($$renderer3, {
                authorUsername: requestSettingsVote.authorUsername,
                createdAt: requestSettingsVote.createdAt,
                activeVote: requestSettingsVote.voteSummary.activeVote,
                canVote: data.lifecycle.requestSystem.viewerCanVoteOnSettingsChanges,
                onVote: (vote) => voteOnRequestSettingsChange(requestSettingsVote.id, vote)
              });
              $$renderer3.push(`<!----></article>`);
            }
            $$renderer3.push(`<!--]--></div></div>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--> `);
          {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--> `);
          if (canSubmitRequests && showRequestComposer) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<div class="composer-card svelte-162ynbv">`);
            if (selectedRequestActivity) {
              $$renderer3.push("<!--[0-->");
              $$renderer3.push(`<div class="selection-note svelte-162ynbv"><strong class="svelte-162ynbv">${escape_html(selectedRequestActivity.title)}</strong> <span class="svelte-162ynbv">${escape_html(formatRequestedWindow(selectedRequestActivity.startAt, selectedRequestActivity.endAt))}</span></div>`);
            } else {
              $$renderer3.push("<!--[-1-->");
            }
            $$renderer3.push(`<!--]--> <div class="request-header-row svelte-162ynbv"><div><h3 class="svelte-162ynbv">${escape_html(requestFormCopy.composerTitle)}</h3> <p class="svelte-162ynbv">${escape_html(requestFormCopy.selectionHelp)}</p></div></div> <div class="number-grid svelte-162ynbv"><label><span class="field-inline-label svelte-162ynbv">${escape_html(requestFormCopy.startLabel)}</span> <input${attr("value", serviceRequestForm.scheduledAt)} type="datetime-local" class="svelte-162ynbv"/></label> <label><span class="field-inline-label svelte-162ynbv">${escape_html(requestFormCopy.endLabel)}</span> <input${attr("value", serviceRequestForm.endsAt)} type="datetime-local" class="svelte-162ynbv"/></label></div> `);
            if (requestFormCopy.usesDeliveryFields) {
              $$renderer3.push("<!--[0-->");
              $$renderer3.push(`<div class="number-grid svelte-162ynbv"><label><span class="field-inline-label svelte-162ynbv">${escape_html(requestFormCopy.pickupLabel)}</span> <input${attr("value", specializedRequestForm.pickupLabel)} maxlength="120" placeholder="Where should pickup happen?" class="svelte-162ynbv"/></label> <label><span class="field-inline-label svelte-162ynbv">${escape_html(requestFormCopy.destinationLabel)}</span> <input${attr("value", specializedRequestForm.destinationLabel)} maxlength="120" placeholder="Where should it go?" class="svelte-162ynbv"/></label></div> <label><span class="field-inline-label svelte-162ynbv">${escape_html(requestFormCopy.itemLabel)}</span> <input${attr("value", specializedRequestForm.itemSummary)} maxlength="160"${attr("placeholder", requestFormCopy.itemPlaceholder)} class="svelte-162ynbv"/></label> <label><span class="field-inline-label svelte-162ynbv">${escape_html(requestFormCopy.descriptionLabel)}</span> <textarea rows="3"${attr("placeholder", requestFormCopy.descriptionPlaceholder)} class="svelte-162ynbv">`);
              const $$body_1 = escape_html(specializedRequestForm.description);
              if ($$body_1) {
                $$renderer3.push(`${$$body_1}`);
              }
              $$renderer3.push(`</textarea></label>`);
            } else if (requestFormCopy.usesAssetFields) {
              $$renderer3.push("<!--[1-->");
              $$renderer3.push(`<label><span class="field-inline-label svelte-162ynbv">Use type</span> `);
              $$renderer3.select(
                { value: specializedRequestForm.requestUse, class: "" },
                ($$renderer4) => {
                  $$renderer4.option({ value: "project" }, ($$renderer5) => {
                    $$renderer5.push(`Project use`);
                  });
                  $$renderer4.option({ value: "individual" }, ($$renderer5) => {
                    $$renderer5.push(`Individual use`);
                  });
                },
                "svelte-162ynbv"
              );
              $$renderer3.push(`</label> <label><span class="field-inline-label svelte-162ynbv">${escape_html(requestFormCopy.itemLabel)}</span> <input${attr("value", specializedRequestForm.itemSummary)} maxlength="160"${attr("placeholder", requestFormCopy.itemPlaceholder)} class="svelte-162ynbv"/></label> <label class="checkbox-row svelte-162ynbv"><input${attr("checked", specializedRequestForm.needsDelivery, true)} type="checkbox" class="svelte-162ynbv"/> <span class="svelte-162ynbv">I will need delivery</span></label> <label><span class="field-inline-label svelte-162ynbv">${escape_html(requestFormCopy.descriptionLabel)}</span> <textarea rows="3"${attr("placeholder", requestFormCopy.descriptionPlaceholder)} class="svelte-162ynbv">`);
              const $$body_2 = escape_html(specializedRequestForm.description);
              if ($$body_2) {
                $$renderer3.push(`${$$body_2}`);
              }
              $$renderer3.push(`</textarea></label>`);
            } else {
              $$renderer3.push("<!--[-1-->");
              $$renderer3.push(`<input${attr("value", serviceRequestForm.title)} maxlength="120"${attr("placeholder", requestFormCopy.titlePlaceholder)} class="svelte-162ynbv"/> <textarea rows="3"${attr("placeholder", requestFormCopy.bodyPlaceholder)} class="svelte-162ynbv">`);
              const $$body_3 = escape_html(serviceRequestForm.body);
              if ($$body_3) {
                $$renderer3.push(`${$$body_3}`);
              }
              $$renderer3.push(`</textarea>`);
            }
            $$renderer3.push(`<!--]--> <div class="composer-actions svelte-162ynbv"><button class="secondary-button svelte-162ynbv" type="button">Cancel</button> <button class="primary-button svelte-162ynbv" type="button">${escape_html(requestFormCopy.submitLabel)}</button></div></div>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--> `);
          if (!data.lifecycle.requestSystem.enabled && sortedRequests.length === 0) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<div class="empty-card svelte-162ynbv">Requests are currently turned off.</div>`);
          } else if (sortedRequests.length === 0) {
            $$renderer3.push("<!--[1-->");
            $$renderer3.push(`<div class="empty-card svelte-162ynbv">No open requests right now.</div>`);
          } else {
            $$renderer3.push("<!--[-1-->");
            $$renderer3.push(`<div class="card-rail svelte-162ynbv"><!--[-->`);
            const each_array_1 = ensure_array_like(sortedRequests);
            for (let $$index_2 = 0, $$length = each_array_1.length; $$index_2 < $$length; $$index_2++) {
              let request = each_array_1[$$index_2];
              $$renderer3.push(`<div${attr("id", `request-card-${request.id}`)} class="rail-card svelte-162ynbv">`);
              CollapsibleServiceRequestCard($$renderer3, {
                request,
                expanded: planningRequestId === request.id || highlightedRequestId === request.id,
                highlighted: highlightedRequestId === request.id,
                children: ($$renderer4) => {
                  if (data.lifecycle.requestSystem.viewerCanReviewRequests && request.status === "open") {
                    $$renderer4.push("<!--[0-->");
                    $$renderer4.push(`<div class="composer-actions review-actions svelte-162ynbv"><button class="vote-chip svelte-162ynbv" type="button">Plan request</button> <button class="vote-chip negative svelte-162ynbv" type="button">Decline</button></div>`);
                  } else {
                    $$renderer4.push("<!--[-1-->");
                  }
                  $$renderer4.push(`<!--]--> `);
                  if (planningRequestId === request.id) {
                    $$renderer4.push("<!--[0-->");
                    $$renderer4.push(`<div class="composer-card planner-card svelte-162ynbv"><input${attr("value", requestPlanningForm.title)} maxlength="120" placeholder="Scheduled activity title" class="svelte-162ynbv"/> <input${attr("value", requestPlanningForm.locationLabel)} maxlength="120" placeholder="Place" class="svelte-162ynbv"/> `);
                    $$renderer4.select(
                      { value: requestPlanningForm.linkedPlanPhaseId, class: "" },
                      ($$renderer5) => {
                        $$renderer5.option({ value: "", disabled: true }, ($$renderer6) => {
                          $$renderer6.push(`Choose stage`);
                        });
                        $$renderer5.push(`<!--[-->`);
                        const each_array_2 = ensure_array_like(data.lifecycle.phaseFive.selectablePlanPhases);
                        for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
                          let stage = each_array_2[$$index_1];
                          $$renderer5.option({ value: stage.id }, ($$renderer6) => {
                            $$renderer6.push(`${escape_html(stage.label)}`);
                          });
                        }
                        $$renderer5.push(`<!--]-->`);
                      },
                      "svelte-162ynbv"
                    );
                    $$renderer4.push(` `);
                    ProjectActivityRolesEditor($$renderer4, {
                      get roles() {
                        return requestPlanningForm.roleRequirements;
                      },
                      set roles($$value) {
                        requestPlanningForm.roleRequirements = $$value;
                        $$settled = false;
                      }
                    });
                    $$renderer4.push(`<!----> <div class="count-field svelte-162ynbv"><span class="count-field-label svelte-162ynbv"><span class="field-inline-label svelte-162ynbv">Minimum people:</span> <span class="count-note svelte-162ynbv">Calculated from the role minimums above.</span></span> <div class="count-readout svelte-162ynbv"><strong class="svelte-162ynbv">${escape_html(requestPlanningMinimumParticipants)}</strong></div></div> <textarea rows="3" placeholder="How should this request be carried out?" class="svelte-162ynbv">`);
                    const $$body_4 = escape_html(requestPlanningForm.note);
                    if ($$body_4) {
                      $$renderer4.push(`${$$body_4}`);
                    }
                    $$renderer4.push(`</textarea> <div class="composer-actions svelte-162ynbv"><button class="secondary-button svelte-162ynbv" type="button">Cancel</button> <button class="primary-button svelte-162ynbv" type="button">Schedule activity</button></div></div>`);
                  } else {
                    $$renderer4.push("<!--[-1-->");
                  }
                  $$renderer4.push(`<!--]-->`);
                },
                $$slots: { default: true }
              });
              $$renderer3.push(`<!----></div>`);
            }
            $$renderer3.push(`<!--]--></div>`);
          }
          $$renderer3.push(`<!--]--></section>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> <section class="card-rail-section svelte-162ynbv"><div class="section-head svelte-162ynbv"><div class="section-copy svelte-162ynbv"><h3 class="svelte-162ynbv">Activity</h3> <p class="svelte-162ynbv">${escape_html(data.lifecycle.phaseFive.activities.length)} future activity card${escape_html(data.lifecycle.phaseFive.activities.length === 1 ? "" : "s")}</p></div></div> `);
        if (canCreateActivities && showComposer) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="composer-card svelte-162ynbv"><input${attr("value", activityForm.title)} maxlength="120" placeholder="Activity title" class="svelte-162ynbv"/> <div class="number-grid svelte-162ynbv"><label><span class="field-inline-label svelte-162ynbv">Start time</span> <input${attr("value", activityForm.scheduledAt)} type="datetime-local" class="svelte-162ynbv"/></label> <label><span class="field-inline-label svelte-162ynbv">Finish time</span> <input${attr("value", activityForm.endsAt)} type="datetime-local" class="svelte-162ynbv"/></label></div> <input${attr("value", activityForm.locationLabel)} maxlength="120" placeholder="Place" class="svelte-162ynbv"/> `);
          $$renderer3.select(
            { value: activityForm.linkedPlanPhaseId, class: "" },
            ($$renderer4) => {
              $$renderer4.option({ value: "", disabled: true }, ($$renderer5) => {
                $$renderer5.push(`Choose stage`);
              });
              $$renderer4.push(`<!--[-->`);
              const each_array_3 = ensure_array_like(data.lifecycle.phaseFive.selectablePlanPhases);
              for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
                let stage = each_array_3[$$index_3];
                $$renderer4.option({ value: stage.id }, ($$renderer5) => {
                  $$renderer5.push(`${escape_html(stage.label)}`);
                });
              }
              $$renderer4.push(`<!--]-->`);
            },
            "svelte-162ynbv"
          );
          $$renderer3.push(` `);
          ProjectActivityRolesEditor($$renderer3, {
            get roles() {
              return activityForm.roleRequirements;
            },
            set roles($$value) {
              activityForm.roleRequirements = $$value;
              $$settled = false;
            }
          });
          $$renderer3.push(`<!----> <div class="count-field svelte-162ynbv"><span class="count-field-label svelte-162ynbv"><span class="field-inline-label svelte-162ynbv">Minimum people:</span> <span class="count-note svelte-162ynbv">Calculated from the role minimums above. Leave a role max blank if it has no cap.</span></span> <div class="count-readout svelte-162ynbv"><strong class="svelte-162ynbv">${escape_html(minimumParticipants)}</strong></div></div> <textarea rows="3" placeholder="What should happen in this activity?" class="svelte-162ynbv">`);
          const $$body_5 = escape_html(activityForm.note);
          if ($$body_5) {
            $$renderer3.push(`${$$body_5}`);
          }
          $$renderer3.push(`</textarea> <div class="composer-actions svelte-162ynbv"><button class="secondary-button svelte-162ynbv" type="button">Cancel</button> <button class="primary-button svelte-162ynbv" type="button">Create activity</button></div></div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (data.lifecycle.phaseFive.activities.length === 0) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="empty-card svelte-162ynbv">No future activity scheduled yet.</div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
          $$renderer3.push(`<div class="card-rail svelte-162ynbv"><!--[-->`);
          const each_array_4 = ensure_array_like(data.lifecycle.phaseFive.activities);
          for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
            let activity = each_array_4[$$index_4];
            $$renderer3.push(`<div${attr("id", `activity-card-${activity.id}`)} class="rail-card svelte-162ynbv">`);
            CollapsibleActivityCard($$renderer3, {
              activity,
              expanded: highlightedActivityId === activity.id,
              highlighted: highlightedActivityId === activity.id,
              changecommitment
            });
            $$renderer3.push(`<!----></div>`);
          }
          $$renderer3.push(`<!--]--></div>`);
        }
        $$renderer3.push(`<!--]--></section>`);
      } else {
        $$renderer3.push("<!--[-1-->");
        $$renderer3.push(`<div class="history-stack svelte-162ynbv">`);
        ProjectActivityHistorySection($$renderer3, {
          title: "Request history",
          description: "Requests that moved into past activity.",
          items: requestHistory,
          emptyMessage: "No request-based activity has moved into history yet.",
          highlightedHistoryId,
          toggleHistoryCompletion
        });
        $$renderer3.push(`<!----> `);
        ProjectActivityHistorySection($$renderer3, {
          title: "Self planned history",
          description: "Past activity the collective created directly.",
          items: selfPlannedHistory,
          emptyMessage: "No self-planned activity has moved into history yet.",
          highlightedHistoryId,
          toggleHistoryCompletion
        });
        $$renderer3.push(`<!----></div>`);
      }
      $$renderer3.push(`<!--]--></section>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, {
      data,
      activityForm,
      serviceRequestForm,
      showComposer,
      showRequestComposer,
      highlightedActivityId,
      highlightedRequestId,
      selectedRequestActivityId,
      activityComposerElement,
      serviceRequestComposerElement,
      activityStartInputElement,
      activityEndInputElement,
      openComposer,
      openComposerForDay,
      openRequestComposer,
      openRequestComposerForDay,
      openRequestComposerForActivity,
      closeRequestComposer,
      focusActivityCard,
      planServiceRequest,
      submitActivity,
      submitServiceRequest,
      updateRequestStatus,
      changecommitment,
      requestServiceRequestSettingsChange,
      voteOnRequestSettingsChange,
      createPullRequest,
      requestMergeCapabilityChange,
      requestRepositoryReplacement,
      recordPullRequestMerge,
      toggleHistoryCompletion
    });
  });
}
function CollectiveServicePhaseSix($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let projectMode = $$props["projectMode"];
    function completionCopy() {
      if (isPersonalServiceProject(projectMode)) {
        return "This phase records the service as closed, while still leaving room to point people toward a future collective service or productive project if the work grows beyond one person.";
      }
      if (isCollectiveServiceProject(projectMode)) {
        return "This phase closes the service while keeping its history visible. If related work continues later, it should either move back into planning or link to a new project.";
      }
      return "This phase records the project as closed or converted into an ongoing service. The history above stays visible either way.";
    }
    $$renderer2.push(`<section class="phase-surface svelte-15b3zaf"><div class="empty-card svelte-15b3zaf">${escape_html(completionCopy())}</div></section>`);
    bind_props($$props, { projectMode });
  });
}
function CollectiveServiceLifecycleContent($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    let activePhaseId = $$props["activePhaseId"];
    let importanceOptions = fallback($$props["importanceOptions"], () => [], true);
    let draftValue = fallback($$props["draftValue"], "");
    let showPhaseOneComposer = fallback($$props["showPhaseOneComposer"], false);
    let showPhaseTwoComposer = fallback($$props["showPhaseTwoComposer"], false);
    let showPhaseThreeComposer = fallback($$props["showPhaseThreeComposer"], false);
    let showPhaseFiveComposer = fallback($$props["showPhaseFiveComposer"], false);
    let showRequestComposer = fallback($$props["showRequestComposer"], false);
    let productionForm = $$props["productionForm"];
    let distributionForm = $$props["distributionForm"];
    let activityForm = $$props["activityForm"];
    let serviceRequestForm = $$props["serviceRequestForm"];
    let highlightedActivityId = fallback($$props["highlightedActivityId"], null);
    let highlightedRequestId = fallback($$props["highlightedRequestId"], null);
    let selectedRequestActivityId = fallback($$props["selectedRequestActivityId"], null);
    let activityComposerElement = fallback($$props["activityComposerElement"], null);
    let serviceRequestComposerElement = fallback($$props["serviceRequestComposerElement"], null);
    let activityStartInputElement = fallback($$props["activityStartInputElement"], null);
    let activityEndInputElement = fallback($$props["activityEndInputElement"], null);
    let submitValue = fallback($$props["submitValue"], () => {
    });
    let setProjectValueVote = fallback($$props["setProjectValueVote"], () => {
    });
    let addProductionPlanPhase = fallback($$props["addProductionPlanPhase"], () => {
    });
    let removeProductionPlanPhase = fallback($$props["removeProductionPlanPhase"], () => {
    });
    let submitProductionPlan = fallback($$props["submitProductionPlan"], () => {
    });
    let setPhaseTwoPlanValueVote = fallback($$props["setPhaseTwoPlanValueVote"], () => {
    });
    let setPhaseTwoPlanOverallVote = fallback($$props["setPhaseTwoPlanOverallVote"], () => {
    });
    let addDistributionPlanPhase = fallback($$props["addDistributionPlanPhase"], () => {
    });
    let removeDistributionPlanPhase = fallback($$props["removeDistributionPlanPhase"], () => {
    });
    let submitDistributionPlan = fallback($$props["submitDistributionPlan"], () => {
    });
    let setPhaseThreePlanValueVote = fallback($$props["setPhaseThreePlanValueVote"], () => {
    });
    let setPhaseThreePlanOverallVote = fallback($$props["setPhaseThreePlanOverallVote"], () => {
    });
    let isExpandedPlan = fallback($$props["isExpandedPlan"], () => false);
    let openActivityComposer = fallback($$props["openActivityComposer"], () => {
    });
    let openActivityComposerForDay = fallback($$props["openActivityComposerForDay"], () => {
    });
    let openRequestComposer = fallback($$props["openRequestComposer"], () => {
    });
    let openRequestComposerForDay = fallback($$props["openRequestComposerForDay"], () => {
    });
    let openRequestComposerForActivity = fallback($$props["openRequestComposerForActivity"], () => {
    });
    let closeRequestComposer = fallback($$props["closeRequestComposer"], () => {
    });
    let focusActivityCard = fallback($$props["focusActivityCard"], () => {
    });
    let planServiceRequest = fallback($$props["planServiceRequest"], () => {
    });
    let submitActivity = fallback($$props["submitActivity"], () => {
    });
    let submitServiceRequest = fallback($$props["submitServiceRequest"], () => {
    });
    let updateRequestStatus = fallback($$props["updateRequestStatus"], () => {
    });
    let updateActivityCommitment = fallback($$props["updateActivityCommitment"], () => {
    });
    let requestServiceRequestSettingsChange = fallback($$props["requestServiceRequestSettingsChange"], () => {
    });
    let voteOnRequestSettingsChange = fallback($$props["voteOnRequestSettingsChange"], () => {
    });
    let createPullRequest = fallback($$props["createPullRequest"], () => {
    });
    let requestMergeCapabilityChange = fallback($$props["requestMergeCapabilityChange"], () => {
    });
    let requestRepositoryReplacement = fallback($$props["requestRepositoryReplacement"], () => {
    });
    let recordPullRequestMerge = fallback($$props["recordPullRequestMerge"], () => {
    });
    let toggleHistoryCompletion = fallback($$props["toggleHistoryCompletion"], () => {
    });
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (activePhaseId === "phase-1") {
        $$renderer3.push("<!--[0-->");
        CollectiveServicePhaseOne($$renderer3, {
          data,
          importanceOptions,
          submitValue,
          vote: setProjectValueVote,
          get draftValue() {
            return draftValue;
          },
          set draftValue($$value) {
            draftValue = $$value;
            $$settled = false;
          },
          get showValueComposer() {
            return showPhaseOneComposer;
          },
          set showValueComposer($$value) {
            showPhaseOneComposer = $$value;
            $$settled = false;
          }
        });
      } else if (activePhaseId === "phase-2") {
        $$renderer3.push("<!--[1-->");
        CollectiveServicePhaseTwo($$renderer3, {
          data,
          form: productionForm,
          addPlanPhase: addProductionPlanPhase,
          removePlanPhase: removeProductionPlanPhase,
          submitPlan: submitProductionPlan,
          isExpandedPlan: (planId) => isExpandedPlan("phase-2", planId),
          valuevote: setPhaseTwoPlanValueVote,
          overallvote: setPhaseTwoPlanOverallVote,
          get showComposer() {
            return showPhaseTwoComposer;
          },
          set showComposer($$value) {
            showPhaseTwoComposer = $$value;
            $$settled = false;
          }
        });
      } else if (activePhaseId === "phase-3") {
        $$renderer3.push("<!--[2-->");
        CollectiveServicePhaseThree($$renderer3, {
          data,
          form: distributionForm,
          addPlanPhase: addDistributionPlanPhase,
          removePlanPhase: removeDistributionPlanPhase,
          submitPlan: submitDistributionPlan,
          isExpandedPlan: (planId) => isExpandedPlan("phase-3", planId),
          valuevote: setPhaseThreePlanValueVote,
          overallvote: setPhaseThreePlanOverallVote,
          get showComposer() {
            return showPhaseThreeComposer;
          },
          set showComposer($$value) {
            showPhaseThreeComposer = $$value;
            $$settled = false;
          }
        });
      } else if (activePhaseId === "phase-4") {
        $$renderer3.push("<!--[3-->");
        CollectiveServicePhaseFour($$renderer3, { phaseFour: data.lifecycle.phaseFour });
      } else if (activePhaseId === "phase-5") {
        $$renderer3.push("<!--[4-->");
        CollectiveServicePhaseFive($$renderer3, {
          data,
          activityForm,
          highlightedActivityId,
          highlightedRequestId,
          openComposer: openActivityComposer,
          openComposerForDay: openActivityComposerForDay,
          openRequestComposer,
          openRequestComposerForDay,
          openRequestComposerForActivity,
          closeRequestComposer,
          focusActivityCard,
          planServiceRequest,
          serviceRequestForm,
          submitActivity,
          submitServiceRequest,
          updateRequestStatus,
          changecommitment: updateActivityCommitment,
          requestServiceRequestSettingsChange,
          voteOnRequestSettingsChange,
          createPullRequest,
          requestMergeCapabilityChange,
          requestRepositoryReplacement,
          recordPullRequestMerge,
          toggleHistoryCompletion,
          get activityComposerElement() {
            return activityComposerElement;
          },
          set activityComposerElement($$value) {
            activityComposerElement = $$value;
            $$settled = false;
          },
          get serviceRequestComposerElement() {
            return serviceRequestComposerElement;
          },
          set serviceRequestComposerElement($$value) {
            serviceRequestComposerElement = $$value;
            $$settled = false;
          },
          get activityEndInputElement() {
            return activityEndInputElement;
          },
          set activityEndInputElement($$value) {
            activityEndInputElement = $$value;
            $$settled = false;
          },
          get activityStartInputElement() {
            return activityStartInputElement;
          },
          set activityStartInputElement($$value) {
            activityStartInputElement = $$value;
            $$settled = false;
          },
          get selectedRequestActivityId() {
            return selectedRequestActivityId;
          },
          set selectedRequestActivityId($$value) {
            selectedRequestActivityId = $$value;
            $$settled = false;
          },
          get showComposer() {
            return showPhaseFiveComposer;
          },
          set showComposer($$value) {
            showPhaseFiveComposer = $$value;
            $$settled = false;
          },
          get showRequestComposer() {
            return showRequestComposer;
          },
          set showRequestComposer($$value) {
            showRequestComposer = $$value;
            $$settled = false;
          }
        });
      } else {
        $$renderer3.push("<!--[-1-->");
        CollectiveServicePhaseSix($$renderer3, { projectMode: data.projectMode });
      }
      $$renderer3.push(`<!--]-->`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, {
      data,
      activePhaseId,
      importanceOptions,
      draftValue,
      showPhaseOneComposer,
      showPhaseTwoComposer,
      showPhaseThreeComposer,
      showPhaseFiveComposer,
      showRequestComposer,
      productionForm,
      distributionForm,
      activityForm,
      serviceRequestForm,
      highlightedActivityId,
      highlightedRequestId,
      selectedRequestActivityId,
      activityComposerElement,
      serviceRequestComposerElement,
      activityStartInputElement,
      activityEndInputElement,
      submitValue,
      setProjectValueVote,
      addProductionPlanPhase,
      removeProductionPlanPhase,
      submitProductionPlan,
      setPhaseTwoPlanValueVote,
      setPhaseTwoPlanOverallVote,
      addDistributionPlanPhase,
      removeDistributionPlanPhase,
      submitDistributionPlan,
      setPhaseThreePlanValueVote,
      setPhaseThreePlanOverallVote,
      isExpandedPlan,
      openActivityComposer,
      openActivityComposerForDay,
      openRequestComposer,
      openRequestComposerForDay,
      openRequestComposerForActivity,
      closeRequestComposer,
      focusActivityCard,
      planServiceRequest,
      submitActivity,
      submitServiceRequest,
      updateRequestStatus,
      updateActivityCommitment,
      requestServiceRequestSettingsChange,
      voteOnRequestSettingsChange,
      createPullRequest,
      requestMergeCapabilityChange,
      requestRepositoryReplacement,
      recordPullRequestMerge,
      toggleHistoryCompletion
    });
  });
}
function IndividualServicePhaseOne($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let usesCalendar, personalRequestMode, allowsDirectRequests, requestScheduleRequired, calendarCanCreate, calendarCreateActive, calendarSelectedDayIso, sortedRequests, requestSettingsVotes, requestSettingsVoteCount, requestHistory, selfPlannedHistory, calendarActivities, currentRequestSettings, draftRequestSettings;
    let data = $$props["data"];
    let highlightedActivityId = fallback($$props["highlightedActivityId"], null);
    let highlightedRequestId = fallback($$props["highlightedRequestId"], null);
    let showPersonalActivityComposer = fallback($$props["showPersonalActivityComposer"], false);
    let showPersonalServiceRequestComposer = fallback($$props["showPersonalServiceRequestComposer"], false);
    let serviceRequestForm = $$props["serviceRequestForm"];
    let activityForm = $$props["activityForm"];
    let activityComposerElement = fallback($$props["activityComposerElement"], null);
    let serviceRequestComposerElement = fallback($$props["serviceRequestComposerElement"], null);
    let activityStartInputElement = fallback($$props["activityStartInputElement"], null);
    let activityEndInputElement = fallback($$props["activityEndInputElement"], null);
    let updateRequestStatus = fallback($$props["updateRequestStatus"], () => {
    });
    let openPersonalActivityComposer = fallback($$props["openPersonalActivityComposer"], () => {
    });
    let openPersonalServiceRequestComposer = fallback($$props["openPersonalServiceRequestComposer"], () => {
    });
    let openPersonalServiceRequestComposerForDay = fallback($$props["openPersonalServiceRequestComposerForDay"], () => {
    });
    let submitActivity = fallback($$props["submitActivity"], () => {
    });
    let submitServiceRequest = fallback($$props["submitServiceRequest"], () => {
    });
    let requestServiceRequestSettingsChange = fallback($$props["requestServiceRequestSettingsChange"], () => {
    });
    let voteOnRequestSettingsChange = fallback($$props["voteOnRequestSettingsChange"], () => {
    });
    let toggleHistoryCompletion = fallback($$props["toggleHistoryCompletion"], () => {
    });
    function localDateTimeValue(value) {
      const date = new Date(value);
      const year = date.getFullYear();
      const month = `${date.getMonth() + 1}`.padStart(2, "0");
      const day = `${date.getDate()}`.padStart(2, "0");
      const hours = `${date.getHours()}`.padStart(2, "0");
      const minutes = `${date.getMinutes()}`.padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    function firstAvailabilityForDay(isoDay) {
      const dayStart = (/* @__PURE__ */ new Date(`${isoDay}T00:00:00`)).getTime();
      const dayEnd = (/* @__PURE__ */ new Date(`${isoDay}T23:59:59`)).getTime();
      return data.lifecycle.phaseFive.activities.find((activity) => {
        const activityStart = new Date(activity.startAt).getTime();
        const activityEnd = new Date(activity.endAt).getTime();
        return activityStart <= dayEnd && activityEnd >= dayStart;
      });
    }
    function activityById(activityId) {
      return data.lifecycle.phaseFive.activities.find((activity) => activity.id === activityId);
    }
    function createRequestSettingsForm() {
      const settings = data.lifecycle.requestSystem?.settings;
      return {
        enabled: settings?.enabled ?? true,
        requestMode: settings?.requestMode ?? "calendar",
        reason: ""
      };
    }
    function resolveRequestSettings(settings) {
      return {
        enabled: settings?.enabled ?? true,
        requestMode: settings?.requestMode ?? "calendar"
      };
    }
    function requestSettingsMatch(left, right) {
      return left.enabled === right.enabled && left.requestMode === right.requestMode;
    }
    function historyItemByActivityId(activityId) {
      return data.lifecycle.phaseFive.history.find((item) => item.activity.id === activityId) ?? null;
    }
    function scrollHistoryCardIntoView(historyId) {
      if (typeof document === "undefined") {
        return;
      }
      document.getElementById(`history-card-${historyId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    async function focusHistoryCard(historyId) {
      if (historyHighlightResetHandle) {
        clearTimeout(historyHighlightResetHandle);
      }
      highlightedHistoryId = historyId;
      await tick();
      scrollHistoryCardIntoView(historyId);
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            scrollHistoryCardIntoView(historyId);
          });
        });
      }
      historyHighlightResetHandle = setTimeout(
        () => {
          if (highlightedHistoryId === historyId) {
            highlightedHistoryId = null;
          }
          historyHighlightResetHandle = null;
        },
        1800
      );
    }
    async function openCalendarComposer() {
      activeTab = "live";
      if (data.lifecycle.phaseFive.viewerCanCreateActivities) {
        await openPersonalActivityComposer();
        return;
      }
      await openPersonalServiceRequestComposer();
    }
    async function openCalendarComposerForDay(isoDay) {
      activeTab = "live";
      if (data.lifecycle.phaseFive.viewerCanCreateActivities) {
        selectedActivityId = "";
        activityForm.scheduledAt = `${isoDay}T18:00`;
        activityForm.endsAt = `${isoDay}T19:00`;
        await openPersonalActivityComposer();
        return;
      }
      const slot2 = firstAvailabilityForDay(isoDay);
      if (!slot2) {
        return;
      }
      selectedActivityId = slot2.id;
      serviceRequestForm.scheduledAt = localDateTimeValue(slot2.startAt);
      serviceRequestForm.endsAt = localDateTimeValue(slot2.endAt);
      await openPersonalServiceRequestComposerForDay(isoDay);
    }
    async function openCalendarComposerForActivity(activityId) {
      const historyItem = historyItemByActivityId(activityId);
      if (historyItem && historyItem.historyState !== "request-only") {
        activeTab = "history";
        await focusHistoryCard(historyItem.id);
        return;
      }
      if (!usesCalendar || data.lifecycle.phaseFive.viewerCanCreateActivities) {
        return;
      }
      const slot2 = activityById(activityId);
      if (!slot2) {
        return;
      }
      selectedActivityId = slot2.id;
      serviceRequestForm.scheduledAt = localDateTimeValue(slot2.startAt);
      serviceRequestForm.endsAt = localDateTimeValue(slot2.endAt);
      activeTab = "live";
      await openPersonalServiceRequestComposer();
    }
    let activeTab = "live";
    let selectedActivityId = "";
    let highlightedHistoryId = null;
    let historyHighlightResetHandle = null;
    let showRequestSettingsComposer = false;
    let showRequestSettingsVote = false;
    let requestSettingsForm = createRequestSettingsForm();
    usesCalendar = data.lifecycle.personalService?.usesCalendar ?? true;
    personalRequestMode = data.lifecycle.personalService?.requestMode ?? "calendar";
    allowsDirectRequests = personalRequestMode === "direct" || personalRequestMode === "both";
    requestScheduleRequired = data.lifecycle.requestSystem?.requiresSchedule ?? false;
    calendarCanCreate = usesCalendar && data.lifecycle.phaseFive.viewerCanCreateActivities;
    calendarCreateActive = data.lifecycle.phaseFive.viewerCanCreateActivities ? showPersonalActivityComposer : showPersonalServiceRequestComposer;
    calendarSelectedDayIso = usesCalendar ? data.lifecycle.phaseFive.viewerCanCreateActivities ? activityForm.scheduledAt : serviceRequestForm.scheduledAt ?? "" : "";
    sortedRequests = [...data.lifecycle.requestSystem?.requests ?? []].sort((left, right) => +new Date(right.createdAt) - +new Date(left.createdAt));
    requestSettingsVotes = data.lifecycle.requestSystem?.settingsChangeRequests ?? [];
    requestSettingsVoteCount = requestSettingsVotes.length;
    requestHistory = data.lifecycle.phaseFive.history.filter((item) => item.source === "request");
    selfPlannedHistory = data.lifecycle.phaseFive.history.filter((item) => item.source === "self-planned");
    calendarActivities = [
      ...data.lifecycle.phaseFive.activities,
      ...data.lifecycle.phaseFive.history.filter((item) => item.historyState !== "request-only" && item.activity.statusTone === "green").map((item) => item.activity)
    ];
    currentRequestSettings = resolveRequestSettings(data.lifecycle.requestSystem?.settings);
    {
      requestSettingsForm = createRequestSettingsForm();
    }
    draftRequestSettings = resolveRequestSettings(requestSettingsForm);
    !requestSettingsMatch(currentRequestSettings, draftRequestSettings);
    if (!showPersonalServiceRequestComposer) {
      selectedActivityId = "";
    }
    if (requestSettingsVoteCount === 0) {
      showRequestSettingsVote = false;
    }
    if (highlightedActivityId || highlightedRequestId) {
      activeTab = "live";
    }
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<section class="phase-surface svelte-11pu50v">`);
      if (usesCalendar) {
        $$renderer3.push("<!--[0-->");
        ProjectActivityCalendarCard($$renderer3, {
          activities: calendarActivities,
          canCreate: calendarCanCreate || (data.lifecycle.requestSystem?.viewerCanSubmitRequests ?? false),
          createActive: calendarCreateActive,
          selectedDayIso: calendarSelectedDayIso,
          selectedActivityId,
          daySelect: openCalendarComposerForDay,
          createAction: openCalendarComposer,
          activitySelect: openCalendarComposerForActivity
        });
        $$renderer3.push(`<!----> `);
        if (data.lifecycle.requestSystem?.viewerCanSubmitRequests && allowsDirectRequests && !requestScheduleRequired) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="composer-actions request-action-row svelte-11pu50v"><button class="secondary-button svelte-11pu50v" type="button">New direct request</button></div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]-->`);
      } else {
        $$renderer3.push("<!--[-1-->");
        $$renderer3.push(`<div class="empty-card helper-card svelte-11pu50v"><p class="svelte-11pu50v">This service is currently running through direct written requests instead of listed availability.</p></div> `);
        if (data.lifecycle.requestSystem?.viewerCanSubmitRequests) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="composer-actions request-action-row svelte-11pu50v"><button class="primary-button svelte-11pu50v" type="button">New request</button></div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]-->`);
      }
      $$renderer3.push(`<!--]--> `);
      ProjectActivityViewTabs($$renderer3, {
        ariaLabel: "Service activity view",
        get activeTab() {
          return activeTab;
        },
        set activeTab($$value) {
          activeTab = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> `);
      if (activeTab === "live") {
        $$renderer3.push("<!--[0-->");
        if (data.lifecycle.requestSystem) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<section class="card-rail-section svelte-11pu50v"><div class="section-head svelte-11pu50v"><div class="section-copy"><h3 class="svelte-11pu50v">Requests</h3> <p class="svelte-11pu50v">${escape_html(data.lifecycle.requestSystem.settings.summary)}</p></div> <div class="section-actions svelte-11pu50v">`);
          if (requestSettingsVoteCount > 0) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<button class="vote-chip notice-chip svelte-11pu50v" type="button">Vote Active `);
            CountBadge($$renderer3, { count: requestSettingsVoteCount });
            $$renderer3.push(`<!----></button>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--> `);
          if (data.lifecycle.requestSystem.viewerCanRequestSettingsChanges) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<button${attr_class("secondary-button svelte-11pu50v", void 0, { "active-toggle": showRequestSettingsComposer })} type="button">Edit request settings</button>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--></div></div> `);
          if (requestSettingsVoteCount > 0 && showRequestSettingsVote) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<div class="composer-card settings-panel svelte-11pu50v"><div class="request-header-row svelte-11pu50v"><div><h3 class="svelte-11pu50v">Active request settings votes</h3> <p class="svelte-11pu50v">`);
            if (requestSettingsVoteCount === 1) {
              $$renderer3.push("<!--[0-->");
              $$renderer3.push(`One settings change vote is open right now.`);
            } else {
              $$renderer3.push("<!--[-1-->");
              $$renderer3.push(`${escape_html(requestSettingsVoteCount)} settings change votes are open right now.`);
            }
            $$renderer3.push(`<!--]--></p></div></div> <div class="surface-stack svelte-11pu50v"><!--[-->`);
            const each_array = ensure_array_like(requestSettingsVotes);
            for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
              let requestSettingsVote = each_array[$$index];
              $$renderer3.push(`<article class="vote-request-card svelte-11pu50v"><div class="vote-card-top svelte-11pu50v"><div class="vote-card-copy svelte-11pu50v"><span class="vote-kicker svelte-11pu50v">Settings change</span> <strong class="svelte-11pu50v">${escape_html(requestSettingsVote.proposedSettings.summary)}</strong></div> <span class="vote-requirement svelte-11pu50v">${escape_html(formatProjectVoteRequirement(requestSettingsVote.voteSummary, requestSettingsVote.approvalThresholdPercent))}</span></div> <p class="svelte-11pu50v">${escape_html(requestSettingsVote.reason)}</p> <div class="vote-summary-row svelte-11pu50v"><span class="svelte-11pu50v">${escape_html(formatProjectVoteSummary(requestSettingsVote.voteSummary))}</span></div> `);
              VoteCardFooter($$renderer3, {
                authorUsername: requestSettingsVote.authorUsername,
                createdAt: requestSettingsVote.createdAt,
                activeVote: requestSettingsVote.voteSummary.activeVote,
                canVote: data.lifecycle.requestSystem.viewerCanVoteOnSettingsChanges,
                onVote: (vote) => voteOnRequestSettingsChange(requestSettingsVote.id, vote)
              });
              $$renderer3.push(`<!----></article>`);
            }
            $$renderer3.push(`<!--]--></div></div>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--> `);
          {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--> `);
          if (data.lifecycle.requestSystem?.viewerCanSubmitRequests && showPersonalServiceRequestComposer) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<div class="composer-card svelte-11pu50v"><div class="request-header-row svelte-11pu50v"><div><h3 class="svelte-11pu50v">Request service</h3> <p class="svelte-11pu50v">`);
            if (requestScheduleRequired) {
              $$renderer3.push("<!--[0-->");
              $$renderer3.push(`Start from the selected available time and add the details for the creator.`);
            } else {
              $$renderer3.push("<!--[-1-->");
              $$renderer3.push(`Describe what you need so the creator can review the request and reply in messages.`);
            }
            $$renderer3.push(`<!--]--></p></div></div> <input${attr("value", serviceRequestForm.title)} maxlength="120" placeholder="Request title" class="svelte-11pu50v"/> `);
            if (requestScheduleRequired) {
              $$renderer3.push("<!--[0-->");
              $$renderer3.push(`<div class="number-grid svelte-11pu50v"><label><span class="field-inline-label svelte-11pu50v">Start time</span> <input${attr("value", serviceRequestForm.scheduledAt)} type="datetime-local" class="svelte-11pu50v"/></label> <label><span class="field-inline-label svelte-11pu50v">Finish time</span> <input${attr("value", serviceRequestForm.endsAt)} type="datetime-local" class="svelte-11pu50v"/></label></div>`);
            } else {
              $$renderer3.push("<!--[-1-->");
            }
            $$renderer3.push(`<!--]--> <textarea rows="3"${attr("placeholder", requestScheduleRequired ? "What do you need help with?" : "What do you need, and what should the creator expect?")} class="svelte-11pu50v">`);
            const $$body = escape_html(serviceRequestForm.body);
            if ($$body) {
              $$renderer3.push(`${$$body}`);
            }
            $$renderer3.push(`</textarea> <div class="composer-actions svelte-11pu50v"><button class="secondary-button svelte-11pu50v" type="button">Cancel</button> <button class="primary-button svelte-11pu50v" type="button">Send request</button></div></div>`);
          } else {
            $$renderer3.push("<!--[-1-->");
          }
          $$renderer3.push(`<!--]--> `);
          if (data.lifecycle.requestSystem.viewerCanReviewRequests) {
            $$renderer3.push("<!--[0-->");
            if (!data.lifecycle.requestSystem.enabled && sortedRequests.length === 0) {
              $$renderer3.push("<!--[0-->");
              $$renderer3.push(`<div class="empty-card svelte-11pu50v">Requests are currently turned off.</div>`);
            } else if (sortedRequests.length === 0) {
              $$renderer3.push("<!--[1-->");
              $$renderer3.push(`<div class="empty-card svelte-11pu50v">No open requests right now.</div>`);
            } else {
              $$renderer3.push("<!--[-1-->");
              $$renderer3.push(`<div class="card-rail svelte-11pu50v"><!--[-->`);
              const each_array_1 = ensure_array_like(sortedRequests);
              for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
                let request = each_array_1[$$index_1];
                $$renderer3.push(`<div${attr("id", `request-card-${request.id}`)} class="rail-card svelte-11pu50v">`);
                CollapsibleServiceRequestCard($$renderer3, {
                  request,
                  expanded: highlightedRequestId === request.id,
                  highlighted: highlightedRequestId === request.id,
                  children: ($$renderer4) => {
                    if (request.status === "open") {
                      $$renderer4.push("<!--[0-->");
                      $$renderer4.push(`<div class="binary-row review-actions svelte-11pu50v"><button class="vote-chip svelte-11pu50v" type="button">Accept</button> <button class="vote-chip negative svelte-11pu50v" type="button">Decline</button></div>`);
                    } else {
                      $$renderer4.push("<!--[-1-->");
                    }
                    $$renderer4.push(`<!--]-->`);
                  },
                  $$slots: { default: true }
                });
                $$renderer3.push(`<!----></div>`);
              }
              $$renderer3.push(`<!--]--></div>`);
            }
            $$renderer3.push(`<!--]-->`);
          } else if (data.lifecycle.requestSystem.enabled) {
            $$renderer3.push("<!--[1-->");
            $$renderer3.push(`<div class="empty-card svelte-11pu50v">Requests stay private between each requester and the service creator.</div>`);
          } else {
            $$renderer3.push("<!--[-1-->");
            $$renderer3.push(`<div class="empty-card svelte-11pu50v">Requests are currently turned off.</div>`);
          }
          $$renderer3.push(`<!--]--></section>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> <section class="card-rail-section svelte-11pu50v"><div class="section-head svelte-11pu50v"><div class="section-copy"><h3 class="svelte-11pu50v">Activity</h3> <p class="svelte-11pu50v">${escape_html(data.lifecycle.phaseFive.activities.length)} future activity card${escape_html(data.lifecycle.phaseFive.activities.length === 1 ? "" : "s")}</p></div></div> `);
        if (data.lifecycle.phaseFive.viewerCanCreateActivities && showPersonalActivityComposer) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="composer-card svelte-11pu50v"><div class="request-header-row svelte-11pu50v"><div><h3 class="svelte-11pu50v">Add availability</h3> <p class="svelte-11pu50v">These slots are what other users can request.</p></div></div> <div class="number-grid svelte-11pu50v"><label><span class="field-inline-label svelte-11pu50v">Start time</span> <input${attr("value", activityForm.scheduledAt)} type="datetime-local" class="svelte-11pu50v"/></label> <label><span class="field-inline-label svelte-11pu50v">Finish time</span> <input${attr("value", activityForm.endsAt)} type="datetime-local" class="svelte-11pu50v"/></label></div> <div class="composer-actions svelte-11pu50v"><button class="secondary-button svelte-11pu50v" type="button">Cancel</button> <button class="primary-button svelte-11pu50v" type="button">Add availability</button></div></div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (data.lifecycle.phaseFive.activities.length === 0) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="empty-card svelte-11pu50v">`);
          if (usesCalendar) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`No future availability or accepted request activity is scheduled yet.`);
          } else {
            $$renderer3.push("<!--[-1-->");
            $$renderer3.push(`This service is currently running without listed activity slots.`);
          }
          $$renderer3.push(`<!--]--></div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
          $$renderer3.push(`<div class="card-rail svelte-11pu50v"><!--[-->`);
          const each_array_2 = ensure_array_like(data.lifecycle.phaseFive.activities);
          for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
            let activity = each_array_2[$$index_2];
            $$renderer3.push(`<div${attr("id", `activity-card-${activity.id}`)} class="rail-card svelte-11pu50v">`);
            CollapsibleActivityCard($$renderer3, {
              activity,
              expanded: highlightedActivityId === activity.id,
              highlighted: highlightedActivityId === activity.id
            });
            $$renderer3.push(`<!----></div>`);
          }
          $$renderer3.push(`<!--]--></div>`);
        }
        $$renderer3.push(`<!--]--></section>`);
      } else {
        $$renderer3.push("<!--[-1-->");
        $$renderer3.push(`<div class="history-stack svelte-11pu50v">`);
        ProjectActivityHistorySection($$renderer3, {
          title: "Request history",
          description: "Past accepted requests and request-based activity.",
          items: requestHistory,
          emptyMessage: "No request-based activity has moved into history yet.",
          highlightedHistoryId,
          toggleHistoryCompletion
        });
        $$renderer3.push(`<!----> `);
        ProjectActivityHistorySection($$renderer3, {
          title: "Self planned history",
          description: "Past availability or directly created service activity.",
          items: selfPlannedHistory,
          emptyMessage: "No self-planned activity has moved into history yet.",
          highlightedHistoryId,
          toggleHistoryCompletion
        });
        $$renderer3.push(`<!----></div>`);
      }
      $$renderer3.push(`<!--]--></section>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, {
      data,
      highlightedActivityId,
      highlightedRequestId,
      showPersonalActivityComposer,
      showPersonalServiceRequestComposer,
      serviceRequestForm,
      activityForm,
      activityComposerElement,
      serviceRequestComposerElement,
      activityStartInputElement,
      activityEndInputElement,
      updateRequestStatus,
      openPersonalActivityComposer,
      openPersonalServiceRequestComposer,
      openPersonalServiceRequestComposerForDay,
      submitActivity,
      submitServiceRequest,
      requestServiceRequestSettingsChange,
      voteOnRequestSettingsChange,
      toggleHistoryCompletion
    });
  });
}
function IndividualServicePhaseTwo($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let projectMode = $$props["projectMode"];
    function completionCopy() {
      if (isPersonalServiceProject(projectMode)) {
        return "This phase records the service as closed, while still leaving room to point people toward a future collective service or productive project if the work grows beyond one person.";
      }
      if (isCollectiveServiceProject(projectMode)) {
        return "This phase closes the service while keeping its history visible. If related work continues later, it should either move back into planning or link to a new project.";
      }
      return "This phase records the project as closed or converted into an ongoing service. The history above stays visible either way.";
    }
    $$renderer2.push(`<section class="phase-surface svelte-1z0j19x"><div class="empty-card svelte-1z0j19x">${escape_html(completionCopy())}</div></section>`);
    bind_props($$props, { projectMode });
  });
}
function IndividualServiceLifecycleContent($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    let activePhaseId = $$props["activePhaseId"];
    let activityForm = $$props["activityForm"];
    let serviceRequestForm = $$props["serviceRequestForm"];
    let highlightedActivityId = fallback($$props["highlightedActivityId"], null);
    let highlightedRequestId = fallback($$props["highlightedRequestId"], null);
    let showPersonalActivityComposer = fallback($$props["showPersonalActivityComposer"], false);
    let showPersonalServiceRequestComposer = fallback($$props["showPersonalServiceRequestComposer"], false);
    let activityComposerElement = fallback($$props["activityComposerElement"], null);
    let serviceRequestComposerElement = fallback($$props["serviceRequestComposerElement"], null);
    let activityStartInputElement = fallback($$props["activityStartInputElement"], null);
    let activityEndInputElement = fallback($$props["activityEndInputElement"], null);
    let openPersonalActivityComposer = fallback($$props["openPersonalActivityComposer"], () => {
    });
    let openPersonalServiceRequestComposer = fallback($$props["openPersonalServiceRequestComposer"], () => {
    });
    let openPersonalServiceRequestComposerForDay = fallback($$props["openPersonalServiceRequestComposerForDay"], () => {
    });
    let submitActivity = fallback($$props["submitActivity"], () => {
    });
    let submitServiceRequest = fallback($$props["submitServiceRequest"], () => {
    });
    let updateRequestStatus = fallback($$props["updateRequestStatus"], () => {
    });
    let requestServiceRequestSettingsChange = fallback($$props["requestServiceRequestSettingsChange"], () => {
    });
    let voteOnRequestSettingsChange = fallback($$props["voteOnRequestSettingsChange"], () => {
    });
    let toggleHistoryCompletion = fallback($$props["toggleHistoryCompletion"], () => {
    });
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      if (activePhaseId === "phase-1") {
        $$renderer3.push("<!--[0-->");
        IndividualServicePhaseOne($$renderer3, {
          data,
          activityForm,
          highlightedActivityId,
          highlightedRequestId,
          openPersonalActivityComposer,
          openPersonalServiceRequestComposer,
          openPersonalServiceRequestComposerForDay,
          serviceRequestForm,
          submitActivity,
          submitServiceRequest,
          updateRequestStatus,
          requestServiceRequestSettingsChange,
          voteOnRequestSettingsChange,
          toggleHistoryCompletion,
          get activityComposerElement() {
            return activityComposerElement;
          },
          set activityComposerElement($$value) {
            activityComposerElement = $$value;
            $$settled = false;
          },
          get activityEndInputElement() {
            return activityEndInputElement;
          },
          set activityEndInputElement($$value) {
            activityEndInputElement = $$value;
            $$settled = false;
          },
          get activityStartInputElement() {
            return activityStartInputElement;
          },
          set activityStartInputElement($$value) {
            activityStartInputElement = $$value;
            $$settled = false;
          },
          get serviceRequestComposerElement() {
            return serviceRequestComposerElement;
          },
          set serviceRequestComposerElement($$value) {
            serviceRequestComposerElement = $$value;
            $$settled = false;
          },
          get showPersonalActivityComposer() {
            return showPersonalActivityComposer;
          },
          set showPersonalActivityComposer($$value) {
            showPersonalActivityComposer = $$value;
            $$settled = false;
          },
          get showPersonalServiceRequestComposer() {
            return showPersonalServiceRequestComposer;
          },
          set showPersonalServiceRequestComposer($$value) {
            showPersonalServiceRequestComposer = $$value;
            $$settled = false;
          }
        });
      } else {
        $$renderer3.push("<!--[-1-->");
        IndividualServicePhaseTwo($$renderer3, { projectMode: data.projectMode });
      }
      $$renderer3.push(`<!--]-->`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, {
      data,
      activePhaseId,
      activityForm,
      serviceRequestForm,
      highlightedActivityId,
      highlightedRequestId,
      showPersonalActivityComposer,
      showPersonalServiceRequestComposer,
      activityComposerElement,
      serviceRequestComposerElement,
      activityStartInputElement,
      activityEndInputElement,
      openPersonalActivityComposer,
      openPersonalServiceRequestComposer,
      openPersonalServiceRequestComposerForDay,
      submitActivity,
      submitServiceRequest,
      updateRequestStatus,
      requestServiceRequestSettingsChange,
      voteOnRequestSettingsChange,
      toggleHistoryCompletion
    });
  });
}
function ProjectLifecycleMechanicsCard($$renderer, $$props) {
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
    $$renderer2.push(`<div class="phase-header svelte-1c41zzv"><div class="phase-line svelte-1c41zzv"><span class="phase-kicker svelte-1c41zzv">${escape_html(phase.shortLabel)}</span> <div class="phase-badges svelte-1c41zzv"><span${attr_class(`phase-badge ${phase.progressState}`, "svelte-1c41zzv")}>${escape_html(progressLabel)}</span> `);
    if (phase.betaLocked) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<span class="phase-badge locked svelte-1c41zzv">Coming later</span>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div></div> <div class="phase-copy svelte-1c41zzv"><div class="phase-title-row svelte-1c41zzv"><h2 class="svelte-1c41zzv">${escape_html(phase.title)}</h2></div> <div class="phase-subtitle-row svelte-1c41zzv"><p class="phase-subtitle svelte-1c41zzv">${escape_html(inlineSubtitle)}</p> <button class="phase-help-button svelte-1c41zzv" type="button"${attr("aria-label", showHowItWorks ? "Hide how it works" : "Show how it works")}${attr("aria-expanded", showHowItWorks)}>?</button></div></div></div> `);
    if (showHowItWorks) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="mechanics-card svelte-1c41zzv"><div class="mechanics-body svelte-1c41zzv"><p class="svelte-1c41zzv">${escape_html(phase.summary)}</p> `);
      if (phase.note) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<p${attr_class("phase-note svelte-1c41zzv", void 0, { "locked-copy": phase.progressState === "locked" })}>${escape_html(phase.note)}</p>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <ul class="phase-list svelte-1c41zzv"><!--[-->`);
      const each_array = ensure_array_like(phase.mechanics);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let mechanic = each_array[$$index];
        $$renderer2.push(`<li class="svelte-1c41zzv">${escape_html(mechanic)}</li>`);
      }
      $$renderer2.push(`<!--]--></ul></div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { phase, progressLabel, showHowItWorks });
  });
}
function ProjectLifecyclePhaseTabs($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let tabs = fallback($$props["tabs"], () => [], true);
    let activePhaseId = $$props["activePhaseId"];
    let selectPhase = fallback($$props["selectPhase"], () => {
    });
    $$renderer2.push(`<section class="phase-tab-row svelte-vgg7rl"${attr_style(`grid-template-columns: repeat(${tabs.length}, minmax(0, 1fr))`)}><!--[-->`);
    const each_array = ensure_array_like(tabs);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let tab = each_array[$$index];
      $$renderer2.push(`<button${attr_class("phase-tab svelte-vgg7rl", void 0, {
        "active": activePhaseId === tab.phase.id,
        "current-phase": tab.phase.progressState === "current",
        "future-phase": tab.isFuture && tab.phase.progressState !== "locked",
        "locked-phase": tab.phase.progressState === "locked"
      })} type="button"><span class="phase-tab-number svelte-vgg7rl">${escape_html(tab.phase.shortLabel)}</span> <span class="phase-tab-title svelte-vgg7rl">${escape_html(tab.title)}</span> <small${attr_class("svelte-vgg7rl", void 0, { "current-label": tab.phase.progressState === "current" })}>${escape_html(tab.progressLabel)}</small></button>`);
    }
    $$renderer2.push(`<!--]--></section>`);
    bind_props($$props, { tabs, activePhaseId, selectPhase });
  });
}
function ProjectPhaseChangeSection($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let currentPhaseVisible, personalDirectPhaseChange, returnRequests, nextVoteKind, nextActionRequests, canDirectReturn, canDirectAdvance, showReturnActions, showNextActions, canOfferConversionOnClose;
    let data = $$props["data"];
    let activePhaseId = $$props["activePhaseId"];
    let advancePhase = fallback($$props["advancePhase"], () => {
    });
    let revertPhase = fallback($$props["revertPhase"], () => {
    });
    let requestPhaseChange = fallback($$props["requestPhaseChange"], () => {
    });
    let voteOnPhaseChange = fallback($$props["voteOnPhaseChange"], () => {
    });
    let showNextPhaseComposer = false;
    let showRevertComposer = false;
    let nextPhaseReason = "";
    let nextPhaseCloseOutcome = "close";
    let revertReason = "";
    let revertTargetPhaseId = "phase-2";
    let expandedVoteGroup = null;
    function closePhaseId() {
      return isPersonalServiceProject(data.projectMode) ? "phase-2" : "phase-6";
    }
    function isClosingTransition() {
      return data.lifecycle.nextPhaseId === closePhaseId();
    }
    function revertTargetLabel(phaseId) {
      if (phaseId === "phase-1") {
        return "Phase 1 / Active service";
      }
      if (phaseId === "phase-2") {
        return isCollectiveServiceProject(data.projectMode) ? "Phase 2 / Operations Plan" : "Phase 2 / Production Plan";
      }
      return isCollectiveServiceProject(data.projectMode) ? "Phase 3 / Access Plan" : "Phase 3 / Distribution Plan";
    }
    function nextPhaseActionLabel() {
      if (!data.lifecycle.nextPhaseId || !data.lifecycle.nextPhaseLabel) {
        return null;
      }
      if (isClosingTransition()) {
        if (canOfferConversionOnClose) {
          return "Close or convert";
        }
        return personalDirectPhaseChange ? "Close service" : "Close";
      }
      return personalDirectPhaseChange ? "Advance project" : "Advance";
    }
    function nextPhasePlaceholder() {
      if (personalDirectPhaseChange && isClosingTransition()) {
        return "Add the closure note that should appear in project updates.";
      }
      if (canOfferConversionOnClose) {
        return "State why the project should close now or reopen as a governed follow-on service.";
      }
      return isClosingTransition() ? "State why the project should close or where the work continues next." : "State why this phase change should happen now.";
    }
    function requestKindLabel(request) {
      switch (request.kind) {
        case "close":
          return request.closeOutcome === "convert" ? "Convert decision" : "Close decision";
        case "return":
          return "Return decision";
        default:
          return "Advance decision";
      }
    }
    currentPhaseVisible = activePhaseId === data.lifecycle.currentPhaseId;
    personalDirectPhaseChange = isPersonalServiceProject(data.projectMode);
    returnRequests = data.lifecycle.phaseChangeRequests.filter((request) => request.kind === "return");
    nextVoteKind = isClosingTransition() ? "close" : "advance";
    nextActionRequests = data.lifecycle.phaseChangeRequests.filter((request) => request.kind === nextVoteKind);
    canDirectReturn = personalDirectPhaseChange && data.lifecycle.viewerCanRevertPhase;
    canDirectAdvance = personalDirectPhaseChange && data.lifecycle.viewerCanAdvancePhase;
    showReturnActions = personalDirectPhaseChange ? canDirectReturn : data.lifecycle.revertablePhaseIds.length > 0 || returnRequests.length > 0;
    showNextActions = personalDirectPhaseChange ? canDirectAdvance : !!data.lifecycle.nextPhaseId || nextActionRequests.length > 0;
    canOfferConversionOnClose = !personalDirectPhaseChange && isProductiveProject(data.projectMode) && isClosingTransition();
    canOfferConversionOnClose ? {
      projectMode: "collective-service",
      projectSubtype: data.projectSubtype === "software" ? "software" : "standard"
    } : null;
    if (!data.lifecycle.revertablePhaseIds.includes(revertTargetPhaseId)) {
      revertTargetPhaseId = data.lifecycle.revertablePhaseIds[0] ?? "phase-1";
    }
    if (!currentPhaseVisible) {
      showNextPhaseComposer = false;
      showRevertComposer = false;
      expandedVoteGroup = null;
    }
    if (currentPhaseVisible && (data.lifecycle.phaseChangeRequests.length > 0 || data.lifecycle.viewerCanRequestPhaseChanges || data.lifecycle.viewerCanAdvancePhase || data.lifecycle.viewerCanRevertPhase)) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="phase-change-stack svelte-r2diu2">`);
      if (showReturnActions || showNextActions) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="change-action-row svelte-r2diu2"><div class="action-group action-group-left svelte-r2diu2">`);
        if ((personalDirectPhaseChange ? canDirectReturn : data.lifecycle.viewerCanRequestPhaseChanges) && data.lifecycle.revertablePhaseIds.length > 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<button${attr_class("secondary-button action-button svelte-r2diu2", void 0, { "active-toggle": showRevertComposer })} type="button">${escape_html(personalDirectPhaseChange ? "Return to active" : "Return")}</button>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (!personalDirectPhaseChange && returnRequests.length > 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<button class="vote-chip notice-chip svelte-r2diu2" type="button">Vote Active `);
          CountBadge($$renderer2, { count: returnRequests.length });
          $$renderer2.push(`<!----></button>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div> <div class="action-group action-group-right svelte-r2diu2">`);
        if (!personalDirectPhaseChange && nextActionRequests.length > 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<button class="vote-chip notice-chip svelte-r2diu2" type="button">Vote Active `);
          CountBadge($$renderer2, { count: nextActionRequests.length });
          $$renderer2.push(`<!----></button>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if ((personalDirectPhaseChange ? canDirectAdvance : data.lifecycle.viewerCanRequestPhaseChanges) && data.lifecycle.nextPhaseId) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<button${attr_class("secondary-button action-button svelte-r2diu2", void 0, { "active-toggle": showNextPhaseComposer })} type="button">${escape_html(nextPhaseActionLabel())}</button>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (showRevertComposer && (personalDirectPhaseChange ? canDirectReturn : data.lifecycle.viewerCanRequestPhaseChanges) && data.lifecycle.revertablePhaseIds.length > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="mechanics-card change-action-panel svelte-r2diu2"><div class="composer-card svelte-r2diu2"><h3 class="svelte-r2diu2">${escape_html(personalDirectPhaseChange ? "Return to active" : "Return")}</h3> <label><span class="field-inline-label svelte-r2diu2">Return to</span> `);
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
          "svelte-r2diu2"
        );
        $$renderer2.push(`</label> <label><span class="field-inline-label svelte-r2diu2">Reason</span> <textarea rows="3"${attr("placeholder", personalDirectPhaseChange ? "State clearly why the project should return to active work." : "State clearly why the project should return to an earlier planning phase.")} class="svelte-r2diu2">`);
        const $$body = escape_html(revertReason);
        if ($$body) {
          $$renderer2.push(`${$$body}`);
        }
        $$renderer2.push(`</textarea></label> <div class="composer-actions svelte-r2diu2"><button class="secondary-button svelte-r2diu2" type="button">Cancel</button> <button class="primary-button svelte-r2diu2" type="button">${escape_html(personalDirectPhaseChange ? "Return to active" : "Return")}</button></div></div></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (showNextPhaseComposer && data.lifecycle.nextPhaseId) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="mechanics-card change-action-panel svelte-r2diu2"><div class="composer-card svelte-r2diu2"><h3 class="svelte-r2diu2">${escape_html(nextPhaseActionLabel())}</h3> `);
        if (canOfferConversionOnClose) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<label><span class="field-inline-label svelte-r2diu2">Outcome</span> `);
          $$renderer2.select(
            { value: nextPhaseCloseOutcome, class: "" },
            ($$renderer3) => {
              $$renderer3.option({ value: "close" }, ($$renderer4) => {
                $$renderer4.push(`Close project`);
              });
              $$renderer3.option({ value: "convert" }, ($$renderer4) => {
                $$renderer4.push(`Convert into collective service`);
              });
            },
            "svelte-r2diu2"
          );
          $$renderer2.push(`</label> `);
          {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]-->`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> <label><span class="field-inline-label svelte-r2diu2">Reason</span> <textarea rows="3"${attr("placeholder", nextPhasePlaceholder())} class="svelte-r2diu2">`);
        const $$body_1 = escape_html(nextPhaseReason);
        if ($$body_1) {
          $$renderer2.push(`${$$body_1}`);
        }
        $$renderer2.push(`</textarea></label> <div class="composer-actions svelte-r2diu2"><button class="secondary-button svelte-r2diu2" type="button">Cancel</button> <button class="primary-button svelte-r2diu2" type="button">${escape_html(nextPhaseActionLabel())}</button></div></div></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (expandedVoteGroup === "return" && returnRequests.length > 0) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="surface-stack svelte-r2diu2"><!--[-->`);
        const each_array_1 = ensure_array_like(returnRequests);
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let request = each_array_1[$$index_1];
          $$renderer2.push(`<article class="surface-card vote-request-card svelte-r2diu2"><div class="vote-card-top svelte-r2diu2"><div class="vote-card-copy svelte-r2diu2"><span class="vote-kicker svelte-r2diu2">${escape_html(requestKindLabel(request))}</span> <strong class="svelte-r2diu2">${escape_html(request.targetPhaseLabel)}</strong></div> <span class="vote-requirement svelte-r2diu2">${escape_html(formatProjectVoteRequirement(request.voteSummary, request.approvalThresholdPercent))}</span></div> <p class="svelte-r2diu2">${escape_html(request.reason)}</p> `);
          if (request.closeOutcome === "convert" && request.conversionTarget) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<div class="detail-grid svelte-r2diu2"><div class="detail-card svelte-r2diu2"><span class="svelte-r2diu2">Successor target</span> <strong class="svelte-r2diu2">${escape_html(request.conversionTarget.projectModeLabel)} · ${escape_html(request.conversionTarget.projectSubtypeLabel)}</strong></div> <div class="detail-card svelte-r2diu2"><span class="svelte-r2diu2">Successor entry phase</span> <strong class="svelte-r2diu2">${escape_html(request.conversionTarget.entryPhaseLabel)}</strong></div></div>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--> <div class="vote-summary-row svelte-r2diu2"><span class="svelte-r2diu2">${escape_html(formatProjectVoteSummary(request.voteSummary))}</span></div> `);
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
        $$renderer2.push(`<div class="surface-stack svelte-r2diu2"><!--[-->`);
        const each_array_2 = ensure_array_like(nextActionRequests);
        for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
          let request = each_array_2[$$index_2];
          $$renderer2.push(`<article class="surface-card vote-request-card svelte-r2diu2"><div class="vote-card-top svelte-r2diu2"><div class="vote-card-copy svelte-r2diu2"><span class="vote-kicker svelte-r2diu2">${escape_html(requestKindLabel(request))}</span> <strong class="svelte-r2diu2">${escape_html(request.targetPhaseLabel)}</strong></div> <span class="vote-requirement svelte-r2diu2">${escape_html(formatProjectVoteRequirement(request.voteSummary, request.approvalThresholdPercent))}</span></div> <p class="svelte-r2diu2">${escape_html(request.reason)}</p> <div class="vote-summary-row svelte-r2diu2"><span class="svelte-r2diu2">${escape_html(formatProjectVoteSummary(request.voteSummary))}</span></div> `);
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
      advancePhase,
      revertPhase,
      requestPhaseChange,
      voteOnPhaseChange
    });
  });
}
function ProjectLifecyclePanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let currentPhaseOrder, activePhase, phaseTabs, activePhaseProgressLabel;
    const importanceOptions = Array.from({ length: 10 }, (_, index) => {
      const value = index + 1;
      return {
        value,
        label: value === 1 ? "Unnecessary" : value === 10 ? "Required" : `Importance ${value} of 10`
      };
    });
    let data = $$props["data"];
    const fundingPhaseCopy = "Funding opens in a later platform phase";
    function createDraftPlanPhase() {
      return {
        title: "",
        details: "",
        materialsLabel: "",
        costLabel: fundingPhaseCopy
      };
    }
    function createDraftActivityRole() {
      return { label: "", requiredCount: 1 };
    }
    function projectPlanPhaseHasAnyInput(phase) {
      return !!phase.title.trim() || !!phase.details.trim() || !!phase.materialsLabel.trim() || !!phase.costLabel.trim();
    }
    function projectPlanPhaseIsComplete(phase) {
      return !!phase.title.trim() && !!phase.details.trim() && !!phase.materialsLabel.trim() && !!phase.costLabel.trim();
    }
    function validateProjectPlanForm(form, options = {}) {
      const validationMessages = [];
      const hasAnyCompleteStage = form.planPhases.some(projectPlanPhaseIsComplete);
      const hasPartialStage = form.planPhases.some((phase) => projectPlanPhaseHasAnyInput(phase) && !projectPlanPhaseIsComplete(phase));
      if (!form.title.trim()) {
        validationMessages.push("Add a plan title.");
      }
      if (!form.description.trim()) {
        validationMessages.push("Add a plan description.");
      }
      if (!form.demandConsiderationNote.trim()) {
        validationMessages.push("Explain how this plan responds to the current demand signal.");
      }
      if (!form.totalCostLabel.trim()) {
        validationMessages.push("Total cost is missing.");
      }
      if (options.requireSoftwareRepository && !form.repositoryUrl?.trim()) {
        validationMessages.push("Add the official repository URL for software plans.");
      }
      if (options.distributionLockedToSoftware) {
        validationMessages.push("Software projects use the automatic open-source distribution path and do not accept distribution plans here.");
      }
      if (!hasAnyCompleteStage) {
        validationMessages.push("Add at least one stage with a title, description, material or resource, and stage cost.");
      } else if (hasPartialStage) {
        validationMessages.push("Finish every stage you start. Each stage needs a title, description, material or resource, and stage cost.");
      }
      return validationMessages;
    }
    let activePhaseId = data.lifecycle.currentPhaseId;
    let lastCurrentPhaseId = data.lifecycle.currentPhaseId;
    let draftValue = "";
    let productionForm = {
      title: "",
      description: "",
      projectSubtype: "standard",
      repositoryUrl: "",
      demandConsiderationNote: "",
      totalCostLabel: fundingPhaseCopy,
      planPhases: [createDraftPlanPhase()],
      validationMessages: []
    };
    let distributionForm = {
      title: "",
      description: "",
      demandConsiderationNote: "",
      totalCostLabel: fundingPhaseCopy,
      planPhases: [createDraftPlanPhase()],
      requestSystemEnabled: false,
      requestMode: "both",
      allowOffScheduleRequests: false,
      validationMessages: []
    };
    let activityForm = {
      title: "",
      scheduledAt: "",
      endsAt: "",
      locationLabel: "",
      roleRequirements: [createDraftActivityRole()],
      linkedPlanPhaseId: "",
      note: ""
    };
    let serviceRequestForm = { title: "", body: "", scheduledAt: "", endsAt: "" };
    let showPhaseTwoComposer = false;
    let showPhaseThreeComposer = false;
    let showPhaseOneComposer = false;
    let showPersonalActivityComposer = false;
    let showPersonalServiceRequestComposer = false;
    let showCollectiveRequestComposer = false;
    let showPhaseFiveComposer = false;
    let expandedPhaseTwoPlanIds = [];
    let expandedPhaseThreePlanIds = [];
    let expandedActivityIds = [];
    let highlightedActivityId = null;
    let highlightedRequestId = null;
    let selectedCollectiveRequestActivityId = null;
    let activityHighlightResetHandle = null;
    let requestHighlightResetHandle = null;
    let lastActivityTargetId = null;
    let lastRequestTargetId = null;
    let activityComposerElement = null;
    let serviceRequestComposerElement = null;
    let activityStartInputElement = null;
    let activityEndInputElement = null;
    let showHowItWorks = false;
    let lastHowItWorksPhaseId = activePhaseId;
    function phaseOrder(phaseId) {
      return data.lifecycle.phases.find((phase) => phase.id === phaseId)?.order ?? 1;
    }
    function readActivityTarget(url) {
      if (url.hash.startsWith("#activity-card-")) {
        return url.hash.slice("#activity-card-".length) || null;
      }
      if (url.hash.startsWith("#activity-")) {
        return url.hash.slice("#activity-".length) || null;
      }
      return url.searchParams.get("activity");
    }
    function readRequestTarget(url) {
      if (url.hash.startsWith("#request-card-")) {
        return url.hash.slice("#request-card-".length) || null;
      }
      if (url.hash.startsWith("#request-")) {
        return url.hash.slice("#request-".length) || null;
      }
      return url.searchParams.get("request");
    }
    function isFuturePhase(phase) {
      return phase.order > currentPhaseOrder;
    }
    function selectPhase(phase) {
      activePhaseId = phase.id;
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
    function localDateTimeValue(date) {
      const year = date.getFullYear();
      const month = `${date.getMonth() + 1}`.padStart(2, "0");
      const day = `${date.getDate()}`.padStart(2, "0");
      const hours = `${date.getHours()}`.padStart(2, "0");
      const minutes = `${date.getMinutes()}`.padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    function phaseTabTitle(phase) {
      if (data.lifecycle.usesPlatformLifecycle) {
        return phase.title;
      }
      if (isPersonalServiceProject(data.projectMode)) {
        switch (phase.id) {
          case "phase-1":
            return "Activity";
          case "phase-2":
            return "Closed";
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
            return "Closed";
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
          return "Closed";
        case "phase-7":
          return "Closed";
      }
    }
    async function refreshAfter(action) {
      await action();
      await invalidateAll();
    }
    function handlePhaseChangeRequest(targetPhaseId, reason, options) {
      return refreshAfter(() => requestProjectPhaseChange(data.slug, targetPhaseId, reason, options));
    }
    function handlePhaseChangeVote(requestId, vote) {
      return refreshAfter(() => setProjectPhaseChangeVote(data.slug, requestId, vote));
    }
    function handleProjectValueVote(valueId, voteValue) {
      return refreshAfter(() => setProjectValueImportance(data.slug, valueId, voteValue));
    }
    function handlePhaseTwoPlanValueVote(planId, valueId, vote) {
      return refreshAfter(() => setProjectPlanValueVote(data.slug, "phase-2", planId, valueId, vote));
    }
    function handlePhaseTwoPlanOverallVote(planId, vote) {
      return refreshAfter(() => setProjectPlanOverallVote(data.slug, "phase-2", planId, vote));
    }
    function handlePhaseThreePlanValueVote(planId, valueId, vote) {
      return refreshAfter(() => setProjectPlanValueVote(data.slug, "phase-3", planId, valueId, vote));
    }
    function handlePhaseThreePlanOverallVote(planId, vote) {
      return refreshAfter(() => setProjectPlanOverallVote(data.slug, "phase-3", planId, vote));
    }
    async function submitValue() {
      if (!draftValue.trim()) {
        return;
      }
      await refreshAfter(() => addProjectValue(data.slug, draftValue));
      draftValue = "";
      showPhaseOneComposer = false;
    }
    async function submitProductionPlan() {
      const validationMessages = validateProjectPlanForm(productionForm, {
        requireSoftwareRepository: productionForm.projectSubtype === "software"
      });
      if (validationMessages.length > 0) {
        productionForm = { ...productionForm, validationMessages };
        return;
      }
      const planPhases = productionForm.planPhases.filter(projectPlanPhaseIsComplete);
      const created = await addProjectProductionPlan(data.slug, {
        title: productionForm.title,
        description: productionForm.description,
        projectSubtype: productionForm.projectSubtype,
        repositoryUrl: productionForm.projectSubtype === "software" ? productionForm.repositoryUrl : void 0,
        demandConsiderationNote: productionForm.demandConsiderationNote,
        totalCostLabel: productionForm.totalCostLabel,
        planPhases
      });
      if (!created) {
        productionForm = {
          ...productionForm,
          validationMessages: [
            "This production plan could not be submitted from the current state. Reload and try again."
          ]
        };
        return;
      }
      await invalidateAll();
      productionForm = {
        title: "",
        description: "",
        projectSubtype: "standard",
        repositoryUrl: "",
        demandConsiderationNote: "",
        totalCostLabel: fundingPhaseCopy,
        planPhases: [createDraftPlanPhase()],
        validationMessages: []
      };
      showPhaseTwoComposer = false;
    }
    async function submitDistributionPlan() {
      const validationMessages = validateProjectPlanForm(distributionForm, {
        distributionLockedToSoftware: data.lifecycle.currentSubtype === "software"
      });
      if (validationMessages.length > 0) {
        distributionForm = { ...distributionForm, validationMessages };
        return;
      }
      const planPhases = distributionForm.planPhases.filter(projectPlanPhaseIsComplete);
      const created = await addProjectDistributionPlan(data.slug, {
        title: distributionForm.title,
        description: distributionForm.description,
        demandConsiderationNote: distributionForm.demandConsiderationNote,
        totalCostLabel: distributionForm.totalCostLabel,
        planPhases,
        requestSystemEnabled: distributionForm.requestSystemEnabled,
        requestMode: distributionForm.requestMode,
        allowOffScheduleRequests: distributionForm.allowOffScheduleRequests
      });
      if (!created) {
        distributionForm = {
          ...distributionForm,
          validationMessages: [
            "This distribution plan could not be submitted from the current state. Reload and try again."
          ]
        };
        return;
      }
      await invalidateAll();
      distributionForm = {
        title: "",
        description: "",
        demandConsiderationNote: "",
        totalCostLabel: fundingPhaseCopy,
        planPhases: [createDraftPlanPhase()],
        requestSystemEnabled: false,
        requestMode: "both",
        allowOffScheduleRequests: false,
        validationMessages: []
      };
      showPhaseThreeComposer = false;
    }
    async function submitActivity() {
      const scheduledAtValue = activityStartInputElement?.value || activityForm.scheduledAt;
      const endsAtValue = activityEndInputElement?.value || activityForm.endsAt;
      if (isPersonalServiceProject(data.projectMode)) {
        if (!scheduledAtValue || !endsAtValue || new Date(endsAtValue).getTime() <= new Date(scheduledAtValue).getTime()) {
          return;
        }
        activityForm.scheduledAt = scheduledAtValue;
        activityForm.endsAt = endsAtValue;
        await refreshAfter(() => addProjectActivity(data.slug, {
          title: "Available",
          scheduledAt: new Date(scheduledAtValue).toISOString(),
          endsAt: new Date(endsAtValue).toISOString(),
          locationLabel: data.locationLabel,
          roleRequirements: [{ label: "Service lead", requiredCount: 1 }],
          linkedPlanPhaseId: null,
          note: "Availability shared by the service creator."
        }));
        activityForm = {
          title: "",
          scheduledAt: "",
          endsAt: "",
          locationLabel: "",
          roleRequirements: [createDraftActivityRole()],
          linkedPlanPhaseId: "",
          note: ""
        };
        showPersonalActivityComposer = false;
        return;
      }
      const roleRequirements = activityForm.roleRequirements.map((role) => {
        const requiredCount = Math.max(1, Number(role.requiredCount) || 1);
        const parsedMaximumCount = Number(role.maximumCount);
        return {
          label: role.label.trim(),
          requiredCount,
          maximumCount: Number.isFinite(parsedMaximumCount) ? Math.max(requiredCount, Math.floor(parsedMaximumCount)) : void 0
        };
      }).filter((role) => role.label);
      if (!activityForm.title.trim() || !scheduledAtValue || !endsAtValue || !activityForm.locationLabel.trim() || !activityForm.note.trim() || roleRequirements.length === 0 || new Date(endsAtValue).getTime() <= new Date(scheduledAtValue).getTime()) {
        return;
      }
      activityForm.scheduledAt = scheduledAtValue;
      activityForm.endsAt = endsAtValue;
      await refreshAfter(() => addProjectActivity(data.slug, {
        title: activityForm.title,
        scheduledAt: new Date(scheduledAtValue).toISOString(),
        endsAt: new Date(endsAtValue).toISOString(),
        locationLabel: activityForm.locationLabel,
        roleRequirements,
        linkedPlanPhaseId: activityForm.linkedPlanPhaseId || null,
        note: activityForm.note
      }));
      activityForm = {
        title: "",
        scheduledAt: "",
        endsAt: "",
        locationLabel: "",
        roleRequirements: [createDraftActivityRole()],
        linkedPlanPhaseId: "",
        note: ""
      };
      showPersonalActivityComposer = false;
      showPhaseFiveComposer = false;
    }
    async function submitServiceRequest() {
      const scheduledAtValue = serviceRequestForm.scheduledAt;
      const endsAtValue = serviceRequestForm.endsAt;
      const requiresSchedule = isCollectiveServiceProject(data.projectMode) || (data.lifecycle.requestSystem?.requiresSchedule ?? false);
      if (!serviceRequestForm.title.trim() || !serviceRequestForm.body.trim()) {
        return;
      }
      if (requiresSchedule && (!scheduledAtValue || !endsAtValue || new Date(endsAtValue).getTime() <= new Date(scheduledAtValue).getTime())) {
        return;
      }
      await refreshAfter(() => addProjectServiceRequest(data.slug, {
        title: serviceRequestForm.title,
        body: serviceRequestForm.body,
        scheduledAt: scheduledAtValue ? new Date(scheduledAtValue).toISOString() : void 0,
        endsAt: endsAtValue ? new Date(endsAtValue).toISOString() : void 0
      }));
      resetServiceRequestForm();
      showPersonalServiceRequestComposer = false;
      showCollectiveRequestComposer = false;
      selectedCollectiveRequestActivityId = null;
    }
    async function updateRequestStatus(requestId, status) {
      await refreshAfter(() => setProjectServiceRequestStatus(data.slug, requestId, status));
    }
    async function planServiceRequest(requestId, input) {
      await refreshAfter(() => planProjectServiceRequest(data.slug, requestId, input));
    }
    async function submitServiceRequestSettingsChange(input) {
      await refreshAfter(() => requestProjectServiceRequestSettingsChange(data.slug, input));
    }
    async function voteOnServiceRequestSettingsChange(requestId, vote) {
      await refreshAfter(() => setProjectServiceRequestSettingsChangeVote(data.slug, requestId, vote));
    }
    async function toggleServiceHistoryCompletion(historyId, role, selection) {
      await refreshAfter(() => toggleProjectServiceHistoryCompletion(data.slug, historyId, role, selection));
    }
    async function advancePhase(closeNote) {
      await refreshAfter(() => advanceProjectPhase(data.slug, closeNote));
    }
    async function revertPhase(targetPhaseId, reason) {
      await refreshAfter(() => revertProjectPhase(data.slug, targetPhaseId, reason));
    }
    async function submitSoftwarePullRequest(input) {
      await refreshAfter(() => addProjectPullRequest(data.slug, input));
    }
    async function submitSoftwareMergeCapabilityChange(input) {
      await refreshAfter(() => requestProjectMergeCapabilityChange(data.slug, input));
    }
    async function submitSoftwareRepositoryReplacement(input) {
      await refreshAfter(() => requestProjectRepositoryReplacement(data.slug, input));
    }
    async function recordSoftwarePullRequestMerge(requestId, mergeId) {
      await refreshAfter(() => recordProjectPullRequestMerge(data.slug, requestId, mergeId));
    }
    function addProductionPlanPhase() {
      productionForm.planPhases = [...productionForm.planPhases, createDraftPlanPhase()];
    }
    function removeProductionPlanPhase(index) {
      productionForm.planPhases = productionForm.planPhases.filter((_, phaseIndex) => phaseIndex !== index);
    }
    function addDistributionPlanPhase() {
      distributionForm.planPhases = [...distributionForm.planPhases, createDraftPlanPhase()];
    }
    function removeDistributionPlanPhase(index) {
      distributionForm.planPhases = distributionForm.planPhases.filter((_, phaseIndex) => phaseIndex !== index);
    }
    function isExpandedPlan(list, planId) {
      return (list === "phase-2" ? expandedPhaseTwoPlanIds : expandedPhaseThreePlanIds).includes(planId);
    }
    async function updateActivityCommitment(activityId, roleLabel) {
      await refreshAfter(() => setProjectActivityCommitment(data.slug, activityId, roleLabel));
    }
    function setDefaultActivityTimes(isoDay) {
      if (isoDay) {
        activityForm.scheduledAt = `${isoDay}T18:00`;
        activityForm.endsAt = `${isoDay}T19:00`;
        return;
      }
      if (!activityForm.scheduledAt || !activityForm.endsAt) {
        const now = /* @__PURE__ */ new Date();
        now.setMinutes(0, 0, 0);
        now.setHours(now.getHours() + 1);
        const end = new Date(now.getTime() + 60 * 60 * 1e3);
        activityForm.scheduledAt = localDateTimeValue(now);
        activityForm.endsAt = localDateTimeValue(end);
      }
    }
    function resetServiceRequestForm() {
      serviceRequestForm = { title: "", body: "", scheduledAt: "", endsAt: "" };
    }
    function setDefaultServiceRequestTimes(isoDay) {
      const requiresSchedule = isCollectiveServiceProject(data.projectMode) || (data.lifecycle.requestSystem?.requiresSchedule ?? false);
      if (!requiresSchedule) {
        if (!selectedCollectiveRequestActivityId) {
          serviceRequestForm.scheduledAt = "";
          serviceRequestForm.endsAt = "";
        }
        return;
      }
      if (isoDay) {
        serviceRequestForm.scheduledAt = `${isoDay}T18:00`;
        serviceRequestForm.endsAt = `${isoDay}T19:00`;
        return;
      }
      if (!serviceRequestForm.scheduledAt || !serviceRequestForm.endsAt) {
        const now = /* @__PURE__ */ new Date();
        now.setMinutes(0, 0, 0);
        now.setHours(now.getHours() + 1);
        const end = new Date(now.getTime() + 60 * 60 * 1e3);
        serviceRequestForm.scheduledAt = localDateTimeValue(now);
        serviceRequestForm.endsAt = localDateTimeValue(end);
      }
    }
    function setServiceRequestWindow(startAt, endsAt) {
      serviceRequestForm.scheduledAt = localDateTimeValue(new Date(startAt));
      serviceRequestForm.endsAt = localDateTimeValue(new Date(endsAt));
    }
    function selectCalendarDay(isoDay) {
      setDefaultActivityTimes(isoDay);
    }
    async function openActivityComposerForDay(isoDay) {
      selectCalendarDay(isoDay);
      showCollectiveRequestComposer = false;
      selectedCollectiveRequestActivityId = null;
      showPhaseFiveComposer = true;
      await tick();
    }
    async function openActivityComposer() {
      setDefaultActivityTimes();
      showCollectiveRequestComposer = false;
      selectedCollectiveRequestActivityId = null;
      showPhaseFiveComposer = true;
      await tick();
    }
    async function openPersonalActivityComposer() {
      setDefaultActivityTimes();
      showPersonalActivityComposer = true;
      await tick();
    }
    async function openPersonalServiceRequestComposerForDay(isoDay) {
      setDefaultServiceRequestTimes(isoDay);
      showPersonalServiceRequestComposer = true;
      await tick();
    }
    async function openPersonalServiceRequestComposer() {
      setDefaultServiceRequestTimes();
      showPersonalServiceRequestComposer = true;
      await tick();
    }
    async function openCollectiveServiceRequestComposer() {
      selectedCollectiveRequestActivityId = null;
      setDefaultServiceRequestTimes();
      showPhaseFiveComposer = false;
      showCollectiveRequestComposer = true;
      await tick();
    }
    async function openCollectiveServiceRequestComposerForDay(isoDay) {
      selectedCollectiveRequestActivityId = null;
      setDefaultServiceRequestTimes(isoDay);
      showPhaseFiveComposer = false;
      showCollectiveRequestComposer = true;
      await tick();
    }
    async function openCollectiveServiceRequestComposerForActivity(activityId) {
      const activity = data.lifecycle.phaseFive.activities.find((item) => item.id === activityId);
      selectedCollectiveRequestActivityId = activityId;
      if (activity) {
        setServiceRequestWindow(activity.startAt, activity.endAt);
      } else {
        setDefaultServiceRequestTimes();
      }
      showPhaseFiveComposer = false;
      showCollectiveRequestComposer = true;
      await tick();
    }
    function closeCollectiveServiceRequestComposer() {
      showCollectiveRequestComposer = false;
      selectedCollectiveRequestActivityId = null;
      resetServiceRequestForm();
    }
    async function focusActivityCard(activityId) {
      if (activityHighlightResetHandle) {
        clearTimeout(activityHighlightResetHandle);
      }
      highlightedActivityId = activityId;
      await tick();
      activityHighlightResetHandle = setTimeout(
        () => {
          if (highlightedActivityId === activityId) {
            highlightedActivityId = null;
          }
          activityHighlightResetHandle = null;
        },
        1800
      );
    }
    async function focusRequestCard(requestId) {
      if (requestHighlightResetHandle) {
        clearTimeout(requestHighlightResetHandle);
      }
      highlightedRequestId = requestId;
      await tick();
      requestHighlightResetHandle = setTimeout(
        () => {
          if (highlightedRequestId === requestId) {
            highlightedRequestId = null;
          }
          requestHighlightResetHandle = null;
        },
        1800
      );
    }
    currentPhaseOrder = phaseOrder(data.lifecycle.currentPhaseId);
    if (lastCurrentPhaseId !== data.lifecycle.currentPhaseId) {
      lastCurrentPhaseId = data.lifecycle.currentPhaseId;
      activePhaseId = data.lifecycle.currentPhaseId;
      showPhaseOneComposer = false;
      showPersonalActivityComposer = false;
      showPersonalServiceRequestComposer = false;
      showCollectiveRequestComposer = false;
      showPhaseTwoComposer = false;
      showPhaseThreeComposer = false;
      showPhaseFiveComposer = false;
      selectedCollectiveRequestActivityId = null;
      expandedPhaseTwoPlanIds = [];
      expandedPhaseThreePlanIds = [];
      expandedActivityIds = [];
      if (activityHighlightResetHandle) {
        clearTimeout(activityHighlightResetHandle);
        activityHighlightResetHandle = null;
      }
      if (requestHighlightResetHandle) {
        clearTimeout(requestHighlightResetHandle);
        requestHighlightResetHandle = null;
      }
      highlightedActivityId = null;
      highlightedRequestId = null;
    }
    {
      const activityTargetId = readActivityTarget(store_get($$store_subs ??= {}, "$page", page).url);
      if (!activityTargetId) {
        lastActivityTargetId = null;
      } else if (activityTargetId !== lastActivityTargetId) {
        lastActivityTargetId = activityTargetId;
        activePhaseId = isPersonalServiceProject(data.projectMode) ? "phase-1" : "phase-5";
        if (!expandedActivityIds.includes(activityTargetId)) {
          expandedActivityIds = [...expandedActivityIds, activityTargetId];
        }
        void focusActivityCard(activityTargetId);
      }
    }
    {
      const requestTargetId = readRequestTarget(store_get($$store_subs ??= {}, "$page", page).url);
      if (!requestTargetId) {
        lastRequestTargetId = null;
      } else if (requestTargetId !== lastRequestTargetId) {
        lastRequestTargetId = requestTargetId;
        activePhaseId = isPersonalServiceProject(data.projectMode) ? "phase-1" : "phase-5";
        void focusRequestCard(requestTargetId);
      }
    }
    activePhase = data.lifecycle.phases.find((phase) => phase.id === activePhaseId) ?? data.lifecycle.phases.find((phase) => phase.id === data.lifecycle.currentPhaseId) ?? data.lifecycle.phases[0];
    if (lastHowItWorksPhaseId !== activePhaseId) {
      lastHowItWorksPhaseId = activePhaseId;
      showHowItWorks = false;
    }
    if (!showPhaseTwoComposer && productionForm.validationMessages.length > 0) {
      productionForm = { ...productionForm, validationMessages: [] };
    }
    if (!showPhaseThreeComposer && distributionForm.validationMessages.length > 0) {
      distributionForm = { ...distributionForm, validationMessages: [] };
    }
    phaseTabs = data.lifecycle.phases.map((phase) => ({
      phase,
      title: phaseTabTitle(phase),
      progressLabel: phaseProgressLabel(phase),
      isFuture: isFuturePhase(phase)
    }));
    activePhaseProgressLabel = phaseProgressLabel(activePhase);
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<section class="lifecycle-shell svelte-178xeeh">`);
      ProjectLifecyclePhaseTabs($$renderer3, { tabs: phaseTabs, activePhaseId, selectPhase });
      $$renderer3.push(`<!----> <section class="phase-panel svelte-178xeeh">`);
      ProjectLifecycleMechanicsCard($$renderer3, {
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
      if (isPersonalServiceProject(data.projectMode)) {
        $$renderer3.push("<!--[0-->");
        IndividualServiceLifecycleContent($$renderer3, {
          data,
          activePhaseId: activePhase.id,
          activityForm,
          serviceRequestForm,
          highlightedActivityId,
          highlightedRequestId,
          openPersonalActivityComposer,
          openPersonalServiceRequestComposer,
          openPersonalServiceRequestComposerForDay,
          submitActivity,
          submitServiceRequest,
          updateRequestStatus,
          requestServiceRequestSettingsChange: submitServiceRequestSettingsChange,
          voteOnRequestSettingsChange: voteOnServiceRequestSettingsChange,
          toggleHistoryCompletion: toggleServiceHistoryCompletion,
          get showPersonalActivityComposer() {
            return showPersonalActivityComposer;
          },
          set showPersonalActivityComposer($$value) {
            showPersonalActivityComposer = $$value;
            $$settled = false;
          },
          get showPersonalServiceRequestComposer() {
            return showPersonalServiceRequestComposer;
          },
          set showPersonalServiceRequestComposer($$value) {
            showPersonalServiceRequestComposer = $$value;
            $$settled = false;
          },
          get activityComposerElement() {
            return activityComposerElement;
          },
          set activityComposerElement($$value) {
            activityComposerElement = $$value;
            $$settled = false;
          },
          get serviceRequestComposerElement() {
            return serviceRequestComposerElement;
          },
          set serviceRequestComposerElement($$value) {
            serviceRequestComposerElement = $$value;
            $$settled = false;
          },
          get activityStartInputElement() {
            return activityStartInputElement;
          },
          set activityStartInputElement($$value) {
            activityStartInputElement = $$value;
            $$settled = false;
          },
          get activityEndInputElement() {
            return activityEndInputElement;
          },
          set activityEndInputElement($$value) {
            activityEndInputElement = $$value;
            $$settled = false;
          }
        });
      } else if (isCollectiveServiceProject(data.projectMode)) {
        $$renderer3.push("<!--[1-->");
        CollectiveServiceLifecycleContent($$renderer3, {
          data,
          activePhaseId: activePhase.id,
          importanceOptions,
          productionForm,
          distributionForm,
          activityForm,
          serviceRequestForm,
          highlightedActivityId,
          highlightedRequestId,
          submitValue,
          setProjectValueVote: handleProjectValueVote,
          addProductionPlanPhase,
          removeProductionPlanPhase,
          submitProductionPlan,
          setPhaseTwoPlanValueVote: handlePhaseTwoPlanValueVote,
          setPhaseTwoPlanOverallVote: handlePhaseTwoPlanOverallVote,
          addDistributionPlanPhase,
          removeDistributionPlanPhase,
          submitDistributionPlan,
          setPhaseThreePlanValueVote: handlePhaseThreePlanValueVote,
          setPhaseThreePlanOverallVote: handlePhaseThreePlanOverallVote,
          isExpandedPlan,
          openActivityComposer,
          openActivityComposerForDay,
          openRequestComposer: openCollectiveServiceRequestComposer,
          openRequestComposerForDay: openCollectiveServiceRequestComposerForDay,
          openRequestComposerForActivity: openCollectiveServiceRequestComposerForActivity,
          closeRequestComposer: closeCollectiveServiceRequestComposer,
          focusActivityCard,
          planServiceRequest,
          submitActivity,
          submitServiceRequest,
          updateRequestStatus,
          updateActivityCommitment,
          requestServiceRequestSettingsChange: submitServiceRequestSettingsChange,
          voteOnRequestSettingsChange: voteOnServiceRequestSettingsChange,
          createPullRequest: submitSoftwarePullRequest,
          requestMergeCapabilityChange: submitSoftwareMergeCapabilityChange,
          requestRepositoryReplacement: submitSoftwareRepositoryReplacement,
          recordPullRequestMerge: recordSoftwarePullRequestMerge,
          toggleHistoryCompletion: toggleServiceHistoryCompletion,
          get draftValue() {
            return draftValue;
          },
          set draftValue($$value) {
            draftValue = $$value;
            $$settled = false;
          },
          get showPhaseOneComposer() {
            return showPhaseOneComposer;
          },
          set showPhaseOneComposer($$value) {
            showPhaseOneComposer = $$value;
            $$settled = false;
          },
          get showPhaseTwoComposer() {
            return showPhaseTwoComposer;
          },
          set showPhaseTwoComposer($$value) {
            showPhaseTwoComposer = $$value;
            $$settled = false;
          },
          get showPhaseThreeComposer() {
            return showPhaseThreeComposer;
          },
          set showPhaseThreeComposer($$value) {
            showPhaseThreeComposer = $$value;
            $$settled = false;
          },
          get showPhaseFiveComposer() {
            return showPhaseFiveComposer;
          },
          set showPhaseFiveComposer($$value) {
            showPhaseFiveComposer = $$value;
            $$settled = false;
          },
          get showRequestComposer() {
            return showCollectiveRequestComposer;
          },
          set showRequestComposer($$value) {
            showCollectiveRequestComposer = $$value;
            $$settled = false;
          },
          get selectedRequestActivityId() {
            return selectedCollectiveRequestActivityId;
          },
          set selectedRequestActivityId($$value) {
            selectedCollectiveRequestActivityId = $$value;
            $$settled = false;
          },
          get activityComposerElement() {
            return activityComposerElement;
          },
          set activityComposerElement($$value) {
            activityComposerElement = $$value;
            $$settled = false;
          },
          get serviceRequestComposerElement() {
            return serviceRequestComposerElement;
          },
          set serviceRequestComposerElement($$value) {
            serviceRequestComposerElement = $$value;
            $$settled = false;
          },
          get activityStartInputElement() {
            return activityStartInputElement;
          },
          set activityStartInputElement($$value) {
            activityStartInputElement = $$value;
            $$settled = false;
          },
          get activityEndInputElement() {
            return activityEndInputElement;
          },
          set activityEndInputElement($$value) {
            activityEndInputElement = $$value;
            $$settled = false;
          }
        });
      } else {
        $$renderer3.push("<!--[-1-->");
        ProductiveLifecycleContent($$renderer3, {
          data,
          activePhaseId: activePhase.id,
          importanceOptions,
          productionForm,
          distributionForm,
          activityForm,
          highlightedActivityId,
          submitValue,
          setProjectValueVote: handleProjectValueVote,
          addProductionPlanPhase,
          removeProductionPlanPhase,
          submitProductionPlan,
          setPhaseTwoPlanValueVote: handlePhaseTwoPlanValueVote,
          setPhaseTwoPlanOverallVote: handlePhaseTwoPlanOverallVote,
          addDistributionPlanPhase,
          removeDistributionPlanPhase,
          submitDistributionPlan,
          setPhaseThreePlanValueVote: handlePhaseThreePlanValueVote,
          setPhaseThreePlanOverallVote: handlePhaseThreePlanOverallVote,
          isExpandedPlan,
          openActivityComposer,
          openActivityComposerForDay,
          focusActivityCard,
          submitActivity,
          updateActivityCommitment,
          createPullRequest: submitSoftwarePullRequest,
          requestMergeCapabilityChange: submitSoftwareMergeCapabilityChange,
          requestRepositoryReplacement: submitSoftwareRepositoryReplacement,
          recordPullRequestMerge: recordSoftwarePullRequestMerge,
          toggleHistoryCompletion: toggleServiceHistoryCompletion,
          get draftValue() {
            return draftValue;
          },
          set draftValue($$value) {
            draftValue = $$value;
            $$settled = false;
          },
          get showPhaseOneComposer() {
            return showPhaseOneComposer;
          },
          set showPhaseOneComposer($$value) {
            showPhaseOneComposer = $$value;
            $$settled = false;
          },
          get showPhaseTwoComposer() {
            return showPhaseTwoComposer;
          },
          set showPhaseTwoComposer($$value) {
            showPhaseTwoComposer = $$value;
            $$settled = false;
          },
          get showPhaseThreeComposer() {
            return showPhaseThreeComposer;
          },
          set showPhaseThreeComposer($$value) {
            showPhaseThreeComposer = $$value;
            $$settled = false;
          },
          get showPhaseFiveComposer() {
            return showPhaseFiveComposer;
          },
          set showPhaseFiveComposer($$value) {
            showPhaseFiveComposer = $$value;
            $$settled = false;
          },
          get activityComposerElement() {
            return activityComposerElement;
          },
          set activityComposerElement($$value) {
            activityComposerElement = $$value;
            $$settled = false;
          },
          get activityStartInputElement() {
            return activityStartInputElement;
          },
          set activityStartInputElement($$value) {
            activityStartInputElement = $$value;
            $$settled = false;
          },
          get activityEndInputElement() {
            return activityEndInputElement;
          },
          set activityEndInputElement($$value) {
            activityEndInputElement = $$value;
            $$settled = false;
          }
        });
      }
      $$renderer3.push(`<!--]--> `);
      ProjectPhaseChangeSection($$renderer3, {
        data,
        activePhaseId,
        advancePhase,
        revertPhase,
        requestPhaseChange: handlePhaseChangeRequest,
        voteOnPhaseChange: handlePhaseChangeVote
      });
      $$renderer3.push(`<!----></section></section>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    if ($$store_subs) unsubscribe_stores($$store_subs);
    bind_props($$props, { data });
  });
}
function ProjectManualLinkRequestsSection($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let title = fallback($$props["title"], "Manual link approval queue");
    let description = fallback($$props["description"], "Any project member can propose a manual link, but the relationship only becomes active after both projects reach 66% approval from their own memberships.");
    let requests = fallback($$props["requests"], () => [], true);
    let emptyMessage = fallback($$props["emptyMessage"], "No manual link requests are seeded yet.");
    function tone(label) {
      const normalized = label.toLowerCase();
      if (normalized.includes("approved")) {
        return "approved";
      }
      if (normalized.includes("blocked")) {
        return "blocked";
      }
      return "pending";
    }
    $$renderer2.push(`<section class="request-stack svelte-ie5w3j"><div class="section-heading"><h2 class="svelte-ie5w3j">${escape_html(title)}</h2> `);
    if (description) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="svelte-ie5w3j">${escape_html(description)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    if (requests.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="empty-card svelte-ie5w3j">${escape_html(emptyMessage)}</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="request-list svelte-ie5w3j"><!--[-->`);
      const each_array = ensure_array_like(requests);
      for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
        let request = each_array[$$index_1];
        $$renderer2.push(`<article class="request-card svelte-ie5w3j"><div class="request-head svelte-ie5w3j"><div class="request-copy svelte-ie5w3j"><h3 class="svelte-ie5w3j">${escape_html(request.title)}</h3> <p class="svelte-ie5w3j">${escape_html(request.summary)}</p></div> <span${attr_class(`status-pill ${tone(request.statusLabel)}`, "svelte-ie5w3j")}>${escape_html(request.statusLabel)}</span></div> <div class="request-meta svelte-ie5w3j"><span>Proposed by ${escape_html(request.proposedByUsername)}</span> <span>${escape_html(request.createdAtLabel)}</span> <span class="relationship-pill svelte-ie5w3j">${escape_html(request.relationshipLabel)}</span> `);
        if (request.targetProjectHref) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<a class="open-link svelte-ie5w3j"${attr("href", request.targetProjectHref)}>Open linked project</a>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div> <div class="vote-grid svelte-ie5w3j"><!--[-->`);
        const each_array_1 = ensure_array_like([request.thisProjectVote, request.otherProjectVote]);
        for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
          let vote = each_array_1[$$index];
          $$renderer2.push(`<section${attr_class(`vote-card ${tone(vote.statusLabel)}`, "svelte-ie5w3j")}><div class="vote-head svelte-ie5w3j"><strong class="svelte-ie5w3j">${escape_html(vote.projectTitle)}</strong> <span class="vote-status svelte-ie5w3j">${escape_html(vote.statusLabel)}</span></div> <p class="svelte-ie5w3j">${escape_html(vote.approvalPercent)}% member approval</p> <p class="svelte-ie5w3j">${escape_html(vote.yesCount)} yes / ${escape_html(vote.noCount)} no</p> <p class="svelte-ie5w3j">${escape_html(vote.approvalsRequired)} approvals required from ${escape_html(vote.memberCount)} members</p> <p class="vote-note svelte-ie5w3j">${escape_html(vote.resultNote)}</p></section>`);
        }
        $$renderer2.push(`<!--]--></div></article>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></section>`);
    bind_props($$props, { title, description, requests, emptyMessage });
  });
}
function RequestFrameCard($$renderer, $$props) {
  let title = fallback($$props["title"], "");
  let body = fallback($$props["body"], "");
  let statusLabel = fallback($$props["statusLabel"], "Frame only");
  $$renderer.push(`<article class="frame-card svelte-hesxc4"><div class="frame-head svelte-hesxc4"><strong class="svelte-hesxc4">${escape_html(title)}</strong> <span class="status-pill svelte-hesxc4">${escape_html(statusLabel)}</span></div> <p class="svelte-hesxc4">${escape_html(body)}</p></article>`);
  bind_props($$props, { title, body, statusLabel });
}
function AssetUseRequestFrame($$renderer, $$props) {
  let title = fallback($$props["title"], "Project-use asset request flow");
  let body = fallback($$props["body"], "This frame is reserved for plan-blocking asset availability requests, steward votes, and confirmed in-house asset allocations.");
  let statusLabel = fallback($$props["statusLabel"], "Frame only");
  RequestFrameCard($$renderer, { title, body, statusLabel });
  bind_props($$props, { title, body, statusLabel });
}
function BorrowingRequestFrame($$renderer, $$props) {
  let title = fallback($$props["title"], "Borrowing request flow");
  let body = fallback($$props["body"], "This frame is reserved for user borrowing requests, return dates, steward review, and overdue state once borrowing is activated.");
  let statusLabel = fallback($$props["statusLabel"], "Frame only");
  RequestFrameCard($$renderer, { title, body, statusLabel });
  bind_props($$props, { title, body, statusLabel });
}
function DeliveryRequestFrame($$renderer, $$props) {
  let title = fallback($$props["title"], "Delivery request flow");
  let body = fallback($$props["body"], "This frame is reserved for delivery requests with origin, destination, timing, volunteer coordination, and completed-transfer records.");
  let statusLabel = fallback($$props["statusLabel"], "Frame only");
  RequestFrameCard($$renderer, { title, body, statusLabel });
  bind_props($$props, { title, body, statusLabel });
}
function RequestFrameStack($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let title = fallback($$props["title"], "");
    let description = fallback($$props["description"], "");
    let frames = fallback($$props["frames"], () => [], true);
    if (frames.length > 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<section class="request-frame-stack svelte-1ji3y96">`);
      if (title) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="section-heading"><h2 class="svelte-1ji3y96">${escape_html(title)}</h2> `);
        if (description) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<p class="svelte-1ji3y96">${escape_html(description)}</p>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="request-grid svelte-1ji3y96"><!--[-->`);
      const each_array = ensure_array_like(frames);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let frame = each_array[$$index];
        if (frame.id === "borrowing") {
          $$renderer2.push("<!--[0-->");
          BorrowingRequestFrame($$renderer2, {
            title: frame.title,
            body: frame.body,
            statusLabel: frame.statusLabel ?? "Frame only"
          });
        } else if (frame.id === "delivery") {
          $$renderer2.push("<!--[1-->");
          DeliveryRequestFrame($$renderer2, {
            title: frame.title,
            body: frame.body,
            statusLabel: frame.statusLabel ?? "Frame only"
          });
        } else if (frame.id === "asset-use") {
          $$renderer2.push("<!--[2-->");
          AssetUseRequestFrame($$renderer2, {
            title: frame.title,
            body: frame.body,
            statusLabel: frame.statusLabel ?? "Frame only"
          });
        } else {
          $$renderer2.push("<!--[-1-->");
          RequestFrameCard($$renderer2, {
            title: frame.title,
            body: frame.body,
            statusLabel: frame.statusLabel ?? "Frame only"
          });
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div></section>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { title, description, frames });
  });
}
function ProjectConversionLineageSection($$renderer, $$props) {
  let frame;
  let lineage = fallback($$props["lineage"], null);
  const fallback$1 = {
    title: "Conversion lineage",
    statusLabel: "Frame only",
    summary: "This frame is reserved for the permanent predecessor and successor link that appears when a project converts into a new project type.",
    permanenceNote: "When conversion is seeded here, the predecessor/successor relationship will stay visible permanently instead of being handled through manual links.",
    inventoryNote: "The successor project will inherit the predecessor inventory framing once the governed conversion path is fully wired.",
    predecessor: null,
    successor: null
  };
  frame = lineage ?? fallback$1;
  $$renderer.push(`<section class="conversion-section svelte-1pb6yss"><div class="section-heading svelte-1pb6yss"><h2 class="svelte-1pb6yss">${escape_html(frame.title)}</h2> `);
  if (frame.statusLabel) {
    $$renderer.push("<!--[0-->");
    $$renderer.push(`<span class="status-pill svelte-1pb6yss">${escape_html(frame.statusLabel)}</span>`);
  } else {
    $$renderer.push("<!--[-1-->");
  }
  $$renderer.push(`<!--]--></div> <p class="svelte-1pb6yss">${escape_html(frame.summary)}</p> `);
  if (frame.predecessor || frame.successor) {
    $$renderer.push("<!--[0-->");
    $$renderer.push(`<div class="lineage-grid svelte-1pb6yss">`);
    if (frame.predecessor) {
      $$renderer.push("<!--[0-->");
      $$renderer.push(`<article class="lineage-card svelte-1pb6yss"><div class="lineage-head svelte-1pb6yss"><strong class="svelte-1pb6yss">${escape_html(frame.predecessor.title)}</strong> <span class="relationship-pill svelte-1pb6yss">${escape_html(frame.predecessor.relationshipLabel)}</span></div> <p class="svelte-1pb6yss">${escape_html(frame.predecessor.summary)}</p> `);
      if (frame.predecessor.href) {
        $$renderer.push("<!--[0-->");
        $$renderer.push(`<a class="open-link svelte-1pb6yss"${attr("href", frame.predecessor.href)}>Open predecessor record</a>`);
      } else {
        $$renderer.push("<!--[-1-->");
      }
      $$renderer.push(`<!--]--></article>`);
    } else {
      $$renderer.push("<!--[-1-->");
    }
    $$renderer.push(`<!--]--> `);
    if (frame.successor) {
      $$renderer.push("<!--[0-->");
      $$renderer.push(`<article class="lineage-card svelte-1pb6yss"><div class="lineage-head svelte-1pb6yss"><strong class="svelte-1pb6yss">${escape_html(frame.successor.title)}</strong> <span class="relationship-pill svelte-1pb6yss">${escape_html(frame.successor.relationshipLabel)}</span></div> <p class="svelte-1pb6yss">${escape_html(frame.successor.summary)}</p> `);
      if (frame.successor.href) {
        $$renderer.push("<!--[0-->");
        $$renderer.push(`<a class="open-link svelte-1pb6yss"${attr("href", frame.successor.href)}>Open successor record</a>`);
      } else {
        $$renderer.push("<!--[-1-->");
        $$renderer.push(`<span class="open-link muted-link svelte-1pb6yss">Successor route not seeded yet</span>`);
      }
      $$renderer.push(`<!--]--></article>`);
    } else {
      $$renderer.push("<!--[-1-->");
    }
    $$renderer.push(`<!--]--></div>`);
  } else {
    $$renderer.push("<!--[-1-->");
  }
  $$renderer.push(`<!--]--> <p class="note-card svelte-1pb6yss">${escape_html(frame.inventoryNote)}</p> <p class="note-card svelte-1pb6yss">${escape_html(frame.permanenceNote)}</p></section>`);
  bind_props($$props, { lineage });
}
function ProjectConversionWorkflowSection($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let title = fallback($$props["title"], "Governed conversion workflow");
    let description = fallback($$props["description"], "Close requests that choose Convert stay visible here with the selected successor type, inherited inventory note, and the live vote state.");
    let items = fallback($$props["items"], () => [], true);
    let emptyMessage = fallback($$props["emptyMessage"], "No governed conversion requests are seeded for this project yet.");
    function tone(label) {
      const normalized = label.toLowerCase();
      if (normalized.includes("approved")) {
        return "approved";
      }
      if (normalized.includes("blocked")) {
        return "blocked";
      }
      return "pending";
    }
    $$renderer2.push(`<section class="workflow-stack svelte-x2kikw"><div class="section-heading"><h2 class="svelte-x2kikw">${escape_html(title)}</h2> <p class="svelte-x2kikw">${escape_html(description)}</p></div> `);
    if (items.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="empty-card svelte-x2kikw">${escape_html(emptyMessage)}</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="workflow-list svelte-x2kikw"><!--[-->`);
      const each_array = ensure_array_like(items);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let item = each_array[$$index];
        $$renderer2.push(`<article class="workflow-card svelte-x2kikw"><div class="workflow-head svelte-x2kikw"><div class="workflow-copy svelte-x2kikw"><h3 class="svelte-x2kikw">${escape_html(item.title)}</h3> <p class="svelte-x2kikw">${escape_html(item.summary)}</p></div> <span${attr_class(`status-pill ${tone(item.statusLabel)}`, "svelte-x2kikw")}>${escape_html(item.statusLabel)}</span></div> <div class="workflow-meta svelte-x2kikw"><span class="svelte-x2kikw">Requested by ${escape_html(item.requestedByUsername)}</span> <span class="svelte-x2kikw">${escape_html(item.createdAtLabel)}</span> <span class="relationship-pill svelte-x2kikw">${escape_html(item.outcomeLabel)}</span></div> <div class="detail-grid svelte-x2kikw"><div class="detail-card svelte-x2kikw"><span class="svelte-x2kikw">Successor target</span> <strong class="svelte-x2kikw">${escape_html(item.target.projectModeLabel)} · ${escape_html(item.target.projectSubtypeLabel)}</strong></div> <div class="detail-card svelte-x2kikw"><span class="svelte-x2kikw">Successor entry phase</span> <strong class="svelte-x2kikw">${escape_html(item.target.entryPhaseLabel)}</strong></div></div> <p class="inventory-note svelte-x2kikw">${escape_html(item.inventoryNote)}</p> <div class="vote-summary-row svelte-x2kikw"><span class="svelte-x2kikw">${escape_html(formatProjectVoteRequirement(item.voteSummary, item.approvalThresholdPercent))}</span> <span class="svelte-x2kikw">${escape_html(formatProjectVoteSummary(item.voteSummary))}</span></div> `);
        if (item.successor) {
          $$renderer2.push("<!--[0-->");
          if (item.successor.href) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<a class="open-link svelte-x2kikw"${attr("href", item.successor.href)}>Open planned successor record</a>`);
          } else {
            $$renderer2.push("<!--[-1-->");
            $$renderer2.push(`<span class="open-link muted-link svelte-x2kikw">Successor route not seeded yet</span>`);
          }
          $$renderer2.push(`<!--]-->`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></article>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></section>`);
    bind_props($$props, { title, description, items, emptyMessage });
  });
}
function ProjectFrameSections($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let title = fallback($$props["title"], "");
    let sections = fallback($$props["sections"], () => [], true);
    if (sections.length > 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<section class="frame-stack svelte-17hcvqt">`);
      if (title) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="section-heading"><h2 class="svelte-17hcvqt">${escape_html(title)}</h2></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="frame-grid svelte-17hcvqt"><!--[-->`);
      const each_array = ensure_array_like(sections);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let section = each_array[$$index];
        $$renderer2.push(`<article class="frame-card svelte-17hcvqt"><div class="frame-card-head svelte-17hcvqt"><strong class="svelte-17hcvqt">${escape_html(section.title)}</strong> `);
        if (section.statusLabel) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<span class="status-pill svelte-17hcvqt">${escape_html(section.statusLabel)}</span>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></div> <p class="svelte-17hcvqt">${escape_html(section.body)}</p></article>`);
      }
      $$renderer2.push(`<!--]--></div></section>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { title, sections });
  });
}
function ProjectLinksNetwork($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let title = fallback($$props["title"], "");
    let description = fallback($$props["description"], "");
    let items = fallback($$props["items"], () => [], true);
    let emptyMessage = fallback($$props["emptyMessage"], "No linked records yet.");
    $$renderer2.push(`<section class="network-stack svelte-1acoejn"><div class="section-heading"><h2 class="svelte-1acoejn">${escape_html(title)}</h2> `);
    if (description) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="svelte-1acoejn">${escape_html(description)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    if (items.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="empty-card svelte-1acoejn">${escape_html(emptyMessage)}</div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="link-grid svelte-1acoejn"><!--[-->`);
      const each_array = ensure_array_like(items);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let item = each_array[$$index];
        $$renderer2.push(`<article class="link-card svelte-1acoejn"><div class="link-head svelte-1acoejn"><strong class="svelte-1acoejn">${escape_html(item.title)}</strong> <span class="relationship-pill svelte-1acoejn">${escape_html(item.relationshipLabel)}</span></div> <p class="svelte-1acoejn">${escape_html(item.summary)}</p> `);
        if (item.href) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<a class="open-link svelte-1acoejn"${attr("href", item.href)}>Open linked record</a>`);
        } else {
          $$renderer2.push("<!--[-1-->");
          $$renderer2.push(`<span class="open-link muted svelte-1acoejn">Route not seeded yet</span>`);
        }
        $$renderer2.push(`<!--]--></article>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></section>`);
    bind_props($$props, { title, description, items, emptyMessage });
  });
}
function ProjectLinksTab($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let remainingSections;
    let frame = $$props["frame"];
    remainingSections = frame.placeholderSections.filter((section) => section.id !== "conversion-lineage");
    $$renderer2.push(`<section class="links-tab svelte-17ycbdn"><div class="intro-card svelte-17ycbdn"><h1 class="svelte-17ycbdn">Links</h1> <p class="svelte-17ycbdn">${escape_html(frame.intro)}</p> <p class="conversion-note svelte-17ycbdn">${escape_html(frame.conversionNote)}</p></div> `);
    ProjectLinksNetwork($$renderer2, {
      title: "Auto-created links",
      description: "These links will be generated by governance events such as approved asset-use relationships, completed deliveries, and future conversions.",
      items: frame.autoLinks,
      emptyMessage: "No auto-created links are seeded yet."
    });
    $$renderer2.push(`<!----> `);
    ProjectLinksNetwork($$renderer2, {
      title: "Manual links",
      description: "These seeded links already passed the required approval vote on both linked projects.",
      items: frame.manualLinks,
      emptyMessage: "No manual links are seeded yet."
    });
    $$renderer2.push(`<!----> `);
    ProjectManualLinkRequestsSection($$renderer2, { requests: frame.manualLinkRequests });
    $$renderer2.push(`<!----> `);
    ProjectConversionWorkflowSection($$renderer2, { items: frame.conversionWorkflow });
    $$renderer2.push(`<!----> `);
    RequestFrameStack($$renderer2, {
      title: "Related flow previews",
      description: "These fake records show how request and delivery flows will feed real project links later.",
      frames: frame.requestFrames
    });
    $$renderer2.push(`<!----> `);
    ProjectConversionLineageSection($$renderer2, { lineage: frame.conversionLineage });
    $$renderer2.push(`<!----> `);
    ProjectFrameSections($$renderer2, { title: "Planned link frames", sections: remainingSections });
    $$renderer2.push(`<!----></section>`);
    bind_props($$props, { frame });
  });
}
function ProjectOverviewHeader($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let combinedTags, signalSummary, membershipMetaLabel, membershipButtonLabel, quorumLabel;
    let data = $$props["data"];
    async function handleProjectShare(username) {
      const result = await shareProjectWithUser(data.slug, username);
      if (result.ok) {
        await invalidateAll();
      }
      return result;
    }
    async function handleCreatePostFromProject() {
      const mention = `[${data.title}]`;
      const params = new URLSearchParams({ prefill: `Sharing context from ${mention}` });
      await goto(`/create/post?${params.toString()}`);
    }
    combinedTags = [...data.channelTags, ...data.communityTags];
    signalSummary = data.lifecycle.phaseOne.signalSummary;
    membershipMetaLabel = "Members";
    membershipButtonLabel = isPersonalServiceProject(data.projectMode) ? `${data.viewerIsMember ? "Joined" : "Join"} · ${data.memberCount}` : `${data.memberCount}`;
    quorumLabel = data.lifecycle.quorumVotesRequired <= 0 ? "No votes required yet" : `${data.lifecycle.quorumVotesRequired} ${data.lifecycle.quorumVotesRequired === 1 ? "vote" : "votes"} required from ${data.lifecycle.voteContextPopulation} ${data.lifecycle.voteContextLabel}`;
    $$renderer2.push(`<div class="header-row svelte-1wx2oah"><div class="chips svelte-1wx2oah">`);
    SubjectTablet($$renderer2, { kind: "project", projectMode: data.projectMode });
    $$renderer2.push(`<!----></div> <div class="header-actions svelte-1wx2oah">`);
    TagList($$renderer2, { tags: combinedTags });
    $$renderer2.push(`<!----> `);
    ReportControl($$renderer2, {
      itemLabel: "project",
      report: data.report,
      ownerUsername: data.authorUsername,
      subjectId: data.id,
      targetId: data.id
    });
    $$renderer2.push(`<!----></div></div> <h1 class="svelte-1wx2oah">${escape_html(data.title)}</h1> <p class="overview-copy svelte-1wx2oah">${escape_html(data.description)}</p> <section class="meta-block svelte-1wx2oah" aria-label="Project overview details"><ul class="project-meta-list svelte-1wx2oah">`);
    if (supportsProjectDemandSignals(data.projectMode)) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<li class="meta-item demand-item svelte-1wx2oah"><strong class="svelte-1wx2oah">Signals</strong> <div class="signal-stack svelte-1wx2oah"><div class="meta-button-row svelte-1wx2oah"><button${attr("aria-pressed", data.lifecycle.phaseOne.viewerHasDemandSignal)}${attr_class("demand-button svelte-1wx2oah", void 0, {
        "active-demand": data.lifecycle.phaseOne.viewerHasDemandSignal
      })} type="button">Demand ${escape_html(signalSummary?.demandCount ?? data.signalCount)}</button> <button${attr("aria-pressed", data.lifecycle.phaseOne.viewerHasOppositionSignal)}${attr_class("demand-button opposition-button svelte-1wx2oah", void 0, {
        "active-opposition": data.lifecycle.phaseOne.viewerHasOppositionSignal
      })} type="button">Opposition ${escape_html(signalSummary?.oppositionCount ?? 0)}</button></div> `);
      if (signalSummary) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span class="svelte-1wx2oah">Demand is ${escape_html(signalSummary.signalRatioPercent)}% of current proposal signals. `);
        if (signalSummary.usesPlatformVoteContext) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`Proposal advancement also needs ${escape_html(signalSummary.requiredDemandCount)} demand signals from ${escape_html(signalSummary.voteContextPopulation)} weekly active users.`);
        } else {
          $$renderer2.push("<!--[-1-->");
          $$renderer2.push(`Proposal advancement opens once demand stays above 66% of active signals.`);
        }
        $$renderer2.push(`<!--]--></span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div></li>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.lifecycle.supportsPlanning) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<li class="meta-item svelte-1wx2oah"><strong class="svelte-1wx2oah">Quorum</strong> <span class="svelte-1wx2oah">${escape_html(quorumLabel)}</span></li>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.lifecycle.currentSubtypeLabel) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<li class="meta-item svelte-1wx2oah"><strong class="svelte-1wx2oah">Subtype</strong> <span class="svelte-1wx2oah">${escape_html(data.lifecycle.currentSubtypeLabel)}</span></li>`);
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
    $$renderer2.push(`<!--]--> <li class="meta-item svelte-1wx2oah"><strong class="svelte-1wx2oah">${escape_html(membershipMetaLabel)}</strong> <div class="meta-button-row svelte-1wx2oah">`);
    if (data.viewerCanToggleMembership) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button${attr("aria-pressed", data.viewerIsMember)}${attr_class("demand-button svelte-1wx2oah", void 0, { "active-demand": data.viewerIsMember })} type="button">${escape_html(membershipButtonLabel)}</button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<span class="svelte-1wx2oah">${escape_html(data.memberCount)}</span>`);
    }
    $$renderer2.push(`<!--]--> `);
    if (data.viewerCanShare) {
      $$renderer2.push("<!--[0-->");
      ShareUserMenu($$renderer2, {
        buttonLabel: "Share +",
        contacts: data.shareContacts,
        menuTitle: "Share project",
        placeholder: "Type a username",
        submitLabel: "Share",
        submitShare: handleProjectShare,
        createPost: handleCreatePostFromProject,
        createPostLabel: "Create post"
      });
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div></li></ul></section>`);
    bind_props($$props, { data });
  });
}
function ProjectUpdatesSection($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let showMembershipButton, canPostDirectUpdate, canRequestUpdate, canEditDirect, canRequestEdit, updateActionLabel, editActionLabel;
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
      await setProjectUpdateVote(data.slug, requestId, vote);
      await invalidateAll();
    }
    async function voteOnEditRequest(requestId, vote) {
      await setProjectEditVote(data.slug, requestId, vote);
      await invalidateAll();
    }
    showMembershipButton = !isPersonalServiceProject(data.projectMode);
    canPostDirectUpdate = isPersonalServiceProject(data.projectMode) && data.viewerIsProjectManager;
    canRequestUpdate = canPostDirectUpdate || data.viewerCanRequestUpdate;
    canEditDirect = isPersonalServiceProject(data.projectMode) && data.viewerIsProjectManager;
    canRequestEdit = canEditDirect || data.viewerCanRequestEdit;
    updateActionLabel = isPersonalServiceProject(data.projectMode) ? "Post update" : "Propose update";
    editActionLabel = isPersonalServiceProject(data.projectMode) ? "Save details" : "Propose edit";
    $$renderer2.push(`<section class="updates-shell svelte-13uefs6" id="updates"><div class="updates-title-row svelte-13uefs6"><h2 class="svelte-13uefs6">Updates</h2> `);
    if (data.updateRequests.length > 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button class="vote-chip notice-chip svelte-13uefs6" type="button">Vote Active `);
      CountBadge($$renderer2, { count: data.updateRequests.length });
      $$renderer2.push(`<!----></button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (canRequestUpdate) {
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
    if (canRequestUpdate && showUpdateComposer) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="composer-card svelte-13uefs6"><label class="field-stack svelte-13uefs6"><span class="field-label svelte-13uefs6">Update</span> <textarea rows="4" placeholder="Share what changed on this project..." class="svelte-13uefs6">`);
      const $$body = escape_html(draftUpdateBody);
      if ($$body) {
        $$renderer2.push(`${$$body}`);
      }
      $$renderer2.push(`</textarea></label> <div class="composer-actions svelte-13uefs6"><button class="secondary-button svelte-13uefs6" type="button">Cancel</button> <button class="primary-button svelte-13uefs6"${attr("disabled", updatePending, true)} type="button">${escape_html(updateActionLabel)}</button></div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (showUpdateVotes && data.updateRequests.length > 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="surface-stack svelte-13uefs6"><!--[-->`);
      const each_array = ensure_array_like(data.updateRequests);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let request = each_array[$$index];
        $$renderer2.push(`<article class="surface-card vote-request-card svelte-13uefs6"><div class="vote-card-top svelte-13uefs6"><div class="vote-card-copy svelte-13uefs6"><span class="vote-kicker svelte-13uefs6">Update decision</span></div> <span class="vote-requirement svelte-13uefs6">${escape_html(formatProjectVoteRequirement(request.voteSummary, request.approvalThresholdPercent))}</span></div> <p class="svelte-13uefs6">${escape_html(request.body)}</p> <div class="vote-summary-row svelte-13uefs6"><span class="svelte-13uefs6">${escape_html(formatProjectVoteSummary(request.voteSummary))}</span></div> `);
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
    $$renderer2.push(`<!--]--> <div${attr_class("stack updates-list svelte-13uefs6", void 0, { "scrollable": data.updates.length > 4 })}>`);
    if (data.updates.length === 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="empty-card svelte-13uefs6"><p class="svelte-13uefs6">No updates yet.</p></div>`);
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
    if (canRequestEdit && showEditComposer) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="composer-card svelte-13uefs6"><label class="field-stack svelte-13uefs6"><span class="field-label svelte-13uefs6">Title</span> <input${attr("value", draftEditTitle)} maxlength="120" placeholder="Project title" class="svelte-13uefs6"/></label> <label class="field-stack svelte-13uefs6"><span class="field-label svelte-13uefs6">Description</span> <textarea rows="5" placeholder="Describe the project..." class="svelte-13uefs6">`);
      const $$body_1 = escape_html(draftEditDescription);
      if ($$body_1) {
        $$renderer2.push(`${$$body_1}`);
      }
      $$renderer2.push(`</textarea></label> <div class="composer-actions svelte-13uefs6"><button class="secondary-button svelte-13uefs6" type="button">Cancel</button> <button class="primary-button svelte-13uefs6"${attr("disabled", editPending, true)} type="button">${escape_html(editActionLabel)}</button></div></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (showEditVotes && data.editRequests.length > 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="surface-stack svelte-13uefs6"><!--[-->`);
      const each_array_2 = ensure_array_like(data.editRequests);
      for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
        let request = each_array_2[$$index_2];
        $$renderer2.push(`<article class="surface-card vote-request-card svelte-13uefs6"><div class="vote-card-top svelte-13uefs6"><div class="vote-card-copy svelte-13uefs6"><span class="vote-kicker svelte-13uefs6">Edit decision</span></div> <span class="vote-requirement svelte-13uefs6">${escape_html(formatProjectVoteRequirement(request.voteSummary, request.approvalThresholdPercent))}</span></div> <div class="edit-request-copy svelte-13uefs6"><p class="svelte-13uefs6">${escape_html(request.description)}</p></div> <div class="vote-summary-row svelte-13uefs6"><span class="svelte-13uefs6">${escape_html(formatProjectVoteSummary(request.voteSummary))}</span></div> `);
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
    $$renderer2.push(`<!--]--> <div class="overview-footer-row svelte-13uefs6">`);
    VoteStrip($$renderer2, { activeVote: data.activeVote, count: data.voteCount });
    $$renderer2.push(`<!----> `);
    if (showMembershipButton) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button${attr("aria-expanded", showMembersPanel)}${attr_class("secondary-button member-toggle-button svelte-13uefs6", void 0, { "active-toggle": showMembersPanel })} type="button">Members</button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (canRequestEdit) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button${attr("aria-expanded", showEditComposer)}${attr_class("secondary-button member-toggle-button svelte-13uefs6", void 0, { "active-toggle": showEditComposer })} type="button">Edit details</button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.editRequests.length > 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button class="vote-chip notice-chip svelte-13uefs6" type="button">Vote Active `);
      CountBadge($$renderer2, { count: data.editRequests.length });
      $$renderer2.push(`<!----></button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <span class="footer-author-row svelte-13uefs6"><a class="inline-link svelte-13uefs6"${attr("href", `/profile/${data.authorUsername}`)}>${escape_html(data.authorUsername)}</a> · ${escape_html(formatRelativeTime(data.createdAt))}</span></div></section>`);
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
        const requestedTab = store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("tab");
        activeTab = highlightedCommentId ? "chat" : requestedTab === "inventory" && !!data.inventoryFrame ? "inventory" : requestedTab === "links" ? "links" : requestedTab === "history" ? "history" : requestedTab === "chat" ? "chat" : "overview";
      }
    }
    if (isPersonalServiceProject(data.projectMode) && showMembersPanel) ;
    $$renderer2.push(`<section class="page svelte-d9rl0p"><section class="hero-card svelte-d9rl0p"><div class="top-tab-row svelte-d9rl0p" role="tablist" aria-label="Project detail tabs"><button${attr_class("top-tab svelte-d9rl0p", void 0, { "active-tab": activeTab === "overview" })} role="tab" type="button">Overview</button> <button${attr_class("top-tab svelte-d9rl0p", void 0, { "active-tab": activeTab === "chat" })} role="tab" type="button">Chat</button> <button${attr_class("top-tab svelte-d9rl0p", void 0, { "active-tab": activeTab === "links" })} role="tab" type="button">Links</button> `);
    if (data.inventoryFrame) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<button${attr_class("top-tab svelte-d9rl0p", void 0, { "active-tab": activeTab === "inventory" })} role="tab" type="button">Inventory</button>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <button${attr_class("top-tab svelte-d9rl0p", void 0, { "active-tab": activeTab === "history" })} role="tab" type="button">History</button></div> `);
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
    } else if (activeTab === "chat") {
      $$renderer2.push("<!--[1-->");
      ProjectChatTab($$renderer2, { data, highlightedCommentId });
    } else if (activeTab === "links") {
      $$renderer2.push("<!--[2-->");
      ProjectLinksTab($$renderer2, { frame: data.linksFrame });
    } else if (activeTab === "inventory" && data.inventoryFrame) {
      $$renderer2.push("<!--[3-->");
      ProjectInventoryTab($$renderer2, { frame: data.inventoryFrame });
    } else {
      $$renderer2.push("<!--[-1-->");
      ProjectHistoryTab($$renderer2, { data });
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
