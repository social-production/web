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

<section class="invite-card">
  {#if pageData.membership.viewerIsMember}
    <div class="invite-copy">
      <h2>Invite people</h2>
      <p>Share a link or code, or invite someone directly by username.</p>
    </div>

    <div class="invite-section">
      <h3>Invite link</h3>
      <div class="invite-actions">
        <input
          aria-label={`${pageData.title} invite link`}
          readonly
          type="text"
          value={inviteLoadPending ? 'Creating invite link…' : shareInviteLink}
        />
        <button
          class="tab-chip"
          disabled={!shareInviteLink || inviteLoadPending}
          type="button"
          on:click={() => copyValue(shareInviteLink, 'Invite link copied.')}
        >
          Copy link
        </button>
      </div>
    </div>

    <div class="invite-section">
      <h3>Invite code</h3>
      <div class="invite-actions">
        <input
          aria-label={`${pageData.title} invite code`}
          readonly
          type="text"
          value={inviteLoadPending ? 'Creating invite code…' : inviteToken}
        />
        <button
          class="tab-chip"
          disabled={!inviteToken || inviteLoadPending}
          type="button"
          on:click={() => copyValue(inviteToken, 'Invite code copied.')}
        >
          Copy code
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
          class="tab-chip"
          disabled={!inviteUsername.trim() || inviteUserPending}
          type="button"
          on:click={handleDirectInvite}
        >
          {inviteUserPending ? 'Sending…' : 'Send invite'}
        </button>
      </div>
    </div>
  {:else}
    <div class="invite-copy">
      <h2>Join with invite</h2>
      <p>Paste an invite link or invite code from a community member.</p>
    </div>

    <div class="invite-actions">
      <input
        aria-label={`${pageData.title} invite input`}
        bind:value={inviteDraft}
        placeholder="Paste invite link or invite code"
        type="text"
      />
      <button
        class="tab-chip"
        disabled={!parseInviteToken(inviteDraft) || invitePending}
        type="button"
        on:click={onRedeem}
      >
        Join with invite
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
    gap: 14px;
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .invite-copy,
  .invite-section {
    display: grid;
    gap: 6px;
  }

  .invite-copy h2,
  .invite-section h3 {
    color: var(--text-main);
  }

  .invite-copy h2 {
    font-size: 16px;
  }

  .invite-section h3 {
    font-size: 13px;
    font-weight: 800;
  }

  .invite-copy p,
  .invite-feedback {
    color: var(--text-soft);
    line-height: 1.5;
  }

  .invite-actions,
  .direct-invite-row {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  .invite-actions input {
    flex: 1 1 280px;
  }

  .tab-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 7px 10px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--panel-border);
    background: var(--panel-strong);
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
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
