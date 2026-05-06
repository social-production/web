<script lang="ts">
  import CreateFlowLayout from '$lib/features/create/shared/CreateFlowLayout.svelte';
  import CreatePanel from '$lib/features/create/shared/CreatePanel.svelte';
  import PreviewTile from '$lib/features/create/shared/PreviewTile.svelte';

  let name = 'East Market Retrofit Circle';
  let openness = 'Open';
  let description =
    'Residents, installers, and planners connecting retrofit work across the east side.';
  let statusMessage = '';

  $: canSubmit = name.trim().length > 0 && description.trim().length > 0;

  function handleCreate() {
    statusMessage =
      'Frontend preview only for now. Community persistence will come later, but the modular page structure is ready.';
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
          <span class="field-label">Community name</span>
          <input bind:value={name} />
        </label>

        <label>
          <span class="field-label">Openness</span>
          <select bind:value={openness}>
            <option value="Open">Open</option>
            <option value="Private">Private</option>
          </select>
        </label>

        <label>
          <span class="field-label">Description</span>
          <textarea bind:value={description} rows="4"></textarea>
        </label>

        <div class="button-row">
          <button class="button-primary" disabled={!canSubmit} type="submit">Create Community</button>
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
      <PreviewTile title={name} body={description} meta={`${openness} community`} />
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
</style>