<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import ProjectCard from '$lib/components/cards/public-feed/ProjectCard.svelte';
  import CreateFlowLayout from '$lib/features/create/shared/CreateFlowLayout.svelte';
  import CreatePanel from '$lib/features/create/shared/CreatePanel.svelte';
  import { createProject } from '$lib/services/queries/create';
  import {
    isCollectiveServiceProject,
    isPersonalServiceProject
  } from '$lib/features/projects/projectMode';
  import {
    channelOptions,
    communityOptions,
    splitCommaValues
  } from '$lib/features/create/shared/options';
  import type { ProjectMode, PublicProjectItem, TagKind, TagRef } from '$lib/types/feed';

  const platformTagSlug = 'platform';

  let selectedType: ProjectMode = 'productive';
  let title = '';
  let description = '';
  let locationLabel = '';
  let primaryChannel = '';
  let additionalChannels = '';
  let taggedCommunities = '';
  let serviceRequestMode: 'calendar' | 'direct' | 'both' = 'both';
  let statusMessage = '';
  let isSubmitting = false;

  function findOptionTag(label: string, kind: TagKind): TagRef | null {
    const normalized = label.trim().toLowerCase();
    const options = kind === 'channel' ? channelOptions : communityOptions;
    const match = options.find(
      (option) => option.label.toLowerCase() === normalized || option.slug.toLowerCase() === normalized
    );

    return match
      ? {
          slug: match.slug,
          label: match.label,
          kind
        }
      : null;
  }

  $: viewer = $page.data.bootstrap?.viewer ?? null;
  $: primaryChannelTag = findOptionTag(primaryChannel, 'channel');
  $: additionalChannelEntries = splitCommaValues(additionalChannels);
  $: additionalChannelTags = additionalChannelEntries
    .map((value) => findOptionTag(value, 'channel'))
    .filter((value): value is TagRef => value !== null);
  $: invalidAdditionalChannels = additionalChannelEntries.filter(
    (value) => findOptionTag(value, 'channel') === null
  );
  $: communityEntries = splitCommaValues(taggedCommunities);
  $: selectedCommunityTags = communityEntries
    .map((value) => findOptionTag(value, 'community'))
    .filter((value): value is TagRef => value !== null);
  $: invalidCommunities = communityEntries.filter(
    (value) => findOptionTag(value, 'community') === null
  );

  $: projectPreview = {
    kind: 'project',
    id: 'project-preview',
    slug: 'project-preview',
    href: '#',
    createdAt: new Date().toISOString(),
    title: title.trim() || 'Untitled project',
    authorUsername: viewer?.username ?? 'patchbay',
    projectMode: selectedType,
    summary:
      description.trim() ||
      'Describe the project so need, labor interest, and overlap stay visible before planning begins.',
    channelTags: [
      ...(primaryChannelTag ? [primaryChannelTag] : []),
      ...additionalChannelTags
    ],
    communityTags: selectedCommunityTags,
    stage: isPersonalServiceProject(selectedType)
      ? 'Activity'
      : 'Proposal',
    locationLabel: locationLabel,
    voteCount: 0,
    activeVote: 0,
    signalCount: 0,
    commentCount: 0,
    memberCount: 0,
    lastActivityAt: new Date().toISOString()
  } satisfies PublicProjectItem;

  $: usesPlatformTag = projectPreview.channelTags.some((tag) => tag.slug === platformTagSlug);
  $: personalServiceUsesPlatformTag =
    usesPlatformTag && isPersonalServiceProject(selectedType);
  $: viewerCanCreatePlatformProject = !usesPlatformTag || !!viewer;

  $: canSubmit =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    primaryChannelTag !== null &&
    invalidAdditionalChannels.length === 0 &&
    invalidCommunities.length === 0 &&
    viewerCanCreatePlatformProject &&
    !personalServiceUsesPlatformTag;

  async function handleCreate() {
    isSubmitting = true;
    statusMessage = '';

    try {
      if (!primaryChannelTag || invalidAdditionalChannels.length > 0 || invalidCommunities.length > 0) {
        statusMessage = 'Choose real channel and community tags from the available options.';
        return;
      }

      const result = await createProject({
        title,
        description,
        locationLabel: locationLabel,
        projectMode: selectedType,
        channelTags: projectPreview.channelTags,
        communityTags: projectPreview.communityTags,
        serviceRequestMode
      });

      if (!result.ok || !result.slug) {
        statusMessage = result.error ?? 'The project could not be created.';
        return;
      }

      await invalidateAll();
      await goto(`/projects/${result.slug}`);
    } finally {
      isSubmitting = false;
    }
  }

  function handleDraft() {
    statusMessage = 'Draft saving is not wired yet, but the page structure is now in place.';
  }
</script>

<CreateFlowLayout>
  <svelte:fragment slot="primary">
    <CreatePanel
      title="Project setup"
      description="Choose the project type, give it a location, and anchor discovery with at least one channel tag."
    >
      <form class="form-stack" on:submit|preventDefault={handleCreate}>
        <div class="section-block">
          <p class="section-label">Project Type</p>
          <div class="type-grid three-up">
            <button
              type="button"
              class:active={selectedType === 'productive'}
              class="type-card"
              on:click={() => (selectedType = 'productive')}
            >
              <span class="type-title">Productive Project</span>
              <span class="type-body">
                Starts in demand signalling and can gather visible demand before planning locks.
              </span>
            </button>
            <button
              type="button"
              class:active={selectedType === 'collective-service'}
              class="type-card"
              on:click={() => (selectedType = 'collective-service')}
            >
              <span class="type-title">Collective Service</span>
              <span class="type-body">
                Starts in demand signalling and can move into operations and access planning before recurring service begins.
              </span>
            </button>
            <button
              type="button"
              class:active={selectedType === 'personal-service'}
              class="type-card"
              on:click={() => (selectedType = 'personal-service')}
            >
              <span class="type-title">Personal Service</span>
              <span class="type-body">
                Skips planning and opens directly into availability, requests, and scheduling for one person offering the service.
              </span>
            </button>
          </div>
        </div>

        <label>
          <span class="field-label">Title</span>
          <input bind:value={title} />
        </label>

        <label>
          <span class="field-label">Suggested location</span>
          <input bind:value={locationLabel} list="project-locations" />
          <datalist id="project-locations">
            <option value="Block 2 Retrofit Cluster, East Market, Riverbend"></option>
            <option value="Tool Library Annex, East Market"></option>
            <option value="West Terrace Laundry Room"></option>
          </datalist>
        </label>

        <label>
          <span class="field-label">Description</span>
          <textarea bind:value={description} rows="5"></textarea>
        </label>

        <label>
          <span class="field-label">Primary channel tag</span>
          <input bind:value={primaryChannel} list="project-channels" />
          <datalist id="project-channels">
            {#each channelOptions as option}
              <option value={option.label}></option>
            {/each}
          </datalist>
        </label>

        <label>
          <span class="field-label">Additional channel tags</span>
          <input bind:value={additionalChannels} placeholder="Comma-separated" />
        </label>
        {#if invalidAdditionalChannels.length > 0}
          <p class="status-note">Additional channel tags must match real channels.</p>
        {/if}

        <label>
          <span class="field-label">Community tags</span>
          <input bind:value={taggedCommunities} placeholder="Comma-separated" list="project-communities" />
          <datalist id="project-communities">
            {#each communityOptions as option}
              <option value={option.label}></option>
            {/each}
          </datalist>
        </label>
        {#if invalidCommunities.length > 0}
          <p class="status-note">Community tags must match real communities.</p>
        {/if}
        {#if selectedType !== 'productive'}
          {#if isPersonalServiceProject(selectedType)}
            <div class="section-block">
              <span class="field-label">Service request mode</span>
              <div class="type-grid">
                <button
                  type="button"
                  class:active={serviceRequestMode === 'calendar'}
                  class="type-card"
                  on:click={() => (serviceRequestMode = 'calendar')}
                >
                  <span class="type-title">Calendar booking</span>
                  <span class="type-body">
                    Show availability on the calendar and let people request a visible slot.
                  </span>
                </button>
                <button
                  type="button"
                  class:active={serviceRequestMode === 'direct'}
                  class="type-card"
                  on:click={() => (serviceRequestMode = 'direct')}
                >
                  <span class="type-title">Direct requests</span>
                  <span class="type-body">
                    Skip the calendar and let people send written requests for work that does not need booking.
                  </span>
                </button>
                <button
                  type="button"
                  class:active={serviceRequestMode === 'both'}
                  class="type-card"
                  on:click={() => (serviceRequestMode = 'both')}
                >
                  <span class="type-title">Calendar + direct</span>
                  <span class="type-body">
                    Keep slot booking on the calendar and allow standalone written requests too.
                  </span>
                </button>
              </div>
            </div>
          {/if}
        {/if}

        <div class="button-row">
          <button class="button-primary" disabled={!canSubmit || isSubmitting} type="submit">
            {isSubmitting ? 'Creating...' : 'Create Project'}
          </button>
          <button class="button-ghost" type="button" on:click={handleDraft}>Save Draft</button>
        </div>

        {#if statusMessage}
          <p class="status-note">{statusMessage}</p>
        {/if}
      </form>
    </CreatePanel>
  </svelte:fragment>

  <svelte:fragment slot="secondary">
    <CreatePanel
      title="Live preview"
      description="Matches the current feed treatment for projects."
      surface="transparent"
    >
      <ProjectCard item={projectPreview} />
    </CreatePanel>

    <CreatePanel
      title="Posting rules"
      description="What happens immediately after creation in this frontend slice."
    >
      <p class="helper-text">
        {#if usesPlatformTag}
          {#if personalServiceUsesPlatformTag}
            Personal service projects cannot use the platform channel. The platform tag is only for collective governance surfaces.
          {:else}
            Platform-tagged projects stay open to any signed-in user. Board members do not gate creation or phase changes; they only execute collectively approved platform outcomes.
          {/if}
        {:else}
          {selectedType === 'productive'
            ? 'New productive projects start in Proposal. Planning stays public because at least one channel tag is required.'
            : isCollectiveServiceProject(selectedType)
              ? 'New collective service projects also start in Proposal so members can shape operations and access before scheduling begins.'
              : serviceRequestMode === 'direct'
                ? 'Personal services can open directly into written requests when the work does not need calendar booking.'
                : serviceRequestMode === 'both'
                  ? 'Personal services can open with both slot booking and direct written requests.'
                  : 'Personal services skip planning and open directly into availability, requests, and scheduling.'}
        {/if}
      </p>
    </CreatePanel>
  </svelte:fragment>
</CreateFlowLayout>

<style>
  .form-stack,
  .section-block {
    display: grid;
    gap: 12px;
  }

  .field-label,
  .section-label {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: 700;
  }

  .type-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .type-grid.three-up {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .type-card {
    display: grid;
    gap: 8px;
    width: 100%;
    text-align: left;
    padding: 14px;
    border-radius: var(--radius-sm);
    border-left: 3px solid transparent;
    background: var(--panel);
  }

  .type-card.active {
    background: var(--brand-soft);
    border-left-color: var(--panel-border);
  }

  .type-title {
    color: var(--brand-strong);
    font-size: 14px;
    font-weight: 800;
  }

  .type-body {
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.4;
  }

  @media (max-width: 760px) {
    .type-grid {
      grid-template-columns: 1fr;
    }
  }
</style>