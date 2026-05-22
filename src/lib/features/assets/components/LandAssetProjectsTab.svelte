<script lang="ts">
  import AssetProjectRelationshipsSection from '$lib/features/assets/components/AssetProjectRelationshipsSection.svelte';
  import type { LandAssetRecord } from '$lib/types/assets';

  export let asset: LandAssetRecord;

  $: projectSections = [
    {
      title: 'Land management collective service',
      description: 'Every land asset stays attached to collective land stewardship work.',
      projects: asset.managementProjects
    },
    {
      title: 'Storage collective services on this land',
      description: 'Storage services can stack on the same land while staying distinct from stewardship.',
      projects: asset.storageProjects
    },
    {
      title: 'Other projects using this land',
      description: 'Projects can reference the land record even before the live asset registry opens.',
      projects: asset.linkedProjects
    }
  ].filter((section) => section.projects.length > 0);
</script>

{#if projectSections.length === 0}
  <section class="empty-card">
    <p>No project relationships are seeded for this land asset yet.</p>
  </section>
{:else}
  {#each projectSections as section}
    <AssetProjectRelationshipsSection
      title={section.title}
      description={section.description}
      projects={section.projects}
    />
  {/each}
{/if}

<style>
  .empty-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  p {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.55;
  }
</style>