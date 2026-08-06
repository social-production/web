/**
 * Supabase `messages` domain scaffold.
 * Responsibility: conversations, DMs, groups, contacts, linked-chat read.
 * Replace stubs with real `web-supabase` calls mapped to `$lib/types/*`.
 */
import type { AppAdapter } from '$lib/services/adapters/types';
import { stubMethod } from '../../scaffold';

const provider = 'supabase' as const;
const domain = 'messages' as const;

export const messagesDomain: Partial<AppAdapter> = {
  getMessages: stubMethod(provider, domain, 'getMessages') as AppAdapter['getMessages'],
  getConversationMessages: stubMethod(provider, domain, 'getConversationMessages') as AppAdapter['getConversationMessages'],
  getMessageContacts: stubMethod(provider, domain, 'getMessageContacts') as AppAdapter['getMessageContacts'],
  sendMessage: stubMethod(provider, domain, 'sendMessage') as AppAdapter['sendMessage'],
  startDirectMessage: stubMethod(provider, domain, 'startDirectMessage') as AppAdapter['startDirectMessage'],
  createGroupConversation: stubMethod(provider, domain, 'createGroupConversation') as AppAdapter['createGroupConversation'],
  renameGroupConversation: stubMethod(provider, domain, 'renameGroupConversation') as AppAdapter['renameGroupConversation'],
  addGroupConversationMember: stubMethod(provider, domain, 'addGroupConversationMember') as AppAdapter['addGroupConversationMember'],
  removeGroupConversationMember: stubMethod(provider, domain, 'removeGroupConversationMember') as AppAdapter['removeGroupConversationMember'],
  markConversationRead: stubMethod(provider, domain, 'markConversationRead') as AppAdapter['markConversationRead'],
  markLinkedChatRead: stubMethod(provider, domain, 'markLinkedChatRead') as AppAdapter['markLinkedChatRead'],
};

