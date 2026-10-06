<script lang="ts">
  import CreateFlowLayout from '$lib/features/create/shared/CreateFlowLayout.svelte';
  import RequiredFieldLabel from '$lib/components/shared/RequiredFieldLabel.svelte';
  import CreatePanel from '$lib/features/create/shared/CreatePanel.svelte';
  import { createCommunity } from '$lib/services/commands/create';
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
        joinPolicy: openness,
        slug: handleCheck.canonical
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

</script>

<CreateFlowLayout
  title="Create community"
  description="A community is a social space that connects people to projects and discussion, without forcing every topic into one channel."
  submitLabel="Create community"
  submittingLabel="Creating..."
  {canSubmit}
  {isSubmitting}
  on:submit={handleCreate}
>
  <svelte:fragment slot="primary">
    <CreatePanel bare>
      <form class="form-stack" on:submit|preventDefault={handleCreate}>
        <label>
          <RequiredFieldLabel>Community handle</RequiredFieldLabel>
          <input bind:value={name} aria-required="true" placeholder="e.g. neighborhood-group" />
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

        {#if statusMessage}
          <p class="status-note">{statusMessage}</p>
        {/if}
      </form>
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
