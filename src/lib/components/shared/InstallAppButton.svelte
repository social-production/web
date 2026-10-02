<script lang="ts">
  import { onMount } from 'svelte';
  import { PWA_ENABLED } from '$lib/config/env';
  import { detectShellMode } from '$lib/platform/shellMode';

  type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  };

  let promptEvent: BeforeInstallPromptEvent | null = null;
  let dismissed = false;

  onMount(() => {
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

{#if PWA_ENABLED && promptEvent && !dismissed}
  <div class="install-bar">
    <p>Install Social Production on this device.</p>
    <div class="actions">
      <button class="install" type="button" on:click={install}>Install app</button>
      <button class="dismiss" type="button" on:click={() => (dismissed = true)}>Not now</button>
    </div>
  </div>
{/if}

<style>
  .install-bar {
    position: fixed;
    z-index: 40;
    right: 16px;
    bottom: calc(84px + env(safe-area-inset-bottom, 0px));
    display: grid;
    gap: 10px;
    width: min(320px, calc(100vw - 32px));
    padding: 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    box-shadow: 0 12px 32px color-mix(in srgb, var(--page-background) 55%, transparent);
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
