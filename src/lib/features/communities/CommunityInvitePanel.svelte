<script lang="ts">
  import { browser } from '$app/environment';
  import CreateScopeTagSelector from '$lib/features/create/shared/CreateScopeTagSelector.svelte';
  import { commitSingleSuggestion } from '$lib/features/create/shared/createFormActions';
  import { fetchMessageContacts } from '$lib/api/drivers/fastapi/domains/messages';
  import { createScopeInvite, inviteUserToCommunity } from '$lib/services/queries/scopes';
  import type { ScopePageData } from '$lib/types/scope';
  import type { ViewerSummary } from '$lib/types/bootstrap';
  import { parseInviteToken, toAbsoluteInviteLink } from '$lib/utils/invite-token';

  export let pageData: ScopePageData;
  export let variant: 'inline' | 'popover' = 'popover';
  export let active = false;
  export let inviteDraft = '';
  export let invitePending = false;
  export let inviteFeedback = '';
  export let inviteFeedbackTone: 'soft' | 'warning' = 'soft';
  export let onRedeem: () => void | Promise<void> = async () => {};

  let inviteToken = '';
  let invitePath = '';
  let inviteLoadPending = false;
  let inviteUsername = '';
  let inviteUserPending = false;
  let contactRequestId = 0;
  let contactSuggestions: ViewerSummary[] = [];
  let inviteLoaded = false;

  $: shareInviteLink = invitePath ? toAbsoluteInviteLink(invitePath) : '';
  $: normalizedUsernameQuery = inviteUsername.trim().toLowerCase();
  $: usernameSuggestions = contactSuggestions
    .filter((contact) => contact.username.toLowerCase().includes(normalizedUsernameQuery))
    .slice(0, 6);
  $: usernameSuggestionItems = usernameSuggestions.map((contact) => ({
    key: contact.username,
    label: contact.username
  }));

  $: if (
    browser &&
    active &&
    pageData.membership.viewerIsMember &&
    pageData.kind === 'community' &&
    !inviteLoaded &&
    !inviteLoadPending
  ) {
    inviteLoaded = true;
    void loadInviteLink();
  }

  $: if (!active) {
    inviteLoaded = false;
    invitePath = '';
    inviteToken = '';
  }

  $: if (normalizedUsernameQuery.length >= 2) {
    void loadContactSuggestions(normalizedUsernameQuery);
  } else {
    contactSuggestions = [];
  }

  async function loadInviteLink() {
    if (pageData.kind !== 'community') {
      return;
    }

    inviteLoadPending = true;

    try {
      const result = await createScopeInvite('community', pageData.slug);
      invitePath = result.redeemUrl;
      inviteToken = result.token;
    } catch {
      inviteFeedback = 'Could not create an invite link right now.';
      inviteFeedbackTone = 'warning';
    } finally {
      inviteLoadPending = false;
    }
  }

  async function loadContactSuggestions(query: string) {
    const requestId = ++contactRequestId;

    try {
      const items = await fetchMessageContacts(query, 8);
      if (requestId === contactRequestId) {
        contactSuggestions = items;
      }
    } catch {
      if (requestId === contactRequestId) {
        contactSuggestions = [];
      }
    }
  }

  async function copyValue(value: string, successMessage: string) {
    if (!value) {
      return;
    }

    if (!browser || !navigator.clipboard) {
      inviteFeedback = 'Copy the value manually from the field below.';
      inviteFeedbackTone = 'soft';
      return;
    }

    await navigator.clipboard.writeText(value);
    inviteFeedback = successMessage;
    inviteFeedbackTone = 'soft';
  }

  function addInviteUsername(username: string) {
    inviteUsername = username;
    contactSuggestions = [];
  }

  async function handleDirectInvite() {
    const username = inviteUsername.trim();
    if (!username || inviteUserPending || pageData.kind !== 'community') {
      return;
    }

    inviteUserPending = true;
    inviteFeedback = '';
    inviteFeedbackTone = 'soft';

    try {
      const result = await inviteUserToCommunity(pageData.slug, username);
      inviteUsername = '';
      inviteFeedback = result.alreadyMember
        ? `@${result.username} is already in this community.`
        : `Invite sent to @${result.username}.`;
      inviteFeedbackTone = 'soft';
    } catch {
      inviteFeedback = 'That user could not be invited. Check the username and try again.';
      inviteFeedbackTone = 'warning';
    } finally {
      inviteUserPending = false;
    }
  }
</script>

<section class:popover={variant === 'popover'} class="invite-card">
  {#if pageData.membership.viewerIsMember}
    <p class="invite-kicker">Invite people</p>

    <div class="invite-section">
      <label class="field-label" for={`invite-link-${pageData.slug}`}>Invite link</label>
      <div class="invite-actions">
        <input
          id={`invite-link-${pageData.slug}`}
          aria-label={`${pageData.title} invite link`}
          readonly
          type="text"
          value={inviteLoadPending ? 'Creating invite link…' : shareInviteLink}
        />
        <button
          class="action-chip"
          disabled={!shareInviteLink || inviteLoadPending}
          type="button"
          on:click={() => copyValue(shareInviteLink, 'Invite link copied.')}
        >
          Copy
        </button>
      </div>
    </div>

    <div class="invite-section">
      <label class="field-label" for={`invite-code-${pageData.slug}`}>Invite code</label>
      <div class="invite-actions">
        <input
          id={`invite-code-${pageData.slug}`}
          aria-label={`${pageData.title} invite code`}
          readonly
          type="text"
          value={inviteLoadPending ? 'Creating invite code…' : inviteToken}
        />
        <button
          class="action-chip"
          disabled={!inviteToken || inviteLoadPending}
          type="button"
          on:click={() => copyValue(inviteToken, 'Invite code copied.')}
        >
          Copy
        </button>
      </div>
    </div>

    <div class="invite-section">
      <CreateScopeTagSelector
        helperText="Search by username and send a direct invite."
        label="Invite by username"
        placeholder="Type a username"
        bind:query={inviteUsername}
        selectedItems={[]}
        suggestionItems={usernameSuggestionItems}
        onAdd={addInviteUsername}
        onCommitSingleSuggestion={commitSingleSuggestion}
        onRemove={() => {}}
      />
      <div class="direct-invite-row">
        <button
          class="action-chip"
          disabled={!inviteUsername.trim() || inviteUserPending}
          type="button"
          on:click={handleDirectInvite}
        >
          {inviteUserPending ? 'Sending…' : 'Send invite'}
        </button>
      </div>
    </div>
  {:else}
    <p class="invite-kicker">Join with invite</p>
    <p class="invite-copy">Paste an invite link or invite code from a community member.</p>

    <div class="invite-actions">
      <input
        aria-label={`${pageData.title} invite input`}
        bind:value={inviteDraft}
        placeholder="Paste invite link or invite code"
        type="text"
      />
      <button
        class="action-chip"
        disabled={!parseInviteToken(inviteDraft) || invitePending}
        type="button"
        on:click={onRedeem}
      >
        Join
      </button>
    </div>
  {/if}

  {#if inviteFeedback}
    <p class:warning={inviteFeedbackTone === 'warning'} class="invite-feedback">{inviteFeedback}</p>
  {/if}
</section>

<style>
  .invite-card {
    display: grid;
    gap: 10px;
  }

  .invite-card.popover {
    padding: 8px;
    gap: 8px;
    border: none;
    border-radius: 0;
    background: transparent;
  }

  .invite-kicker {
    margin: 0;
    color: var(--text-main);
    font-size: 12px;
    font-weight: 800;
  }

  .invite-copy,
  .invite-feedback {
    margin: 0;
    color: var(--text-soft);
    font-size: 12px;
    line-height: 1.45;
  }

  .invite-section {
    display: grid;
    gap: 6px;
  }

  .field-label {
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .invite-actions,
  .direct-invite-row {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }

  .invite-actions input {
    flex: 1 1 180px;
    min-width: 0;
    height: 32px;
    padding: 0 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-main);
    font-size: 12px;
  }

  .action-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 6px 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--panel-border);
    background: var(--panel-strong);
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
  }

  .warning {
    color: var(--accent-warm-strong);
  }

  @media (max-width: 760px) {
    .invite-actions,
    .direct-invite-row {
      align-items: stretch;
      flex-direction: column;
    }
  }
</style>
