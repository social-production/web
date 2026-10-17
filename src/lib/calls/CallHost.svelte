<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import {
    acceptCall,
    callView,
    connectCallSignaling,
    declineCall,
    dismissCall,
    disconnectCallSignaling,
    hangUpCall,
    toggleCallMute,
    toggleCallSpeaker,
    type CallView,
  } from './session';
  import { startCallTone, type CallTone } from './tones';
  import { canSelectAudioOutput } from './media';

  const speakerSupported = canSelectAudioOutput();

  const ENDED_DISMISS_MS = 2500;

  let now = Date.now();
  let timer: ReturnType<typeof setInterval> | null = null;
  let dismissTimer: ReturnType<typeof setTimeout> | null = null;
  let minimized = false;
  let tone: CallTone | null = null;
  let tonePhase: string | null = null;

  onMount(() => {
    connectCallSignaling();
    timer = setInterval(() => {
      now = Date.now();
    }, 1000);
  });

  onDestroy(() => {
    if (timer) {
      clearInterval(timer);
    }
    if (dismissTimer) {
      clearTimeout(dismissTimer);
    }
    tone?.stop();
    disconnectCallSignaling();
  });

  $: view = $callView;
  $: visible = view.phase !== 'idle';
  $: live = view.phase === 'calling' || view.phase === 'ringing' || view.phase === 'active';
  $: finished = visible && !live;
  $: elapsed = formatElapsed(view.connectedAt ? now - view.connectedAt : 0);
  $: initials =
    (view.peerName || '?')
      .replace(/[^a-z0-9]/gi, '')
      .slice(0, 2)
      .toUpperCase() || '?';
  $: if (!live) {
    minimized = false;
  }
  $: syncTone(view.phase, view.connecting);
  $: scheduleDismiss(finished);

  // Ring for the person being called; ringback for the caller until they answer.
  function syncTone(phase: string, connecting: boolean) {
    const wanted = connecting
      ? null
      : phase === 'ringing'
        ? 'ring'
        : phase === 'calling'
          ? 'ringback'
          : null;
    if (wanted === tonePhase) return;
    tone?.stop();
    tone = wanted ? startCallTone(wanted) : null;
    tonePhase = wanted;
  }

  function scheduleDismiss(shouldDismiss: boolean) {
    if (dismissTimer) {
      clearTimeout(dismissTimer);
      dismissTimer = null;
    }
    if (shouldDismiss) {
      // A problem notice (e.g. the microphone) stays long enough to read; it can be closed sooner.
      dismissTimer = setTimeout(dismissCall, view.notice ? ENDED_DISMISS_MS * 3 : ENDED_DISMISS_MS);
    }
  }

  function formatElapsed(ms: number) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function statusLine(view: CallView, elapsed: string) {
    if (view.connecting) return 'Connecting…';
    switch (view.phase) {
      case 'calling':
        return 'Ringing…';
      case 'ringing':
        return 'Incoming voice call';
      case 'active':
        return elapsed;
      case 'unavailable':
        return 'Not available right now';
      case 'busy':
        return 'On another call';
      case 'declined':
        return 'Call declined';
      default:
        if (view.notice) return view.notice;
        return view.lastDurationMs
          ? `Call ended · ${formatElapsed(view.lastDurationMs)}`
          : 'Call ended';
    }
  }
</script>

{#if visible && minimized}
  <button class="call-pill" type="button" on:click={() => (minimized = false)}>
    <span class="pill-dot" aria-hidden="true"></span>
    <span class="pill-text">
      <strong>{view.peerName || 'Call'}</strong>
      <span>{view.phase === 'active' ? elapsed : statusLine(view, elapsed)}</span>
    </span>
    <span class="pill-return">Tap to return</span>
  </button>
{:else if visible}
  <div class="call-screen" role="dialog" aria-modal="true" aria-labelledby="call-title">
    <div class="call-top">
      {#if live && view.phase !== 'ringing'}
        <button
          class="icon-plain"
          type="button"
          aria-label="Back to the app"
          title="Back to the app"
          on:click={() => (minimized = true)}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" width="26" height="26">
            <path
              d="M6 9l6 6 6-6"
              fill="none"
              stroke="currentColor"
              stroke-width="2.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      {:else}
        <span></span>
      {/if}
      <span class="call-kind">Voice call</span>
      <span></span>
    </div>

    <div class="call-identity">
      <div
        class="avatar"
        class:pulsing={view.phase === 'calling' || view.phase === 'ringing'}
        aria-hidden="true"
      >
        {initials}
      </div>
      <h2 id="call-title">{view.peerName || 'Someone'}</h2>
      <p class="call-status" aria-live="polite">{statusLine(view, elapsed)}</p>
    </div>

    <div class="call-controls">
      {#if view.phase === 'ringing'}
        <div class="control">
          <button class="round decline" type="button" aria-label="Decline" on:click={declineCall}>
            <svg aria-hidden="true" viewBox="0 0 24 24" width="30" height="30">
              <path
                fill="currentColor"
                d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 0 1 0-1.36C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.72c.18.18.29.44.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"
              />
            </svg>
          </button>
          <span>Decline</span>
        </div>
        <div class="control">
          <button
            class="round accept"
            type="button"
            aria-label="Accept"
            disabled={view.connecting}
            on:click={acceptCall}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" width="30" height="30">
              <path
                fill="currentColor"
                d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"
              />
            </svg>
          </button>
          <span>Accept</span>
        </div>
      {:else if live}
        <div class="control">
          <button
            class="round"
            type="button"
            aria-pressed={view.muted}
            aria-label={view.muted ? 'Unmute' : 'Mute'}
            on:click={toggleCallMute}
          >
            {#if view.muted}
              <svg aria-hidden="true" viewBox="0 0 24 24" width="28" height="28">
                <path
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  d="M3 3l18 18M9 9v3a3 3 0 0 0 5.1 2.1M15 9.3V5a3 3 0 0 0-5.9-.7M19 11a7 7 0 0 1-1.1 3.8M5 11a7 7 0 0 0 10.6 6M12 18v3"
                />
              </svg>
            {:else}
              <svg aria-hidden="true" viewBox="0 0 24 24" width="28" height="28">
                <path
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM19 11a7 7 0 0 1-14 0M12 18v3"
                />
              </svg>
            {/if}
          </button>
          <span>{view.muted ? 'Unmute' : 'Mute'}</span>
        </div>
        {#if speakerSupported}
          <div class="control">
            <button
              class="round"
              type="button"
              aria-pressed={view.speaker}
              aria-label={view.speaker ? 'Speaker off' : 'Speaker on'}
              on:click={toggleCallSpeaker}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="28" height="28">
                <path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4z" />
                <path
                  d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </button>
            <span>Speaker</span>
          </div>
        {/if}
        <div class="control">
          <button class="round decline" type="button" aria-label="End call" on:click={hangUpCall}>
            <svg aria-hidden="true" viewBox="0 0 24 24" width="30" height="30">
              <path
                fill="currentColor"
                d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 0 1 0-1.36C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.72c.18.18.29.44.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"
              />
            </svg>
          </button>
          <span>End</span>
        </div>
      {:else}
        <div class="control">
          <button class="round" type="button" aria-label="Close" on:click={dismissCall}>
            <svg aria-hidden="true" viewBox="0 0 24 24" width="26" height="26">
              <path
                d="M6 6l12 12M18 6L6 18"
                fill="none"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-linecap="round"
              />
            </svg>
          </button>
          <span>Close</span>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .call-screen {
    position: fixed;
    inset: 0;
    z-index: 400;
    display: grid;
    grid-template-rows: auto 1fr auto;
    padding: max(16px, env(safe-area-inset-top)) 20px max(28px, env(safe-area-inset-bottom));
    background: linear-gradient(180deg, #123524 0%, #0a1f15 60%, #06130d 100%);
    color: #f4fbf6;
  }

  .call-top {
    display: grid;
    grid-template-columns: 44px 1fr 44px;
    align-items: center;
  }

  .call-kind {
    text-align: center;
    color: rgb(244 251 246 / 70%);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .icon-plain {
    display: inline-grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }

  .call-identity {
    display: grid;
    align-content: center;
    justify-items: center;
    gap: 10px;
    text-align: center;
  }

  .avatar {
    display: grid;
    place-items: center;
    width: 128px;
    height: 128px;
    margin-bottom: 12px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--brand, #2e8b57) 70%, #0a1f15);
    font-size: 44px;
    font-weight: 800;
  }

  .avatar.pulsing {
    animation: call-pulse 1.8s ease-out infinite;
  }

  @keyframes call-pulse {
    0% {
      box-shadow: 0 0 0 0 rgb(120 220 160 / 45%);
    }
    100% {
      box-shadow: 0 0 0 36px rgb(120 220 160 / 0%);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .avatar.pulsing {
      animation: none;
    }
  }

  h2 {
    margin: 0;
    max-width: 100%;
    overflow: hidden;
    font-size: 30px;
    line-height: 1.15;
    text-overflow: ellipsis;
  }

  .call-status {
    margin: 0;
    color: rgb(244 251 246 / 75%);
    font-size: 17px;
    font-variant-numeric: tabular-nums;
  }

  .call-controls {
    display: flex;
    justify-content: space-evenly;
    gap: 24px;
  }

  .control {
    display: grid;
    justify-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: rgb(244 251 246 / 85%);
  }

  .round {
    display: grid;
    place-items: center;
    width: 68px;
    height: 68px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: rgb(255 255 255 / 16%);
    color: #fff;
    cursor: pointer;
  }

  .round[aria-pressed='true'] {
    background: #f4fbf6;
    color: #0a1f15;
  }

  .round.accept {
    background: #22a55a;
  }

  .round.decline {
    background: #e0433a;
  }

  .round:disabled {
    opacity: 0.6;
  }

  .call-pill {
    position: fixed;
    top: max(8px, env(safe-area-inset-top));
    left: 50%;
    z-index: 400;
    display: flex;
    align-items: center;
    gap: 10px;
    width: min(420px, calc(100% - 16px));
    padding: 10px 14px;
    border: 0;
    border-radius: 999px;
    background: #22a55a;
    color: #fff;
    font: inherit;
    text-align: left;
    box-shadow: 0 8px 24px rgb(0 0 0 / 25%);
    transform: translateX(-50%);
    cursor: pointer;
  }

  .pill-dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: #fff;
    animation: pill-blink 1.4s ease-in-out infinite;
  }

  @keyframes pill-blink {
    50% {
      opacity: 0.35;
    }
  }

  .pill-text {
    display: grid;
    flex: 1 1 auto;
    min-width: 0;
    line-height: 1.2;
  }

  .pill-text strong {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .pill-text span,
  .pill-return {
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }

  .pill-return {
    flex: 0 0 auto;
    opacity: 0.9;
  }
</style>
