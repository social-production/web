<script lang="ts">
  import { browser } from '$app/environment';
  import '../app.css';
  import AppShell from '$lib/app/shell/AppShell.svelte';
  import { detectShellMode } from '$lib/platform/shellMode';
  import type { LayoutData } from './$types';

  export let data: LayoutData;

  $: if (browser) {
    document.body.dataset.theme = data.settings?.appearanceThemeMode ?? 'light';
    document.body.dataset.shellMode = detectShellMode();
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