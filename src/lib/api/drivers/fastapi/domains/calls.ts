import { apiWebSocketUrl } from '../client';
import type { CallChannel, CallEnvelope } from '$lib/calls/types';

const RETRY_CODES_STOP = new Set([4401, 1008]);

export function openFastApiCallChannel(onEnvelope: (envelope: CallEnvelope) => void): CallChannel {
  let socket: WebSocket | null = null;
  let closed = false;
  let retry = 0;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  const pending: string[] = [];

  const connect = () => {
    if (closed) {
      return;
    }
    socket = new WebSocket(apiWebSocketUrl('/messages/calls/ws'));
    socket.onopen = () => {
      retry = 0;
      const queued = pending.splice(0);
      for (const raw of queued) {
        socket?.send(raw);
      }
    };
    socket.onmessage = (event) => {
      if (typeof event.data !== 'string') {
        return;
      }
      try {
        onEnvelope(JSON.parse(event.data) as CallEnvelope);
      } catch {
        /* Ignore a malformed signal. */
      }
    };
    socket.onclose = (event) => {
      if (pingTimer) {
        clearInterval(pingTimer);
        pingTimer = null;
      }
      if (closed || RETRY_CODES_STOP.has(event.code)) {
        return;
      }
      const delay = Math.min(10000, 500 * 2 ** retry);
      retry += 1;
      retryTimer = setTimeout(connect, delay);
    };
    pingTimer = setInterval(() => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 10000);
  };

  connect();

  return {
    send(envelope) {
      const raw = JSON.stringify(envelope);
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(raw);
        return;
      }
      pending.push(raw);
    },
    close() {
      closed = true;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
      if (pingTimer) {
        clearInterval(pingTimer);
      }
      socket?.close();
      socket = null;
    },
  };
}
