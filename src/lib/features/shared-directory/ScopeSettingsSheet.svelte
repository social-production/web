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
  import { formatRelativeTime } from '$lib/utils/time';
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
  let tab: 'settings' | 'decisions' = 'settings';

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

  function castVote(proposalId: string, vote: 'yes' | 'no') {
    const api = scopeSettingsApi();
    if (api) void run(() => api.vote(proposalId, vote), 'Vote recorded');
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
  <svelte:fragment slot="toolbar">
    <div class="sheet-tabs" role="tablist" aria-label="Settings sections">
      <button
        type="button"
        role="tab"
        aria-selected={tab === 'settings'}
        class:active={tab === 'settings'}
        on:click={() => (tab = 'settings')}>Settings</button
      >
      <button
        type="button"
        role="tab"
        aria-selected={tab === 'decisions'}
        class:active={tab === 'decisions'}
        on:click={() => (tab = 'decisions')}
      >
        Decisions
        {#if settings?.proposals.length}<span class="tab-count">{settings.proposals.length}</span>{/if}
      </button>
    </div>
  </svelte:fragment>
  <div class="settings-body">
    {#if loadError}
      <p class="error">{loadError}</p>
    {:else if settings && tab === 'decisions'}
      <section class="decisions" aria-label="Decisions">
        <div class="group-head">
          <h3>Open decisions</h3>
          <span>{settings.proposals.length}</span>
        </div>
        {#if settings.proposals.length === 0}
          <p class="empty-card">No open decisions.</p>
        {:else}
          <div class="decision-list">
            {#each settings.proposals as item (item.id)}
              <article class="decision-card open">
                <div class="decision-row">
                  <strong>{describeScopeProposal(item)}</strong>
                  <span>{item.votesRequired} yes needed · 66%</span>
                </div>
                <div class="decision-row">
                  <span>
                    {item.yes} yes · {item.no} no{#if item.viewerVote}
                      · you voted {item.viewerVote === 'yes' ? 'Yes' : 'No'}{/if}
                  </span>
                  <span>
                    {[item.proposer ?? 'Someone', item.createdAt ? formatRelativeTime(item.createdAt) : '']
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </div>
                {#if item.viewerCanVote}
                  <div class="vote-row">
                    <button
                      type="button"
                      class:chosen={item.viewerVote === 'yes'}
                      disabled={busy}
                      on:click={() => castVote(item.id, 'yes')}>Yes</button
                    >
                    <button
                      type="button"
                      class:chosen={item.viewerVote === 'no'}
                      disabled={busy}
                      on:click={() => castVote(item.id, 'no')}>No</button
                    >
                  </div>
                {:else if !settings.viewerIsMember}
                  <p class="vote-note">Members vote on this. Join to take part.</p>
                {:else if !item.viewerVote}
                  <p class="vote-note">New accounts can vote after their warm-up.</p>
                {/if}
              </article>
            {/each}
          </div>
        {/if}

        <div class="group-head">
          <h3>Past decisions</h3>
          <span>{settings.recentDecisions.length}</span>
        </div>
        {#if settings.recentDecisions.length === 0}
          <p class="empty-card">No past decisions yet.</p>
        {:else}
          <div class="decision-list">
            {#each settings.recentDecisions as item (item.id)}
              <article
                class="decision-card"
                class:approved={item.outcome === 'passed'}
                class:rejected={item.outcome !== 'passed'}
              >
                <div class="decision-row">
                  <strong>{describeScopeProposal(item)}</strong>
                  <span>{item.outcome === 'passed' ? 'Passed' : 'Rejected'}</span>
                </div>
                <div class="decision-row">
                  <span>{item.yes} yes · {item.no} no</span>
                  <span>
                    {[
                      item.proposer ?? 'Someone',
                      item.closedAt
                        ? new Date(item.closedAt).toLocaleDateString(undefined, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                        : ''
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </div>
              </article>
            {/each}
          </div>
        {/if}
      </section>
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

  .sheet-tabs {
    display: flex;
    padding: 0 8px;
    border-bottom: 1px solid color-mix(in srgb, var(--panel-border) 70%, transparent);
  }

  .sheet-tabs button {
    display: inline-flex;
    flex: 1 1 0;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 40px;
    padding: 0 8px;
    border: 0;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: var(--text-soft);
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }

  .sheet-tabs button.active {
    border-bottom-color: var(--brand);
    color: var(--text-main);
  }

  .tab-count {
    min-width: 18px;
    padding: 0 6px;
    border-radius: 999px;
    background: #e6b325;
    color: #1f1600;
    font-size: 11px;
    line-height: 18px;
  }

  .decisions {
    display: grid;
    gap: 10px;
  }

  .group-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .group-head h3 {
    margin: 0;
    font-size: 15px;
  }

  .group-head span {
    color: var(--text-soft);
  }

  .empty-card {
    margin: 0;
    padding: 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-soft);
    font-size: 13px;
  }

  /* Same look as the History tab on projects and events. */
  .decision-list {
    display: grid;
    overflow: hidden;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .decision-card {
    display: grid;
    gap: 6px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--panel-border);
    border-left: 3px solid transparent;
  }

  .decision-card:last-child {
    border-bottom: 0;
  }

  .decision-card.open {
    border-left-color: #e6b325;
  }

  .decision-card.approved {
    border-left-color: #2f9e44;
  }

  .decision-card.rejected {
    border-left-color: #e03131;
  }

  .vote-note {
    margin: 0;
    color: var(--text-soft);
    font-size: 12px;
  }

  .decision-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) max-content;
    gap: 12px;
    align-items: center;
    color: var(--text-soft);
    font-size: 12px;
  }

  .decision-row strong {
    color: var(--text-main);
    font-size: 14px;
  }

  .decision-row span:last-child {
    text-align: right;
  }

  .vote-row {
    display: flex;
    gap: 8px;
  }

  .vote-row button {
    min-height: 34px;
    padding: 0 16px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel-strong);
    color: var(--text-main);
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  .vote-row button.chosen {
    border-color: var(--brand);
    background: var(--brand);
    color: var(--on-brand, #fff);
  }

  @media (max-width: 520px) {
    .decision-row {
      grid-template-columns: minmax(0, 1fr);
    }

    .decision-row span:last-child {
      text-align: left;
    }
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
