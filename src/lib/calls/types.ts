/**
 * Signaling envelope shared by FastAPI today and a later Holochain zome.
 * Audio never travels in this object. A later Capacitor push or CallKit
 * plugin can raise the ring screen from the same invite.
 */
export type CallSignalType =
  | 'invite'
  | 'accept'
  | 'reject'
  | 'offer'
  | 'answer'
  | 'ice'
  | 'hangup'
  | 'unavailable'
  | 'busy'
  | 'error';

export type CallEnvelope = {
  callId: string;
  conversationId: string;
  type: CallSignalType;
  payload?: Record<string, unknown> | null;
  /** Set by the server. Clients must not trust a value they sent themselves. */
  fromUserId?: string;
  fromUsername?: string;
};

export type CallChannel = {
  send(envelope: CallEnvelope): void;
  close(): void;
};
