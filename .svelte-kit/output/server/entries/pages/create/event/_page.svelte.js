import "clsx";
import { f as fallback, e as escape_html, a as ensure_array_like, c as attr, d as bind_props, s as store_get, u as unsubscribe_stores } from "../../../../chunks/renderer.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/root.js";
import "../../../../chunks/state.svelte.js";
import { p as page } from "../../../../chunks/stores.js";
import { E as EventCard } from "../../../../chunks/EventCard.js";
import { a as CreatePanel, C as CreateFlowLayout } from "../../../../chunks/CreatePanel.js";
import "../../../../chunks/data.js";
function CreateEventAudienceSelector($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let label = $$props["label"];
    let placeholder = $$props["placeholder"];
    let helperText = fallback($$props["helperText"], "");
    let query = fallback($$props["query"], "");
    let selectedItems = fallback($$props["selectedItems"], () => [], true);
    let suggestionItems = fallback($$props["suggestionItems"], () => [], true);
    let onAdd = fallback($$props["onAdd"], () => {
    });
    let onRemove = fallback($$props["onRemove"], () => {
    });
    let onCommitSingleSuggestion = fallback($$props["onCommitSingleSuggestion"], () => {
    });
    $$renderer2.push(`<div><span class="field-label svelte-1j8hwp3">${escape_html(label)}</span> <div class="token-input-stack svelte-1j8hwp3"><div class="chip-row wrap-row svelte-1j8hwp3"><!--[-->`);
    const each_array = ensure_array_like(selectedItems);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let item = each_array[$$index];
      $$renderer2.push(`<button class="toggle-chip active" type="button">${escape_html(item.label)} x</button>`);
    }
    $$renderer2.push(`<!--]--></div> <input${attr("value", query)}${attr("placeholder", placeholder)}/> `);
    if (suggestionItems.length > 0) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="suggestion-row svelte-1j8hwp3"><!--[-->`);
      const each_array_1 = ensure_array_like(suggestionItems);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let item = each_array_1[$$index_1];
        $$renderer2.push(`<button class="suggestion-chip svelte-1j8hwp3" type="button">${escape_html(item.label)}</button>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div> `);
    if (helperText) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="helper-text svelte-1j8hwp3">${escape_html(helperText)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, {
      label,
      placeholder,
      helperText,
      query,
      selectedItems,
      suggestionItems,
      onAdd,
      onRemove,
      onCommitSingleSuggestion
    });
  });
}
function CreateEventVisibilityPanel($$renderer, $$props) {
  let privateCommunityLabel = fallback($$props["privateCommunityLabel"], null);
  let personalInviteOnly = fallback($$props["personalInviteOnly"], false);
  CreatePanel($$renderer, {
    title: "Visibility rule",
    description: "How discovery works in this frontend slice.",
    children: ($$renderer2) => {
      $$renderer2.push(`<p class="helper-text svelte-12ucxc6">`);
      if (privateCommunityLabel) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`Private events can live inside a single private community without leaking into Public.`);
      } else if (personalInviteOnly) {
        $$renderer2.push("<!--[1-->");
        $$renderer2.push(`Private personal events stay invite-only when they are only tied to directly added people.`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`Public events need at least one channel tag. Public communities can be added too, but they cannot be the only tag.`);
      }
      $$renderer2.push(`<!--]--></p>`);
    },
    $$slots: { default: true }
  });
  bind_props($$props, { privateCommunityLabel, personalInviteOnly });
}
function CreateEventPage($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let viewer, channelSuggestionPool, communitySuggestionPool, peopleSuggestionPool, selectedCommunityOptions, privateCommunity, personalInviteOnly, isPrivate, publicEventNeedsChannelTag, normalizedChannelQuery, normalizedCommunityQuery, normalizedPeopleQuery, channelSuggestions, communitySuggestions, peopleSuggestions, selectedChannelItems, selectedCommunityItems, selectedInviteeItems, channelSuggestionItems, communitySuggestionItems, peopleSuggestionItems, previewItem, canSubmit;
    let title = "";
    let description = "";
    let selectedChannelIds = [];
    let selectedCommunityIds = [];
    let invitedUsernames = [];
    let channelQuery = "";
    let communityQuery = "";
    let peopleQuery = "";
    let isSubmitting = false;
    function selectedScopeTags(selectedSlugs, options, kind) {
      return selectedSlugs.map((slug) => options.find((option) => option.slug === slug)).filter((option) => !!option).map((option) => ({ slug: option.slug, label: option.label, kind }));
    }
    function matchesQuery(option, normalizedQuery) {
      return option.label.toLowerCase().includes(normalizedQuery) || option.slug.toLowerCase().includes(normalizedQuery);
    }
    function addChannelTag(slug) {
      if (selectedChannelIds.includes(slug)) {
        return;
      }
      selectedChannelIds = [...selectedChannelIds, slug];
      channelQuery = "";
    }
    function removeChannelTag(slug) {
      selectedChannelIds = selectedChannelIds.filter((value) => value !== slug);
    }
    function addCommunityTag(slug) {
      if (selectedCommunityIds.includes(slug)) {
        return;
      }
      selectedCommunityIds = [...selectedCommunityIds, slug];
      communityQuery = "";
    }
    function removeCommunityTag(slug) {
      selectedCommunityIds = selectedCommunityIds.filter((value) => value !== slug);
    }
    function addPerson(username) {
      if (invitedUsernames.includes(username)) {
        return;
      }
      invitedUsernames = [...invitedUsernames, username];
      peopleQuery = "";
    }
    function removePerson(username) {
      invitedUsernames = invitedUsernames.filter((value) => value !== username);
    }
    function commitSingleSuggestion(event, suggestions, handler) {
      if (event.key === "Enter" && suggestions.length === 1) {
        event.preventDefault();
        handler(suggestions[0]);
      }
    }
    viewer = store_get($$store_subs ??= {}, "$page", page).data.bootstrap?.viewer ?? null;
    channelSuggestionPool = store_get($$store_subs ??= {}, "$page", page).data.bootstrap?.directory.channels ?? [];
    communitySuggestionPool = store_get($$store_subs ??= {}, "$page", page).data.bootstrap?.directory.communities ?? [];
    peopleSuggestionPool = store_get($$store_subs ??= {}, "$page", page).data.bootstrap?.suggestedContacts ?? [];
    selectedCommunityOptions = communitySuggestionPool.filter((option) => selectedCommunityIds.includes(option.slug));
    privateCommunity = selectedChannelIds.length === 0 && selectedCommunityOptions.length === 1 && selectedCommunityOptions[0]?.visibility === "private" ? selectedCommunityOptions[0] : null;
    personalInviteOnly = selectedChannelIds.length === 0 && selectedCommunityIds.length === 0 && invitedUsernames.length > 0;
    isPrivate = !!privateCommunity || personalInviteOnly;
    publicEventNeedsChannelTag = !isPrivate && selectedChannelIds.length === 0;
    normalizedChannelQuery = channelQuery.trim().toLowerCase();
    normalizedCommunityQuery = communityQuery.trim().toLowerCase();
    normalizedPeopleQuery = peopleQuery.trim().toLowerCase();
    channelSuggestions = normalizedChannelQuery ? channelSuggestionPool.filter((option) => matchesQuery(option, normalizedChannelQuery)).filter((option) => !selectedChannelIds.includes(option.slug)).slice(0, 6) : [];
    communitySuggestions = normalizedCommunityQuery ? communitySuggestionPool.filter((option) => matchesQuery(option, normalizedCommunityQuery)).filter((option) => !selectedCommunityIds.includes(option.slug)).slice(0, 6) : [];
    peopleSuggestions = normalizedPeopleQuery ? peopleSuggestionPool.filter((contact) => contact.username.toLowerCase().includes(normalizedPeopleQuery)).filter((contact) => !invitedUsernames.includes(contact.username)).slice(0, 6) : [];
    selectedChannelItems = selectedChannelIds.map((slug) => channelSuggestionPool.find((option) => option.slug === slug)).filter((option) => !!option).map((option) => ({ key: option.slug, label: option.label }));
    selectedCommunityItems = selectedCommunityIds.map((slug) => communitySuggestionPool.find((option) => option.slug === slug)).filter((option) => !!option).map((option) => ({
      key: option.slug,
      label: `${option.label}${option.visibility === "private" ? " (Private)" : ""}`
    }));
    selectedInviteeItems = invitedUsernames.map((username) => ({ key: username, label: username }));
    channelSuggestionItems = channelSuggestions.map((option) => ({ key: option.slug, label: option.label }));
    communitySuggestionItems = communitySuggestions.map((option) => ({
      key: option.slug,
      label: `${option.label}${option.visibility === "private" ? " (Private)" : ""}`
    }));
    peopleSuggestionItems = peopleSuggestions.map((contact) => ({ key: contact.username, label: contact.username }));
    previewItem = viewer ? {
      kind: "event",
      id: "event-preview",
      slug: "event-preview",
      href: "#",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      title: title.trim() || "Untitled event",
      description: description.trim() || "Describe the proposal, who it is for, and what an approved event plan should turn into.",
      isPrivate,
      channelTags: selectedScopeTags(selectedChannelIds, channelSuggestionPool, "channel"),
      communityTags: selectedScopeTags(selectedCommunityIds, communitySuggestionPool, "community"),
      createdByUsername: viewer.username,
      timeLabel: "",
      locationLabel: "",
      voteCount: 0,
      activeVote: 0,
      commentCount: 0,
      goingCount: 1,
      lastActivityAt: (/* @__PURE__ */ new Date()).toISOString()
    } : null;
    canSubmit = title.trim().length > 0 && description.trim().length > 0 && !publicEventNeedsChannelTag;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      CreateFlowLayout($$renderer3, {
        $$slots: {
          primary: ($$renderer4) => {
            {
              CreatePanel($$renderer4, {
                title: "Event proposal",
                description: "Privacy is derived from the tags and invitees you choose. The event starts as a proposal; time, date, and location are added by the approved event plan before activity begins.",
                children: ($$renderer5) => {
                  $$renderer5.push(`<form class="form-stack svelte-1bjugoy"><div><span class="field-label svelte-1bjugoy">Visibility</span> <p class="helper-text svelte-1bjugoy">`);
                  if (privateCommunity) {
                    $$renderer5.push("<!--[0-->");
                    $$renderer5.push(`Private because this event is tagged only to the private ${escape_html(privateCommunity.label)} community.`);
                  } else if (personalInviteOnly) {
                    $$renderer5.push("<!--[1-->");
                    $$renderer5.push(`Private because it only includes directly added people and no channel or community tags.`);
                  } else {
                    $$renderer5.push("<!--[-1-->");
                    $$renderer5.push(`Public because it is discoverable through its tags or has no private-only audience.`);
                  }
                  $$renderer5.push(`<!--]--></p></div> <label><span class="field-label svelte-1bjugoy">Event title</span> <input${attr("value", title)}/></label> <label><span class="field-label svelte-1bjugoy">Proposal description</span> <textarea rows="4">`);
                  const $$body = escape_html(description);
                  if ($$body) {
                    $$renderer5.push(`${$$body}`);
                  }
                  $$renderer5.push(`</textarea></label> `);
                  CreateEventAudienceSelector($$renderer5, {
                    label: "Channel tags",
                    placeholder: "Type to add a channel tag",
                    selectedItems: selectedChannelItems,
                    suggestionItems: channelSuggestionItems,
                    onAdd: addChannelTag,
                    onRemove: removeChannelTag,
                    onCommitSingleSuggestion: commitSingleSuggestion,
                    get query() {
                      return channelQuery;
                    },
                    set query($$value) {
                      channelQuery = $$value;
                      $$settled = false;
                    }
                  });
                  $$renderer5.push(`<!----> `);
                  CreateEventAudienceSelector($$renderer5, {
                    label: "Community tags",
                    placeholder: "Type to add a community tag",
                    selectedItems: selectedCommunityItems,
                    suggestionItems: communitySuggestionItems,
                    onAdd: addCommunityTag,
                    onRemove: removeCommunityTag,
                    onCommitSingleSuggestion: commitSingleSuggestion,
                    get query() {
                      return communityQuery;
                    },
                    set query($$value) {
                      communityQuery = $$value;
                      $$settled = false;
                    }
                  });
                  $$renderer5.push(`<!----> `);
                  CreateEventAudienceSelector($$renderer5, {
                    label: "Add personal people",
                    placeholder: "Type to add people",
                    helperText: "Personal invitees only make the event private when you do not also tag a channel or community.",
                    selectedItems: selectedInviteeItems,
                    suggestionItems: peopleSuggestionItems,
                    onAdd: addPerson,
                    onRemove: removePerson,
                    onCommitSingleSuggestion: commitSingleSuggestion,
                    get query() {
                      return peopleQuery;
                    },
                    set query($$value) {
                      peopleQuery = $$value;
                      $$settled = false;
                    }
                  });
                  $$renderer5.push(`<!----> <div class="button-row"><button class="button-primary"${attr("disabled", !canSubmit || isSubmitting, true)} type="submit">${escape_html("Create Event")}</button> <button class="button-ghost" type="button">Save Draft</button></div> `);
                  {
                    $$renderer5.push("<!--[-1-->");
                  }
                  $$renderer5.push(`<!--]--></form>`);
                },
                $$slots: { default: true }
              });
            }
          },
          secondary: ($$renderer4) => {
            {
              CreatePanel($$renderer4, {
                title: "Live preview",
                description: "Shows how the proposal will appear in feeds and search before a plan adds schedule and location.",
                surface: "transparent",
                children: ($$renderer5) => {
                  if (previewItem) {
                    $$renderer5.push("<!--[0-->");
                    EventCard($$renderer5, { item: previewItem });
                  } else {
                    $$renderer5.push("<!--[-1-->");
                  }
                  $$renderer5.push(`<!--]-->`);
                },
                $$slots: { default: true }
              });
              $$renderer4.push(`<!----> `);
              CreateEventVisibilityPanel($$renderer4, {
                privateCommunityLabel: privateCommunity?.label ?? null,
                personalInviteOnly
              });
              $$renderer4.push(`<!---->`);
            }
          }
        }
      });
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function _page($$renderer) {
  CreateEventPage($$renderer);
}
export {
  _page as default
};
