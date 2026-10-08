/**
 * Device audio for a one-to-one call.
 * The messenger UI never calls getUserMedia or RTCPeerConnection itself.
 * A Capacitor WebView uses these same APIs once the wrap declares microphone access.
 */

export type IceCandidateHandler = (candidate: RTCIceCandidateInit) => void;

export type CallMedia = {
  startLocalAudio(): Promise<void>;
  createOffer(): Promise<RTCSessionDescriptionInit>;
  acceptOffer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
  acceptAnswer(answer: RTCSessionDescriptionInit): Promise<void>;
  addIceCandidate(candidate: RTCIceCandidateInit): Promise<void>;
  setMuted(muted: boolean): void;
  stop(): void;
};

export function configuredIceServers(): RTCIceServer[] {
  const stun =
    (import.meta.env.VITE_CALL_STUN_URLS as string | undefined)?.trim() ||
    'stun:stun.l.google.com:19302';
  const servers: RTCIceServer[] = stun
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean)
    .map((urls) => ({ urls }));

  const turn = (import.meta.env.VITE_CALL_TURN_URLS as string | undefined)?.trim();
  if (!turn) {
    return servers;
  }

  const username = (import.meta.env.VITE_CALL_TURN_USERNAME as string | undefined)?.trim();
  const credential = (import.meta.env.VITE_CALL_TURN_CREDENTIAL as string | undefined)?.trim();
  for (const urls of turn
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean)) {
    servers.push({
      urls,
      ...(username ? { username } : {}),
      ...(credential ? { credential } : {}),
    });
  }
  return servers;
}

export function createCallMedia(
  iceServers: RTCIceServer[],
  onIceCandidate: IceCandidateHandler
): CallMedia {
  const peer = new RTCPeerConnection({ iceServers });
  const remoteAudio = new Audio();
  remoteAudio.autoplay = true;
  remoteAudio.setAttribute('playsinline', '');
  let localStream: MediaStream | null = null;
  let remoteDescriptionSet = false;
  const pendingCandidates: RTCIceCandidateInit[] = [];
  let stopped = false;

  peer.onicecandidate = (event) => {
    if (stopped || !event.candidate) {
      return;
    }
    onIceCandidate(event.candidate.toJSON());
  };

  peer.ontrack = (event) => {
    const [stream] = event.streams;
    if (!stream) {
      return;
    }
    remoteAudio.srcObject = stream;
    void remoteAudio.play().catch(() => {
      /* Playback is primed during the accept or call gesture. */
    });
  };

  async function flushCandidates() {
    remoteDescriptionSet = true;
    const queued = pendingCandidates.splice(0);
    for (const candidate of queued) {
      await peer.addIceCandidate(candidate);
    }
  }

  return {
    async startLocalAudio() {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      for (const track of localStream.getTracks()) {
        peer.addTrack(track, localStream);
      }
      void remoteAudio.play().catch(() => {
        /* No remote stream yet. ontrack retries playback. */
      });
    },

    async createOffer() {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      return peer.localDescription?.toJSON() ?? offer;
    },

    async acceptOffer(offer) {
      await peer.setRemoteDescription(offer);
      await flushCandidates();
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      return peer.localDescription?.toJSON() ?? answer;
    },

    async acceptAnswer(answer) {
      await peer.setRemoteDescription(answer);
      await flushCandidates();
    },

    async addIceCandidate(candidate) {
      if (!remoteDescriptionSet) {
        pendingCandidates.push(candidate);
        return;
      }
      await peer.addIceCandidate(candidate);
    },

    setMuted(muted) {
      for (const track of localStream?.getAudioTracks() ?? []) {
        track.enabled = !muted;
      }
    },

    stop() {
      stopped = true;
      peer.onicecandidate = null;
      peer.ontrack = null;
      for (const track of localStream?.getTracks() ?? []) {
        track.stop();
      }
      localStream = null;
      remoteAudio.srcObject = null;
      peer.close();
    },
  };
}
