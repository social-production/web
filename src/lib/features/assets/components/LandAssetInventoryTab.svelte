<script lang="ts">
  import ProjectInventoryTab from '$lib/features/projects/detail/ProjectInventoryTab.svelte';
  import type { LandAssetRecord } from '$lib/types/assets';

  export let asset: LandAssetRecord;

  $: managingProject = asset.managementProjects[0] ?? null;
</script>

{#if asset.inventoryFrame}
  {#if managingProject}
    <section class="routing-note">
      <span>Requests from this inventory route to</span>
      {#if managingProject.href}
        <a href={managingProject.href}>{managingProject.title}</a>
      {:else}
        <strong>{managingProject.title}</strong>
      {/if}
    </section>
  {/if}

  <ProjectInventoryTab frame={asset.inventoryFrame} />
{:else}
  <section class="empty-card">
    <p>This land asset does not have a routed management inventory frame yet.</p>
  </section>
{/if}

<style>
  .routing-note,
  .empty-card {
    padding: 14px 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .routing-note {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }

  span,
  p {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.55;
  }

  a,
  strong {
    color: var(--brand-strong);
    font-weight: 700;
    text-decoration: none;
  }
</style>