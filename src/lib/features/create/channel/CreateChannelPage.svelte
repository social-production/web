<script lang="ts">
  import CreateFlowLayout from '$lib/features/create/shared/CreateFlowLayout.svelte';
  import CreatePanel from '$lib/features/create/shared/CreatePanel.svelte';
  import PreviewTile from '$lib/features/create/shared/PreviewTile.svelte';
  import { createChannel } from '$lib/services/commands/create';
  import { navigateAfterCreate } from '$lib/utils/navigateAfterCreate';
  import { canonicalizeHandle, validateHandle } from '$lib/utils/handles';

  let name = '';
  let description = '';
  let statusMessage = '';
  let isSubmitting = false;

  $: handleCheck = validateHandle(name, 'Channel name');
  $: canSubmit = handleCheck.ok && description.trim().length > 0;
  $: urlPreview = handleCheck.ok
    ? `/channels/${handleCheck.canonical}`
    : name.trim()
      ? `/channels/${canonicalizeHandle(name)}`
      : '';

  async function handleCreate() {
    isSubmitting = true;
    statusMessage = '';

    try {
      if (!handleCheck.ok) {
        statusMessage = handleCheck.error;
        return;
      }

      const result = await createChannel({
        name: handleCheck.display,
        description
      });

      if (!result.ok || !result.slug) {
        statusMessage = result.error ?? 'The channel could not be created.';
        return;
      }

      await navigateAfterCreate(`/channels/${result.slug}`);
    } finally {
      isSubmitting = false;
    }
  }

  function handleDraft() {
    statusMessage = 'Draft saving is not wired yet, but the channel flow is now in place.';
  }
</script>

<CreateFlowLayout>
  <svelte:fragment slot="primary">
    <CreatePanel
      title="Channel setup"
      description="Define the topic surface first. Communities can overlap with it later without replacing it."
    >
      <form class="form-stack" on:submit|preventDefault={handleCreate}>
        <label>
          <span class="field-label">Channel handle</span>
          <input bind:value={name} placeholder="e.g. Dog-Man" />
        </label>
        {#if name.trim()}
          {#if !handleCheck.ok}
            <p class="status-note">{handleCheck.error}</p>
          {:else}
            <p class="helper-text">URL: <code>{urlPreview}</code></p>
          {/if}
        {/if}

        <label>
          <span class="field-label">Description</span>
          <textarea bind:value={description} rows="4"></textarea>
        </label>

        <div class="button-row">
          <button class="button-primary" disabled={!canSubmit || isSubmitting} type="submit">
            {isSubmitting ? 'Creating...' : 'Create Channel'}
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
      description="How the new topic surface will appear in lists."
      surface="transparent"
    >
      <PreviewTile
        title={handleCheck.ok ? handleCheck.display : name.trim() || 'Untitled channel'}
        body={description.trim() || 'Describe the topic this channel gathers without turning it into a social group.'}
        meta="Topic channel"
      />
    </CreatePanel>

    <CreatePanel title="Discovery note" description="What makes a channel different from a community.">
      <p class="helper-text">
        Channels stay topic-based. They gather related threads and project activity without defining who belongs together socially.
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
