<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { installBannerHeight } from '$lib/stores/installBanner';
  import { PWA_ENABLED } from '$lib/config/env';
  import { detectShellMode } from '$lib/platform/shellMode';

  type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  };

  const DISMISS_KEY = 'sp_install_dismissed';
  const VISITS_KEY = 'sp_visits';

  let promptEvent: BeforeInstallPromptEvent | null = null;
  let dismissed = false;
  let barHeight = 0;

  $: visible = PWA_ENABLED && Boolean(promptEvent) && !dismissed;
  $: installBannerHeight.set(visible ? barHeight : 0);
  onDestroy(() => installBannerHeight.set(0));

  function dismiss() {
    dismissed = true;
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Private mode: the dismissal still holds for this page view.
    }
  }

  onMount(() => {
    // "Not now" holds for good, and a first visit is left alone: the offer starts on visit two.
    try {
      const visits = Number(localStorage.getItem(VISITS_KEY) ?? '0') + 1;
      localStorage.setItem(VISITS_KEY, String(visits));
      dismissed = localStorage.getItem(DISMISS_KEY) === '1' || visits < 2;
    } catch {
      dismissed = false;
    }
    if (!PWA_ENABLED || detectShellMode() === 'app') return;

    const onPrompt = (event: Event) => {
      event.preventDefault();
      promptEvent = event as BeforeInstallPromptEvent;
    };
    const onInstalled = () => {
      promptEvent = null;
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  });

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    promptEvent = null;
  }
</script>

{#if visible}
  <div class="install-bar" bind:clientHeight={barHeight}>
    <p>Install Social Production on this device.</p>
    <div class="actions">
      <button class="install" type="button" on:click={install}>Install app</button>
      <button class="dismiss" type="button" on:click={dismiss}>Not now</button>
    </div>
  </div>
{/if}

<style>
  .install-bar {
    position: fixed;
    z-index: 40;
    left: 0;
    right: 0;
    bottom: calc(var(--shell-bottom-nav-offset, 0px) - var(--install-banner-offset, 0px));
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 12px;
    padding: 8px 16px;
    border-top: 1px solid var(--panel-border);
    background: var(--panel);
  }

  p {
    margin: 0;
    color: var(--text-main);
    font-size: 14px;
    line-height: 1.4;
  }

  .actions {
    display: flex;
    gap: 8px;
  }

  button {
    min-height: 40px;
    padding: 0 12px;
    border: 0;
    border-radius: var(--radius-sm);
    font-weight: 700;
    cursor: pointer;
  }

  .install {
    background: var(--brand);
    color: #04140c;
  }

  .dismiss {
    background: transparent;
    color: var(--text-soft);
  }
</style>
