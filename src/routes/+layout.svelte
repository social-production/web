<script lang="ts">
  import { browser, dev } from '$app/environment';
  import { afterNavigate, invalidate } from '$app/navigation';
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import { getSettings } from '$lib/services/queries/account';
  import { getBootstrap } from '$lib/services/queries/bootstrap';
  import {
    beginBootstrapBackgroundRefresh,
    endBootstrapBackgroundRefresh,
    readBootstrapCacheRecord,
    shouldBackgroundRefreshBootstrap,
    writeBootstrapCache
  } from '$lib/services/bootstrapCache';
  import { hasRememberedAuthCookie } from '$lib/services/session';
  import { syncUnreadCountsFromBootstrap } from '$lib/services/commands/inbox';
  import '../app.css';
  import AppShell from '$lib/app/shell/AppShell.svelte';
  import { PWA_ENABLED } from '$lib/config/env';
  import InstallAppButton from '$lib/components/shared/InstallAppButton.svelte';
  import { detectShellMode } from '$lib/platform/shellMode';
  import type { LayoutData } from './$types';

  export let data: LayoutData;

  $: if (browser) {
    const theme = data.settings?.appearanceThemeMode ?? 'light';
    const textSize = data.settings?.textSize ?? 'medium';
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.textSize = textSize;
    document.body.dataset.theme = theme;
    document.body.dataset.shellMode = detectShellMode();
    document.documentElement.lang = data.locale;

    try {
      localStorage.setItem('sp_theme', theme);
    } catch {
      // ignore storage failures
    }
  }

  async function refreshBootstrapInBackground() {
    const record = readBootstrapCacheRecord();
    if (!shouldBackgroundRefreshBootstrap(record)) {
      return;
    }
    if (!beginBootstrapBackgroundRefresh()) {
      return;
    }

    try {
      const bootstrap = await getBootstrap();
      let settings = data.settings ?? record?.settings ?? null;
      if (bootstrap.viewer) {
        try {
          settings = await getSettings();
        } catch {
          // Keep the cached settings until the next successful refresh.
        }
      }
      writeBootstrapCache(bootstrap, settings);
      syncUnreadCountsFromBootstrap(bootstrap.unreadCounts);

      const previousViewerId = data.bootstrap.viewer?.id ?? null;
      const nextViewerId = bootstrap.viewer?.id ?? null;
      if (previousViewerId !== nextViewerId) {
        void invalidate('app:bootstrap');
      }
    } catch {
      // Keep serving the last good cache.
    } finally {
      endBootstrapBackgroundRefresh();
    }
  }

  async function syncServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (PWA_ENABLED) {
      try {
        await navigator.serviceWorker.register(
          `${base}/service-worker.js`,
          dev ? { type: 'module' } : undefined
        );
      } catch {
        // The manifest can still offer install if registration fails once.
      }
      return;
    }

    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  onMount(() => {
    void syncServiceWorker();

    if (data.servedFromCache) {
      const refresh = () => {
        void refreshBootstrapInBackground();
      };
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(refresh, { timeout: 400 });
      } else {
        window.setTimeout(refresh, 0);
      }
    }

    function recoverStaleAuthState() {
      // Cookies cleared while bootstrap still shows a viewer (or the reverse).
      if (!hasRememberedAuthCookie() && data.bootstrap.viewer) {
        void invalidate('app:bootstrap');
      }
    }

    window.addEventListener('focus', recoverStaleAuthState);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        recoverStaleAuthState();
        void refreshBootstrapInBackground();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', recoverStaleAuthState);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  });

  afterNavigate(() => {
    if (data.servedFromCache) {
      void refreshBootstrapInBackground();
    }
  });
</script>

<svelte:head>
  <title>Social Production</title>
  <meta
    name="description"
    content="Collective coordination of activity and production without exchange."
  />
  {#if PWA_ENABLED}
    <link rel="manifest" href="{base}/manifest.webmanifest" />
  {/if}
</svelte:head>

<AppShell bootstrap={data.bootstrap}>
  <InstallAppButton />
  <slot />
</AppShell>