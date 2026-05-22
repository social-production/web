<script lang="ts">
  import CreatePanel from '$lib/features/create/shared/CreatePanel.svelte';

  export let privateCommunityLabel: string | null = null;
  export let personalInviteOnly = false;
</script>

<CreatePanel title="Visibility rule" description="How discovery works in this frontend slice.">
  <p class="helper-text">
    {#if privateCommunityLabel}
      Private events can live inside a single private community without leaking into Public.
    {:else if personalInviteOnly}
      Private personal events stay invite-only when they are only tied to directly added people.
    {:else}
      Public events need at least one channel tag. Public communities can be added too, but they cannot be the only tag.
    {/if}
  </p>
</CreatePanel>

<style>
  .helper-text {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.45;
  }
</style>
