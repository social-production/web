import { browser } from '$app/environment';
import { createClient, type RealtimeChannel } from '@supabase/supabase-js';
import { getAccessToken } from './authSession';
import { getSupabaseAnonKey, getSupabaseRealtimeUrl } from './client';

type RealtimeCleanup = () => void;

let channels = 0;

function canSubscribe() {
  return (
    browser &&
    (import.meta.env.VITE_BACKEND ?? '').trim().toLowerCase() === 'supabase' &&
    Boolean(getSupabaseAnonKey()) &&
    Boolean(getAccessToken())
  );
}

export function isInboxRealtimeEnabled() {
  return canSubscribe();
}

function realtimeClient() {
  const token = getAccessToken();
  if (!token) return null;
  const client = createClient(getSupabaseRealtimeUrl(), getSupabaseAnonKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });
  return { client, token };
}

export function subscribeToViewerInbox(onChange: () => void): RealtimeCleanup {
  if (!canSubscribe()) return () => {};
  const connection = realtimeClient();
  if (!connection) return () => {};
  const { client, token } = connection;
  let active = true;
  let channel: RealtimeChannel | null = null;
  void client.realtime.setAuth(token).then(() => {
    if (!active) return;
    channel = client
      .channel(`viewer-inbox-${++channels}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, onChange)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversation_members' },
        onChange
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        onChange
      )
      .subscribe();
  });
  return () => {
    active = false;
    if (channel) void client.removeChannel(channel);
    else client.realtime.disconnect();
  };
}

export function subscribeToConversation(
  conversationId: string,
  onChange: () => void
): RealtimeCleanup {
  if (!canSubscribe()) return () => {};
  const connection = realtimeClient();
  if (!connection) return () => {};
  const { client, token } = connection;
  let active = true;
  let channel: RealtimeChannel | null = null;
  void client.realtime.setAuth(token).then(() => {
    if (!active) return;
    channel = client
      .channel(`conversation-${conversationId}-${++channels}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        onChange
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') onChange();
      });
  });
  return () => {
    active = false;
    if (channel) void client.removeChannel(channel);
    else client.realtime.disconnect();
  };
}

export function subscribeToSubjectComments(
  subjectType: 'project' | 'event' | 'help_request',
  subjectId: string,
  onChange: () => void
): RealtimeCleanup {
  if (!canSubscribe()) return () => {};
  const connection = realtimeClient();
  if (!connection) return () => {};
  const { client, token } = connection;
  let active = true;
  let channel: RealtimeChannel | null = null;
  void client.realtime.setAuth(token).then(() => {
    if (!active) return;
    channel = client
      .channel(`subject-${subjectType}-${subjectId}-${++channels}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `subject_id=eq.${subjectId}`,
        },
        (payload) => {
          if (payload.new.subject_type === subjectType) onChange();
        }
      )
      .subscribe();
  });
  return () => {
    active = false;
    if (channel) void client.removeChannel(channel);
    else client.realtime.disconnect();
  };
}
