<script lang="ts">
  import { browser } from '$app/environment';
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
</script>

<svelte:head>
  <title>Social Production Web</title>
  <meta
    name="description"
    content="Phase 1 Social Production frontend with a development adapter and the first Public and Personal routes."
  />
</svelte:head>

<AppShell bootstrap={data.bootstrap}>
  <slot />
</AppShell>