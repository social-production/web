<script lang="ts">
  import { browser } from '$app/environment';
  import { invalidate } from '$app/navigation';
  import { onMount } from 'svelte';
  import { hasAuthenticatedSession } from '$lib/services/session';
  import '../app.css';
  import AppShell from '$lib/app/shell/AppShell.svelte';
  import { detectShellMode } from '$lib/platform/shellMode';
  import type { LayoutData } from './$types';

  export let data: LayoutData;

  $: if (browser) {
    const theme = data.settings?.appearanceThemeMode ?? 'light';
    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
    document.body.dataset.shellMode = detectShellMode();
    document.documentElement.lang = data.locale;

    try {
      localStorage.setItem('sp_theme', theme);
    } catch {
      // ignore storage failures
    }
  }

  onMount(() => {
    function recoverStaleAuthState() {
      if (!hasAuthenticatedSession() && data.bootstrap.viewer) {
        void invalidate('app:bootstrap');
      }
    }

    window.addEventListener('focus', recoverStaleAuthState);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        recoverStaleAuthState();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', recoverStaleAuthState);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  });
</script>

<svelte:head>
  <title>Social Production</title>
  <meta
    name="description"
    content="Phase 1 Social Production frontend with a development adapter and the first Public and Personal routes."
  />
</svelte:head>

<AppShell bootstrap={data.bootstrap}>
  <slot />
</AppShell>