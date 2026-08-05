<script lang="ts">
  import CreateFlowLayout from '$lib/features/create/shared/CreateFlowLayout.svelte';
  import RequiredFieldLabel from '$lib/components/shared/RequiredFieldLabel.svelte';
  import CreatePanel from '$lib/features/create/shared/CreatePanel.svelte';
  import PreviewTile from '$lib/features/create/shared/PreviewTile.svelte';
  import { createCommunity } from '$lib/services/queries/create';
  import { navigateAfterCreate } from '$lib/utils/navigateAfterCreate';
  import { canonicalizeHandle, validateHandle } from '$lib/utils/handles';

  let name = '';
  let openness: 'open' | 'invite_only' = 'open';
  let description = '';
  let statusMessage = '';
  let isSubmitting = false;

  $: handleCheck = validateHandle(name, 'Community name');
  $: canSubmit = handleCheck.ok && description.trim().length > 0;
  $: urlPreview = handleCheck.ok
    ? `/communities/${handleCheck.canonical}`
    : name.trim()
      ? `/communities/${canonicalizeHandle(name)}`
      : '';

  async function handleCreate() {
    isSubmitting = true;
    statusMessage = '';

    try {
      if (!handleCheck.ok) {
        statusMessage = handleCheck.error;
        return;
      }

      const result = await createCommunity({
        name: handleCheck.display,
        description,
        joinPolicy: openness
      });

      if (!result.ok || !result.slug) {
        statusMessage = result.error ?? 'The community could not be created.';
        return;
      }

      await navigateAfterCreate(`/communities/${result.slug}`);
    } finally {
      isSubmitting = false;
    }
  }

  function handleDraft() {
    statusMessage = 'Draft saving is not wired yet, but the community flow is now in place.';
  }
</script>

<CreateFlowLayout>
  <svelte:fragment slot="primary">
    <CreatePanel
      title="Community setup"
      description="Shape the public social space first, then refine norms and membership controls later."
    >
      <form class="form-stack" on:submit|preventDefault={handleCreate}>
        <label>
          <RequiredFieldLabel>Community handle</RequiredFieldLabel>
          <input bind:value={name} aria-required="true" placeholder="e.g. Dog-Man" />
        </label>
        {#if name.trim()}
          {#if !handleCheck.ok}
            <p class="status-note">{handleCheck.error}</p>
          {:else}
            <p class="helper-text">URL: <code>{urlPreview}</code></p>
          {/if}
        {/if}

        <label>
          <span class="field-label">Openness</span>
          <select bind:value={openness}>
            <option value="open">Open</option>
            <option value="invite_only">Private</option>
          </select>
        </label>

        <label>
          <RequiredFieldLabel>Description</RequiredFieldLabel>
          <textarea bind:value={description} rows="4" aria-required="true"></textarea>
        </label>

        <div class="button-row">
          <button class="button-primary" disabled={!canSubmit || isSubmitting} type="submit">
            {isSubmitting ? 'Creating...' : 'Create Community'}
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
      description="How the new community row will read in discovery."
      surface="transparent"
    >
      <PreviewTile
        title={handleCheck.ok ? handleCheck.display : name.trim() || 'Untitled community'}
        body={description.trim() || 'Describe who this community is for and why people gather here.'}
        meta={openness === 'invite_only' ? 'Invite-only community' : 'Open community'}
      />
    </CreatePanel>

    <CreatePanel title="Discovery note" description="What this surface is meant to do.">
      <p class="helper-text">
        Communities connect people to projects and thread discussion without forcing every topic into one shared channel feed.
      </p>
    </CreatePanel>
  </svelte:fragment>
</CreateFlowLayout>

<style>
  .form-stack {
    display: grid;
    gap: 12px;
  }

  .field-label {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: 700;
  }

  .helper-text {
    margin: 0;
    color: var(--text-soft);
    font-size: 13px;
  }

  .status-note {
    margin: 0;
    color: var(--danger, #b42318);
    font-size: 13px;
  }
</style>
