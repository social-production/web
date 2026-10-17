<script lang="ts">
  import { errorMessage } from '$lib/services/errors';
  import { invalidateAll } from '$app/navigation';
  import OverlaySheet from '$lib/components/shared/OverlaySheet.svelte';
  import ScopeAvatar from './ScopeAvatar.svelte';
  import { scopeSettingsApi } from '$lib/services/commands/scopes';
  import { refreshBootstrap } from '$lib/services/queries/bootstrap';
  import { showToast } from '$lib/stores/toast';
  import { validateHandle } from '$lib/utils/handles';
  import { askConfirm } from '$lib/stores/confirmDialog';
  import { describeScopeProposal } from './scopeProposals';
  import type { ScopeSettings, ScopeSettingsKind } from '$lib/types/scopeSettings';

  /** Gear sheet: picture, name, description, and (private communities) who decides. */
  export let open = false;
  export let kind: ScopeSettingsKind;
  export let slug: string;

  let settings: ScopeSettings | null = null;
  let loadError = '';
  let name = '';
  let description = '';
  let pendingImage: { imageKey: string; contentType: string; preview: string } | null = null;
  let busy = false;
  let organizerDraft = '';
  let removeDraft = '';
  let fileInput: HTMLInputElement | null = null;

  $: if (open) void load();

  async function load() {
    const api = scopeSettingsApi();
    if (!api) return;
    try {
      settings = await api.get(kind, slug);
      name = settings.name;
      description = settings.description;
      pendingImage = null;
      loadError = '';
    } catch (err) {
      loadError = errorMessage(err, 'Could not load settings.');
    }
  }

  async function run(action: () => Promise<ScopeSettings>, done: string, closeAfter = false) {
    busy = true;
    try {
      const before = settings?.proposals.length ?? 0;
      settings = await action();
      const opened = settings.proposals.length > before;
      showToast(opened ? 'Vote started' : done);
      if (closeAfter) {
        pendingImage = null;
        open = false;
      }
      busy = false;
      // Refresh the page and the left rail (which reads names and pictures from bootstrap)
      // without holding the sheet open.
      await refreshBootstrap();
      await invalidateAll();
    } catch (err) {
      showToast(errorMessage(err, 'Something went wrong'), 'error');
    } finally {
      busy = false;
    }
  }

  async function chooseImage(event: Event) {
    const api = scopeSettingsApi();
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!api || !file) return;
    busy = true;
    try {
      const uploaded = await api.uploadImage(kind, slug, file);
      pendingImage = { ...uploaded, preview: URL.createObjectURL(file) };
    } catch (err) {
      showToast(errorMessage(err, 'Could not upload that picture.'), 'error');
    } finally {
      busy = false;
    }
  }

  function save() {
    const api = scopeSettingsApi();
    if (!api || !settings) return;
    if (nameError) {
      showToast(nameError, 'error');
      return;
    }
    const input = {
      name: name.trim() !== settings.name ? name.trim() : undefined,
      description: description.trim() !== settings.description ? description.trim() : undefined,
      imageKey: pendingImage?.imageKey,
      imageContentType: pendingImage?.contentType,
    };
    if (!input.name && !input.description && !input.imageKey) {
      showToast('Nothing has changed', 'error');
      return;
    }
    void run(() => api.edit(kind, slug, input), 'Saved', true);
  }

  // Organizer-controlled: only organizers can change things, so others see a read-only form.
  $: canEdit = Boolean(
    settings?.viewerIsMember && (settings.governance === 'collaborative' || settings.viewerEditsDirectly)
  );
  $: nameLabel = kind === 'community' ? 'Community name' : 'Channel name';
  $: nameCheck = validateHandle(name, nameLabel);
  $: nameError =
    settings && name.trim() !== settings.name && !nameCheck.ok ? nameCheck.error : '';

  $: changed = Boolean(
    settings &&
    (pendingImage || name.trim() !== settings.name || description.trim() !== settings.description)
  );
</script>

<OverlaySheet bind:open title="Settings" labelledById="scope-settings-title">
  <div class="settings-body">
    {#if loadError}
      <p class="error">{loadError}</p>
    {:else if settings}
      <section class="picture-row">
        <ScopeAvatar
          imageUrl={pendingImage?.preview ?? settings.imageUrl}
          kind={slug === 'platform' ? 'platform' : kind}
          size={64}
        />
        <div class="picture-copy">
          {#if canEdit}
            <button
              class="text-button"
              type="button"
              disabled={busy}
              on:click={() => fileInput?.click()}
            >
              {settings.imageUrl || pendingImage ? 'Change picture' : 'Add a picture'}
            </button>
          {/if}
          <span>Shown on cards and at the top of the page.</span>
        </div>
        <input
          bind:this={fileInput}
          class="file-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          on:change={chooseImage}
        />
      </section>

      <label class="field">
        <span>Name</span>
        <input
          bind:value={name}
          maxlength="32"
          aria-invalid={nameError ? 'true' : undefined}
          aria-describedby="scope-name-hint"
          disabled={!canEdit}
        />
        <span id="scope-name-hint" class="hint" class:name-error={Boolean(nameError)}>
          {nameError || 'Shown as one word: letters, numbers, - or _ (no spaces).'}
        </span>
      </label>
      <label class="field">
        <span>Description</span>
        <textarea
          bind:value={description}
          rows="4"
          maxlength="2000"
          disabled={!canEdit}
        ></textarea>
      </label>

      <p class="how">
        {#if settings.viewerEditsDirectly}
          You're an organizer, so changes apply straight away.
        {:else if settings.governance === 'organizer'}
          Read only. Organizers ({settings.organizers.join(', ')}) look after these settings.
        {:else}
          Collaborative: changes go to a member vote (66% yes, with quorum based on {settings.quorumBasis}).
        {/if}
      </p>

      {#if settings.viewerIsMember && (settings.governance === 'collaborative' || settings.viewerEditsDirectly)}
        <button class="primary" type="button" disabled={busy || !changed || Boolean(nameError)} on:click={save}>
          {settings.viewerEditsDirectly ? 'Save' : 'Propose change'}
        </button>
      {/if}

      {#if settings.proposals.length > 0}
        <section class="decisions">
          <h3>Open decisions</h3>
          <ul>
            {#each settings.proposals as item (item.id)}
              <li>
                <strong>{describeScopeProposal(item)}</strong>
                <span>
                  {item.yes} yes · {item.no} no · {item.votesRequired} needed{#if item.viewerVote}
                    · you voted {item.viewerVote === 'yes' ? 'Yes' : 'No'}{/if}
                </span>
              </li>
            {/each}
          </ul>
        </section>
      {/if}

      {#if settings.recentDecisions.length > 0}
        <section class="decisions">
          <h3>Past decisions</h3>
          <ul>
            {#each settings.recentDecisions as item (item.id)}
              <li>
                <strong>{describeScopeProposal(item)}</strong>
                <span>
                  {item.outcome === 'passed' ? 'Passed' : 'Rejected'} · {item.yes} yes · {item.no} no{#if item.closedAt}
                    · {new Date(item.closedAt).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}{/if}{#if item.proposer} · proposed by {item.proposer}{/if}
                </span>
              </li>
            {/each}
          </ul>
        </section>
      {/if}

      {#if settings.isPrivate}
        <section class="governance">
          <h3>Who decides</h3>
          <p>
            {settings.governance === 'organizer'
              ? `Organizers: ${settings.organizers.join(', ') || 'none'}`
              : 'Collaborative: all members vote on changes.'}
          </p>

          {#if settings.viewerEditsDirectly}
            <div class="inline-field">
              <input bind:value={organizerDraft} placeholder="Username to make organizer" />
              <button
                type="button"
                disabled={busy || !organizerDraft.trim()}
                on:click={() => {
                  const api = scopeSettingsApi();
                  if (api)
                    void run(
                      () => api.setOrganizer(kind, slug, organizerDraft.trim(), true),
                      'Organizer added'
                    );
                  organizerDraft = '';
                }}>Add</button
              >
            </div>
            <button
              class="secondary"
              type="button"
              disabled={busy}
              on:click={() => {
                const api = scopeSettingsApi();
                if (api)
                  void run(
                    () => api.propose(kind, slug, { kind: 'to_collaborative' }),
                    'Vote started'
                  );
              }}
            >
              Hand decisions to all members
            </button>
            <span class="hint">Needs 66% of organizers to agree.</span>
          {:else if settings.governance === 'collaborative' && settings.viewerIsMember}
            <button
              class="secondary"
              type="button"
              disabled={busy}
              on:click={() => {
                const api = scopeSettingsApi();
                if (api)
                  void run(() => api.propose(kind, slug, { kind: 'to_organizer' }), 'Vote started');
              }}
            >
              Propose organizer control (you as organizer)
            </button>
          {/if}

          {#if settings.viewerEditsDirectly || (settings.governance === 'collaborative' && settings.viewerIsMember)}
            <div class="inline-field">
              <input bind:value={removeDraft} placeholder="Username to remove" />
              <button
                type="button"
                disabled={busy || !removeDraft.trim()}
                on:click={async () => {
                  const api = scopeSettingsApi();
                  const username = removeDraft.trim();
                  if (!api || !username) return;
                  if (settings?.viewerEditsDirectly) {
                    const ok = await askConfirm({
                      title: `Remove ${username}?`,
                      body: "They lose access straight away and will need a new invite to come back.",
                      confirmLabel: 'Remove',
                      danger: true
                    });
                    if (!ok) return;
                  }
                  void run(() => api.removeMember(kind, slug, username), 'Member removed');
                  removeDraft = '';
                }}>{settings.viewerEditsDirectly ? 'Remove' : 'Propose'}</button
              >
            </div>
          {/if}
        </section>
      {/if}
    {:else}
      <p class="how">Loading…</p>
    {/if}
  </div>
</OverlaySheet>

<style>
  .settings-body {
    display: grid;
    gap: 14px;
    padding: 16px 20px 24px;
  }

  .picture-row {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .picture-copy {
    display: grid;
    gap: 2px;
  }

  .picture-copy span,
  .how,
  .hint,
  .governance p {
    margin: 0;
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.4;
  }

  .file-input {
    display: none;
  }

  .field {
    display: grid;
    gap: 6px;
    font-size: 13px;
    font-weight: 700;
  }

  .field input,
  .field textarea,
  .inline-field input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--panel-border);
    border-radius: 10px;
    background: var(--panel-strong);
    color: var(--text-main);
    font: inherit;
    font-weight: 400;
    resize: vertical;
  }

  .decisions h3 {
    margin: 0 0 6px;
    font-size: 14px;
  }

  .decisions ul {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .decisions li {
    display: grid;
    gap: 2px;
    font-size: 13px;
  }

  .decisions li span {
    color: var(--text-soft);
  }

  /* Read-only for people who can't change settings: plainly not an input to type in. */
  .field input:disabled,
  .field textarea:disabled {
    border-style: dashed;
    background: transparent;
    color: var(--text-soft);
    cursor: not-allowed;
    resize: none;
  }

  .text-button {
    justify-self: start;
    padding: 0;
    border: 0;
    background: none;
    color: var(--brand-strong);
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  .primary,
  .secondary,
  .inline-field button {
    min-height: 42px;
    padding: 0 16px;
    border-radius: 999px;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  .primary {
    border: 0;
    background: var(--brand);
    color: var(--on-brand, #fff);
  }

  .primary:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .secondary,
  .inline-field button {
    border: 1px solid var(--panel-border);
    background: var(--panel-strong);
    color: var(--text-main);
  }

  .governance {
    display: grid;
    gap: 10px;
    padding-top: 14px;
    border-top: 1px solid var(--panel-border);
  }

  .governance h3 {
    margin: 0;
    font-size: 15px;
  }

  .inline-field {
    display: flex;
    gap: 8px;
  }

  .hint.name-error {
    color: var(--danger, #c0392b);
  }

  .error {
    color: var(--danger);
  }
</style>
