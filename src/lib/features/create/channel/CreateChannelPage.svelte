<script lang="ts">
  import CreateFlowLayout from '$lib/features/create/shared/CreateFlowLayout.svelte';
  import CreatePanel from '$lib/features/create/shared/CreatePanel.svelte';
  import PreviewTile from '$lib/features/create/shared/PreviewTile.svelte';

  let name = 'Energy Retrofit';
  let description =
    'Discussion and discovery for retrofit planning, installation, and maintenance work.';
  let statusMessage = '';

  $: canSubmit = name.trim().length > 0 && description.trim().length > 0;

  function handleCreate() {
    statusMessage =
      'Frontend preview only for now. Channel persistence will come later, but the modular page structure is ready.';
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
          <span class="field-label">Channel name</span>
          <input bind:value={name} />
        </label>

        <label>
          <span class="field-label">Description</span>
          <textarea bind:value={description} rows="4"></textarea>
        </label>

        <div class="button-row">
          <button class="button-primary" disabled={!canSubmit} type="submit">Create Channel</button>
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
      <PreviewTile title={name} body={description} meta="Topic channel" />
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
</style>