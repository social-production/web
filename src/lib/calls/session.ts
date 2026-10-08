import { browser } from '$app/environment';
import { currentAdapter } from '$lib/services/adapters';
import { writable } from 'svelte/store';
import { configuredIceServers, createCallMedia, type CallMedia } from './media';
import type { CallChannel, CallEnvelope } from './types';

export type CallPhase =
  'idle' | 'calling' | 'ringing' | 'active' | 'unavailable' | 'busy' | 'declined' | 'ended';

export type CallView = {
  phase: CallPhase;
  callId: string | null;
  conversationId: string | null;
  peerName: string;
  muted: boolean;
  connectedAt: number | null;
  notice: string | null;
};

const idleView: CallView = {
  phase: 'idle',
  callId: null,
  conversationId: null,
  peerName: '',
  muted: false,
  connectedAt: null,
  notice: null,
};

export const callView = writable<CallView>(idleView);

let channel: CallChannel | null = null;
let media: CallMedia | null = null;
let role: 'caller' | 'callee' | null = null;
let view: CallView = idleView;
let attempt = 0;

callView.subscribe((next) => {
  view = next;
});

function patch(next: Partial<CallView>) {
  callView.set({ ...view, ...next });
}

function reset(phase: CallPhase = 'idle', notice: string | null = null) {
  attempt += 1;
  media?.stop();
  media = null;
  role = null;
  callView.set({ ...idleView, phase, peerName: view.peerName, notice });
}

function send(type: CallEnvelope['type'], payload?: Record<string, unknown> | null) {
  if (!channel || !view.callId || !view.conversationId) {
    return;
  }
  channel.send({
    callId: view.callId,
    conversationId: view.conversationId,
    type,
    payload: payload ?? {},
  });
}

function descriptionFrom(
  payload: Record<string, unknown> | null | undefined
): RTCSessionDescriptionInit | null {
  const sdp = payload?.sdp;
  const type = payload?.type;
  if (typeof sdp !== 'string' || (type !== 'offer' && type !== 'answer')) {
    return null;
  }
  return { type, sdp };
}

function candidateFrom(
  payload: Record<string, unknown> | null | undefined
): RTCIceCandidateInit | null {
  const candidate = payload?.candidate;
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }
  return candidate as RTCIceCandidateInit;
}

async function ensureMedia() {
  if (media) {
    return media;
  }
  const next = createCallMedia(configuredIceServers(), (candidate) => {
    send('ice', { candidate });
  });
  media = next;
  await next.startLocalAudio();
  return next;
}

function handleEnvelope(envelope: CallEnvelope) {
  const sameCall = envelope.callId && envelope.callId === view.callId;

  if (envelope.type === 'invite') {
    if (view.phase === 'calling' || view.phase === 'ringing' || view.phase === 'active') {
      channel?.send({
        callId: envelope.callId,
        conversationId: envelope.conversationId,
        type: 'reject',
        payload: {},
      });
      return;
    }
    role = 'callee';
    callView.set({
      phase: 'ringing',
      callId: envelope.callId,
      conversationId: envelope.conversationId,
      peerName: envelope.fromUsername || 'Someone',
      muted: false,
      connectedAt: null,
      notice: null,
    });
    return;
  }

  if (!sameCall) {
    return;
  }

  if (envelope.type === 'unavailable') {
    reset('unavailable');
    return;
  }
  if (envelope.type === 'busy') {
    reset('busy');
    return;
  }
  if (envelope.type === 'reject') {
    reset('declined');
    return;
  }
  if (envelope.type === 'hangup') {
    reset('ended');
    return;
  }
  if (envelope.type === 'error') {
    reset('ended');
    return;
  }
  if (envelope.type === 'accept' && role === 'caller') {
    void (async () => {
      try {
        const current = await ensureMedia();
        const offer = await current.createOffer();
        send('offer', { type: offer.type, sdp: offer.sdp });
      } catch {
        send('hangup');
        reset('ended');
      }
    })();
    return;
  }
  if (envelope.type === 'offer' && role === 'callee') {
    void (async () => {
      try {
        const current = media ?? (await ensureMedia());
        const offer = descriptionFrom(envelope.payload);
        if (!offer) {
          return;
        }
        const answer = await current.acceptOffer(offer);
        send('answer', { type: answer.type, sdp: answer.sdp });
        patch({ phase: 'active', connectedAt: Date.now() });
      } catch {
        send('hangup');
        reset('ended');
      }
    })();
    return;
  }
  if (envelope.type === 'answer' && role === 'caller') {
    void (async () => {
      const answer = descriptionFrom(envelope.payload);
      if (!answer || !media) {
        return;
      }
      try {
        await media.acceptAnswer(answer);
        patch({ phase: 'active', connectedAt: Date.now() });
      } catch {
        send('hangup');
        reset('ended');
      }
    })();
    return;
  }
  if (envelope.type === 'ice' && media) {
    const candidate = candidateFrom(envelope.payload);
    if (candidate) {
      void media.addIceCandidate(candidate).catch(() => {
        /* A late candidate after hangup is ignored. */
      });
    }
  }
}

export function connectCallSignaling() {
  if (!browser || channel) {
    return;
  }
  channel = currentAdapter.openCallChannel(handleEnvelope);
}

export function disconnectCallSignaling() {
  attempt += 1;
  if (view.phase === 'calling' || view.phase === 'ringing' || view.phase === 'active') {
    send('hangup');
  }
  media?.stop();
  media = null;
  channel?.close();
  channel = null;
  role = null;
  callView.set(idleView);
}

export async function placeDirectCall(conversationId: string, peerName: string) {
  if (!channel) {
    connectCallSignaling();
  }
  if (!channel || view.phase === 'calling' || view.phase === 'ringing' || view.phase === 'active') {
    return;
  }
  const callId = crypto.randomUUID();
  const currentAttempt = attempt;
  role = 'caller';
  callView.set({
    phase: 'calling',
    callId,
    conversationId,
    peerName,
    muted: false,
    connectedAt: null,
    notice: null,
  });
  try {
    await ensureMedia();
  } catch {
    reset('ended', 'Microphone unavailable');
    return;
  }
  if (currentAttempt !== attempt) {
    return;
  }
  send('invite', {});
}

export async function acceptCall() {
  if (view.phase !== 'ringing' || role !== 'callee') {
    return;
  }
  try {
    await ensureMedia();
  } catch {
    send('reject');
    reset('ended', 'Microphone unavailable');
    return;
  }
  send('accept', {});
}

export function declineCall() {
  if (view.phase !== 'ringing') {
    return;
  }
  send('reject');
  reset('idle');
}

export function hangUpCall() {
  if (view.phase !== 'calling' && view.phase !== 'ringing' && view.phase !== 'active') {
    return;
  }
  send('hangup');
  reset('idle');
}

export function toggleCallMute() {
  if (!media || view.phase !== 'active') {
    return;
  }
  const muted = !view.muted;
  media.setMuted(muted);
  patch({ muted });
}

export function dismissCall() {
  if (
    view.phase === 'unavailable' ||
    view.phase === 'busy' ||
    view.phase === 'declined' ||
    view.phase === 'ended'
  ) {
    callView.set(idleView);
  }
}
