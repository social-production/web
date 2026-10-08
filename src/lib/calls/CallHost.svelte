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
  } from './session';

  let now = Date.now();
  let timer: ReturnType<typeof setInterval> | null = null;

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
    disconnectCallSignaling();
  });

  $: view = $callView;
  $: visible = view.phase !== 'idle';
  $: elapsed = formatElapsed(view.connectedAt, now);

  function formatElapsed(connectedAt: number | null, current: number) {
    if (!connectedAt) {
      return '00:00';
    }
    const total = Math.max(0, Math.floor((current - connectedAt) / 1000));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
</script>

{#if visible}
  <div class="call-scrim">
    <div class="call-card" role="dialog" aria-modal="true" aria-labelledby="call-title">
      <p class="call-kicker">Voice call</p>
      <h2 id="call-title">{view.peerName || 'Someone'}</h2>

      {#if view.phase === 'calling'}
        <p class="call-status">Calling…</p>
      {:else if view.phase === 'ringing'}
        <p class="call-status">Incoming call</p>
      {:else if view.phase === 'active'}
        <p class="call-status">{elapsed}</p>
      {:else if view.phase === 'unavailable'}
        <p class="call-status">Unavailable</p>
      {:else if view.phase === 'busy'}
        <p class="call-status">On another call</p>
      {:else if view.phase === 'declined'}
        <p class="call-status">Call declined</p>
      {:else}
        <p class="call-status">{view.notice || 'Call ended'}</p>
      {/if}

      <div class="call-actions">
        {#if view.phase === 'ringing'}
          <button class="call-action decline" type="button" on:click={declineCall}>Decline</button>
          <button class="call-action accept" type="button" on:click={acceptCall}>Accept</button>
        {:else if view.phase === 'calling' || view.phase === 'active'}
          {#if view.phase === 'active'}
            <button
              class="call-action"
              type="button"
              aria-pressed={view.muted}
              on:click={toggleCallMute}
            >
              {view.muted ? 'Unmute' : 'Mute'}
            </button>
          {/if}
          <button class="call-action hangup" type="button" on:click={hangUpCall}>Hang up</button>
        {:else}
          <button class="call-action" type="button" on:click={dismissCall}>Close</button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .call-scrim {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: grid;
    place-items: center;
    padding: 24px;
    background: color-mix(in srgb, var(--page-background) 28%, rgb(0 0 0 / 72%));
  }

  .call-card {
    width: min(360px, 100%);
    display: grid;
    gap: 8px;
    padding: 28px 24px 22px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-md, 16px);
    background: var(--panel);
    color: var(--text-main);
    text-align: center;
  }

  .call-kicker {
    margin: 0;
    color: var(--text-muted, var(--text-main));
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  h2 {
    margin: 0;
    font-size: 28px;
    line-height: 1.15;
  }

  .call-status {
    margin: 0 0 12px;
    color: var(--text-muted, var(--text-main));
    font-size: 15px;
  }

  .call-actions {
    display: flex;
    justify-content: center;
    gap: 10px;
  }

  .call-action {
    min-width: 108px;
    padding: 12px 16px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel-strong);
    color: var(--text-main);
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  .call-action.accept {
    border-color: transparent;
    background: var(--brand);
    color: #082214;
  }

  .call-action.decline,
  .call-action.hangup {
    border-color: transparent;
    background: var(--danger);
    color: white;
  }

  .call-action[aria-pressed='true'] {
    background: var(--brand-soft);
    color: var(--brand-strong);
  }
</style>
