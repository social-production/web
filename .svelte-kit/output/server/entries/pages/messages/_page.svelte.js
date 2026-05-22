import { b as attr_class, c as attr, e as escape_html, a as ensure_array_like, d as bind_props } from "../../../chunks/renderer.js";
import { i as invalidateAll } from "../../../chunks/client.js";
import { L as LiveChatPanel } from "../../../chunks/LiveChatPanel.js";
import { A as AvatarBadge } from "../../../chunks/AvatarBadge.js";
import { P as PageHeader } from "../../../chunks/PageHeader.js";
import { R as RoundPlusButton } from "../../../chunks/RoundPlusButton.js";
import { l as addComment } from "../../../chunks/details.js";
import { s as sendMessage } from "../../../chunks/inbox.js";
import { a as formatRelativeTime } from "../../../chunks/time.js";
function MessagesPage($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let activeConversation, activeLinkedChat, activeConversationMessages, directConversationPartner, normalizedRecipientQuery, normalizedGroupQuery, directSuggestions, groupSuggestions, addableGroupMembers, removableGroupMembers;
    let data = $$props["data"];
    let activeConversationId = null;
    let activeLinkedChatId = null;
    let activeListTab = "messages";
    let showComposer = false;
    let composerMode = "direct";
    let recipientDraft = "";
    let groupTitleDraft = "";
    let groupMemberDraft = "";
    let selectedGroupMembers = [];
    let composerDraft = "";
    let composerError = "";
    let showGroupOptions = false;
    let showAddMembers = false;
    let showRemoveMembers = false;
    let showDirectOptions = false;
    let renameDraft = "";
    let groupSettingsFeedback = "";
    let groupSettingsTone = "success";
    let directOptionsFeedback = "";
    let titleSyncKey = "";
    function linkedChatMeta(chat) {
      return `${chat.kind === "project" ? "Project chat" : "Event chat"} · ${chat.meta}`;
    }
    async function submitConversationMessage(body) {
      if (!activeConversation) {
        return;
      }
      await sendMessage(activeConversation.id, body);
      await invalidateAll();
    }
    async function submitLinkedChatMessage(body) {
      if (!activeLinkedChat) {
        return;
      }
      await addComment(activeLinkedChat.subjectId, body);
      await invalidateAll();
    }
    function resetComposer() {
      composerMode = "direct";
      recipientDraft = "";
      groupTitleDraft = "";
      groupMemberDraft = "";
      selectedGroupMembers = [];
      composerDraft = "";
      composerError = "";
    }
    function toggleComposer() {
      showComposer = !showComposer;
      composerError = "";
      if (!showComposer) {
        resetComposer();
      }
    }
    function handleComposeTrigger() {
      toggleComposer();
    }
    activeConversation = data.conversations.find((conversation) => conversation.id === activeConversationId) ?? null;
    activeLinkedChat = data.linkedChats.find((chat) => chat.id === activeLinkedChatId) ?? null;
    activeConversationMessages = activeConversation ? activeConversation.messages.map((message) => ({
      id: message.id,
      authorUsername: message.sender.username,
      body: message.body,
      createdAt: message.createdAt,
      isOwn: message.isOwn,
      report: message.report ?? null,
      showAuthor: activeConversation.kind === "group"
    })) : [];
    directConversationPartner = activeConversation?.kind === "direct" ? activeConversation.participants.find((participant) => participant.id !== data.viewer.id) ?? activeConversation.participants[0] ?? null : null;
    normalizedRecipientQuery = recipientDraft.trim().toLowerCase();
    if (activeConversation?.kind === "group") {
      const nextKey = `${activeConversation.id}:${activeConversation.title}`;
      if (nextKey !== titleSyncKey) {
        renameDraft = activeConversation.title;
        titleSyncKey = nextKey;
      }
    } else if (titleSyncKey) {
      titleSyncKey = "";
      renameDraft = "";
      showGroupOptions = false;
      showAddMembers = false;
      showRemoveMembers = false;
      showDirectOptions = false;
      groupMemberDraft = "";
      groupSettingsFeedback = "";
      directOptionsFeedback = "";
    }
    normalizedGroupQuery = groupMemberDraft.trim().toLowerCase();
    directSuggestions = data.suggestedContacts.filter((contact) => contact.id !== data.viewer.id && (normalizedRecipientQuery ? contact.username.toLowerCase().includes(normalizedRecipientQuery) : true));
    groupSuggestions = data.suggestedContacts.filter((contact) => contact.id !== data.viewer.id && !selectedGroupMembers.includes(contact.username) && (normalizedGroupQuery ? contact.username.toLowerCase().includes(normalizedGroupQuery) : true));
    addableGroupMembers = activeConversation?.kind === "group" ? data.suggestedContacts.filter((contact) => contact.id !== data.viewer.id && !activeConversation.participants.some((participant) => participant.id === contact.id) && (normalizedGroupQuery ? contact.username.toLowerCase().includes(normalizedGroupQuery) : true)) : [];
    removableGroupMembers = activeConversation?.kind === "group" ? activeConversation.participants.filter((participant) => participant.id !== data.viewer.id) : [];
    $$renderer2.push(`<section${attr_class("page svelte-1vfruch", void 0, {
      "conversation-page": !!activeConversation || !!activeLinkedChat
    })}>`);
    if (!activeConversation && !activeLinkedChat) {
      $$renderer2.push("<!--[0-->");
      PageHeader($$renderer2, {
        title: "Messages",
        description: "Direct messages, group chats, and the same project or event chat rooms you already use elsewhere."
      });
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <section${attr_class("messages-shell svelte-1vfruch", void 0, {
      "composer-open": !activeConversation && !activeLinkedChat && showComposer && activeListTab === "messages",
      "conversation-view": !!activeConversation || !!activeLinkedChat,
      "list-view": !activeConversation && !activeLinkedChat,
      "with-chat-options": !!activeConversation && (activeConversation.kind === "group" && showGroupOptions || activeConversation.kind === "direct" && showDirectOptions && !!directConversationPartner)
    })}>`);
    if (activeConversation || activeLinkedChat) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<header class="chat-header svelte-1vfruch"><button class="back-button svelte-1vfruch" type="button">Back</button> `);
      if (activeConversation) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<div class="chat-identity svelte-1vfruch">`);
        if (activeConversation.kind === "group") {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<button${attr("aria-expanded", showGroupOptions)} class="identity-trigger svelte-1vfruch" type="button"><div><h2 class="svelte-1vfruch">${escape_html(activeConversation.title)}</h2> <p class="identity-note svelte-1vfruch">Group chat settings</p></div> `);
          AvatarBadge($$renderer2, { size: "md", username: activeConversation.title });
          $$renderer2.push(`<!----></button>`);
        } else {
          $$renderer2.push("<!--[-1-->");
          $$renderer2.push(`<button${attr("aria-expanded", showDirectOptions)} class="identity-trigger svelte-1vfruch" type="button"><div><h2 class="svelte-1vfruch">${escape_html(activeConversation.title)}</h2></div> `);
          AvatarBadge($$renderer2, { size: "md", username: activeConversation.title });
          $$renderer2.push(`<!----></button>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      } else if (activeLinkedChat) {
        $$renderer2.push("<!--[1-->");
        $$renderer2.push(`<div class="chat-identity linked-chat-identity svelte-1vfruch"><div><h2>${escape_html(activeLinkedChat.title)}</h2> <p class="identity-note svelte-1vfruch">${escape_html(linkedChatMeta(activeLinkedChat))}</p></div> <a class="secondary-button open-source-link svelte-1vfruch"${attr("href", activeLinkedChat.href)}>Open source page</a></div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></header> `);
      if (activeConversation?.kind === "group" && showGroupOptions) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<section class="group-settings-card in-shell-settings-card svelte-1vfruch"><label class="composer-field svelte-1vfruch"><span class="svelte-1vfruch">Group name</span> <div class="inline-field svelte-1vfruch"><input${attr("value", renameDraft)} placeholder="Rename group chat" type="text" class="svelte-1vfruch"/> <button class="secondary-button svelte-1vfruch" type="button">Save</button></div></label> <div class="composer-field svelte-1vfruch"><span class="svelte-1vfruch">Members</span> <div class="member-links svelte-1vfruch"><!--[-->`);
        const each_array = ensure_array_like(removableGroupMembers);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let member = each_array[$$index];
          $$renderer2.push(`<a class="member-link svelte-1vfruch"${attr("href", `/profile/${member.username}`)}>${escape_html(member.username)}</a>`);
        }
        $$renderer2.push(`<!--]--></div></div> <div class="contact-list svelte-1vfruch"><button${attr_class("contact-chip svelte-1vfruch", void 0, { "active": showAddMembers })} type="button">Add member</button> <button${attr_class("contact-chip svelte-1vfruch", void 0, { "active": showRemoveMembers })} type="button">Remove member</button></div> `);
        if (showAddMembers) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="composer-field svelte-1vfruch"><span class="svelte-1vfruch">Add someone</span> <input${attr("value", groupMemberDraft)} list="message-contacts" placeholder="Type a username" type="text" class="svelte-1vfruch"/> `);
          if (addableGroupMembers.length > 0) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<div class="contact-list svelte-1vfruch"><!--[-->`);
            const each_array_1 = ensure_array_like(addableGroupMembers);
            for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
              let member = each_array_1[$$index_1];
              $$renderer2.push(`<button class="contact-chip svelte-1vfruch" type="button">${escape_html(member.username)}</button>`);
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
        if (showRemoveMembers) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="composer-field svelte-1vfruch"><span class="svelte-1vfruch">Remove someone</span> <div class="contact-list svelte-1vfruch"><!--[-->`);
          const each_array_2 = ensure_array_like(removableGroupMembers);
          for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
            let member = each_array_2[$$index_2];
            $$renderer2.push(`<button class="contact-chip svelte-1vfruch" type="button">${escape_html(member.username)}</button>`);
          }
          $$renderer2.push(`<!--]--></div></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (groupSettingsFeedback) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<p${attr_class("composer-feedback svelte-1vfruch", void 0, { "success": groupSettingsTone === "success" })}>${escape_html(groupSettingsFeedback)}</p>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></section>`);
      } else if (activeConversation?.kind === "direct" && showDirectOptions && directConversationPartner) {
        $$renderer2.push("<!--[1-->");
        $$renderer2.push(`<section class="profile-actions-card in-shell-settings-card svelte-1vfruch"><div class="composer-field svelte-1vfruch"><span class="svelte-1vfruch">Conversation actions</span> <div class="member-links svelte-1vfruch"><a class="member-link svelte-1vfruch"${attr("href", `/profile/${directConversationPartner.username}`)}>Open @${escape_html(directConversationPartner.username)}</a> <button class="contact-chip svelte-1vfruch" type="button">Mute</button> <button class="contact-chip svelte-1vfruch" type="button">Block</button></div></div> `);
        if (directOptionsFeedback) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<p class="composer-feedback svelte-1vfruch">${escape_html(directOptionsFeedback)}</p>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></section>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (activeConversation) {
        $$renderer2.push("<!--[0-->");
        LiveChatPanel($$renderer2, {
          embedded: true,
          emptyCopy: "No messages yet.",
          messages: activeConversationMessages,
          onSubmitMessage: submitConversationMessage,
          placeholder: "Write a message...",
          showHeader: false,
          subjectId: activeConversation.id,
          submitLabel: "Send",
          variant: "message"
        });
      } else if (activeLinkedChat) {
        $$renderer2.push("<!--[1-->");
        LiveChatPanel($$renderer2, {
          comments: activeLinkedChat.comments,
          embedded: true,
          emptyCopy: activeLinkedChat.kind === "project" ? "No project chat yet." : "No event chat yet.",
          onSubmitMessage: submitLinkedChatMessage,
          placeholder: activeLinkedChat.kind === "project" ? "Message the project..." : "Message members...",
          showHeader: false,
          subjectId: activeLinkedChat.subjectId,
          submitLabel: "Send"
        });
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<div class="surface-tabs svelte-1vfruch" role="tablist" aria-label="Messages tabs"><div class="surface-tab-list svelte-1vfruch"><button${attr_class("surface-tab svelte-1vfruch", void 0, { "active": activeListTab === "messages" })} role="tab" type="button">Direct &amp; Group</button> <button${attr_class("surface-tab svelte-1vfruch", void 0, { "active": activeListTab === "linked-chats" })} role="tab" type="button">Project &amp; Event Chats</button></div> `);
      RoundPlusButton($$renderer2, {
        active: showComposer,
        ariaLabel: "Start a new message",
        action: handleComposeTrigger
      });
      $$renderer2.push(`<!----></div> `);
      if (showComposer) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<section class="new-conversation-card svelte-1vfruch"><div class="composer-mode-row svelte-1vfruch"><button${attr_class("contact-chip svelte-1vfruch", void 0, { "active": composerMode === "direct" })} type="button">Direct message</button> <button${attr_class("contact-chip svelte-1vfruch", void 0, { "active": composerMode === "group" })} type="button">Group chat</button></div> `);
        if (composerMode === "direct") {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<label class="composer-field svelte-1vfruch"><span class="svelte-1vfruch">To</span> <input${attr("value", recipientDraft)} list="message-contacts" placeholder="Type a username" type="text" class="svelte-1vfruch"/></label>`);
        } else {
          $$renderer2.push("<!--[-1-->");
          $$renderer2.push(`<label class="composer-field svelte-1vfruch"><span class="svelte-1vfruch">Group chat name</span> <input${attr("value", groupTitleDraft)} placeholder="Name this group chat" type="text" class="svelte-1vfruch"/></label> <label class="composer-field svelte-1vfruch"><span class="svelte-1vfruch">Add members</span> <input${attr("value", groupMemberDraft)} list="message-contacts" placeholder="Type usernames" type="text" class="svelte-1vfruch"/></label> `);
          if (selectedGroupMembers.length > 0) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<div class="selected-members svelte-1vfruch"><!--[-->`);
            const each_array_3 = ensure_array_like(selectedGroupMembers);
            for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
              let member = each_array_3[$$index_3];
              $$renderer2.push(`<button class="selected-member-chip svelte-1vfruch" type="button">${escape_html(member)} <span>×</span></button>`);
            }
            $$renderer2.push(`<!--]--></div>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]--> <label class="composer-field grow svelte-1vfruch"><span class="svelte-1vfruch">Message</span> <textarea placeholder="Write a message..." rows="3" class="svelte-1vfruch">`);
        const $$body = escape_html(composerDraft);
        if ($$body) {
          $$renderer2.push(`${$$body}`);
        }
        $$renderer2.push(`</textarea></label> <datalist id="message-contacts"><!--[-->`);
        const each_array_4 = ensure_array_like(data.suggestedContacts);
        for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
          let contact = each_array_4[$$index_4];
          $$renderer2.option({ value: contact.username }, ($$renderer3) => {
          });
        }
        $$renderer2.push(`<!--]--></datalist> `);
        if (composerMode === "direct" && directSuggestions.length > 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="contact-list svelte-1vfruch"><!--[-->`);
          const each_array_5 = ensure_array_like(directSuggestions);
          for (let $$index_5 = 0, $$length = each_array_5.length; $$index_5 < $$length; $$index_5++) {
            let contact = each_array_5[$$index_5];
            $$renderer2.push(`<button class="contact-chip svelte-1vfruch" type="button">${escape_html(contact.username)}</button>`);
          }
          $$renderer2.push(`<!--]--></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (composerMode === "group" && groupSuggestions.length > 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="contact-list svelte-1vfruch"><!--[-->`);
          const each_array_6 = ensure_array_like(groupSuggestions);
          for (let $$index_6 = 0, $$length = each_array_6.length; $$index_6 < $$length; $$index_6++) {
            let contact = each_array_6[$$index_6];
            $$renderer2.push(`<button class="contact-chip svelte-1vfruch" type="button">${escape_html(contact.username)}</button>`);
          }
          $$renderer2.push(`<!--]--></div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (composerError) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<p class="composer-feedback svelte-1vfruch">${escape_html(composerError)}</p>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> <div class="composer-actions svelte-1vfruch"><button class="secondary-button svelte-1vfruch" type="button">Cancel</button> <button class="primary-button svelte-1vfruch" type="button">Send</button></div></section>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> <div class="conversation-list svelte-1vfruch">`);
      {
        $$renderer2.push("<!--[0-->");
        if (data.conversations.length === 0) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="empty-state svelte-1vfruch">No messages yet. Start with the + button.</div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
          $$renderer2.push(`<!--[-->`);
          const each_array_7 = ensure_array_like(data.conversations);
          for (let $$index_7 = 0, $$length = each_array_7.length; $$index_7 < $$length; $$index_7++) {
            let conversation = each_array_7[$$index_7];
            $$renderer2.push(`<button${attr_class("conversation-row svelte-1vfruch", void 0, { "unread": conversation.unreadCount > 0 })} type="button">`);
            AvatarBadge($$renderer2, { size: "sm", username: conversation.title });
            $$renderer2.push(`<!----> <div class="conversation-copy svelte-1vfruch"><div class="conversation-topline svelte-1vfruch"><strong class="svelte-1vfruch">${escape_html(conversation.title)}</strong> <span class="conversation-time svelte-1vfruch">${escape_html(formatRelativeTime(conversation.lastMessageAt))}</span></div> <p class="conversation-preview svelte-1vfruch">${escape_html(conversation.preview)}</p></div> `);
            if (conversation.unreadCount > 0) {
              $$renderer2.push("<!--[0-->");
              $$renderer2.push(`<span class="unread-pill svelte-1vfruch">${escape_html(conversation.unreadCount)}</span>`);
            } else {
              $$renderer2.push("<!--[-1-->");
            }
            $$renderer2.push(`<!--]--></button>`);
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></section></section>`);
    bind_props($$props, { data });
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let data = $$props["data"];
    MessagesPage($$renderer2, { data: data.messages });
    bind_props($$props, { data });
  });
}
export {
  _page as default
};
