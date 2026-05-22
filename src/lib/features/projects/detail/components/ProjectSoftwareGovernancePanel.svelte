<script lang="ts">
  import type {
    ProjectSoftwareGovernanceData,
    ProjectSoftwareMergeCapabilityChangeInput,
    ProjectSoftwarePullRequestInput,
    ProjectSoftwareRepositoryReplacementInput
  } from '$lib/types/detail';
  import { formatProjectVoteRequirement, formatProjectVoteSummary } from '$lib/utils/projectVotes';
  import { formatRelativeTime } from '$lib/utils/time';

  export let governance: ProjectSoftwareGovernanceData | null = null;
  export let createPullRequest: (input: ProjectSoftwarePullRequestInput) => void | Promise<void> = () => {};
  export let requestMergeCapabilityChange: (
    input: ProjectSoftwareMergeCapabilityChangeInput
  ) => void | Promise<void> = () => {};
  export let requestRepositoryReplacement: (
    input: ProjectSoftwareRepositoryReplacementInput
  ) => void | Promise<void> = () => {};
  export let recordMerge: (requestId: string, mergeId: string) => void | Promise<void> = () => {};

  let showComposer = false;
  let showRepositoryReplacementComposer = false;
  let showActiveVotes = false;
  let form: ProjectSoftwarePullRequestInput = {
    title: '',
    summary: '',
    pullRequestId: '',
    pullRequestUrl: ''
  };
  let repositoryReplacementForm: ProjectSoftwareRepositoryReplacementInput = {
    repositoryUrl: '',
    reason: '',
    relatedPullRequestId: ''
  };
  let mergeIdsByRequestId: Record<string, string> = {};
  $: void requestMergeCapabilityChange;

  function toggleRepositoryReplacementComposer() {
    showRepositoryReplacementComposer = !showRepositoryReplacementComposer;

    if (showRepositoryReplacementComposer) {
      repositoryReplacementForm = {
        repositoryUrl: '',
        reason: '',
        relatedPullRequestId: governance?.replaceablePullRequests[0]?.id ?? ''
      };
    }
  }

  async function submitPullRequest() {
    if (
      !form.title.trim() ||
      !form.summary.trim() ||
      !form.pullRequestId.trim() ||
      !form.pullRequestUrl.trim()
    ) {
      return;
    }

    await createPullRequest({
      title: form.title.trim(),
      summary: form.summary.trim(),
      pullRequestId: form.pullRequestId.trim(),
      pullRequestUrl: form.pullRequestUrl.trim()
    });

    form = {
      title: '',
      summary: '',
      pullRequestId: '',
      pullRequestUrl: ''
    };
    showComposer = false;
  }

  async function submitRepositoryReplacement() {
    if (
      !repositoryReplacementForm.repositoryUrl.trim() ||
      !repositoryReplacementForm.reason.trim() ||
      !repositoryReplacementForm.relatedPullRequestId.trim()
    ) {
      return;
    }

    await requestRepositoryReplacement({
      repositoryUrl: repositoryReplacementForm.repositoryUrl.trim(),
      reason: repositoryReplacementForm.reason.trim(),
      relatedPullRequestId: repositoryReplacementForm.relatedPullRequestId.trim()
    });

    showRepositoryReplacementComposer = false;
    repositoryReplacementForm = {
      repositoryUrl: '',
      reason: '',
      relatedPullRequestId: ''
    };
  }

  async function submitMerge(requestId: string) {
    const mergeId = mergeIdsByRequestId[requestId]?.trim() ?? '';

    if (!mergeId) {
      return;
    }

    await recordMerge(requestId, mergeId);
    mergeIdsByRequestId = {
      ...mergeIdsByRequestId,
      [requestId]: ''
    };
  }

  function normalizeExternalUrl(value: string | null | undefined) {
    const trimmed = value?.trim() ?? '';

    if (!trimmed) {
      return '';
    }

    if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed)) {
      return trimmed;
    }

    return `https://${trimmed}`;
  }

  function normalizedLicenseLabel(value: string) {
    return value.replace(/\s*by\s+default\.?$/i, '');
  }

  $: mergeCapabilitySummary =
    governance && governance.mergeCapabilityMembers.length > 0
      ? governance.mergeCapabilityMembers.map((member) => member.username).join(', ')
      : 'No merge-capable members recorded yet.';
  $: activePullRequestVotes =
    governance?.pullRequests.filter(
      (request) => request.stage === 'approval' || request.stage === 'confirmation'
    ) ?? [];
  $: mergeQueueRequests =
    governance?.pullRequests.filter(
      (request) => request.stage === 'awaiting-merge' && request.viewerCanRecordMerge && !request.mergeId
    ) ?? [];
  $: activeVoteCount =
    governance === null
      ? 0
      : governance.mergeCapabilityChangeRequests.filter((request) => request.canStillPass && !request.passesApprovalThreshold).length +
        governance.repositoryReplacementRequests.filter((request) => request.canStillPass && !request.passesApprovalThreshold).length +
        activePullRequestVotes.length;
</script>

{#if governance}
  <section class="software-panel">
    <div class="panel-header">
      <div>
        <h3>Software governance</h3>
        <p>Pull requests move through approval, merge recording, and merge confirmation without leaving the project lifecycle.</p>
      </div>
      <div class="panel-actions">
        {#if governance.viewerCanCreatePullRequests}
          <button class="secondary-button" type="button" on:click={() => (showComposer = !showComposer)}>
            {showComposer ? 'Hide PR form' : 'New pull request'}
          </button>
        {/if}
        {#if activeVoteCount > 0}
          <button class="secondary-button notification-button" type="button" on:click={() => (showActiveVotes = !showActiveVotes)}>
            {showActiveVotes ? 'Hide active votes' : 'Active votes'}
            <span class="notification-count">{activeVoteCount}</span>
          </button>
        {/if}
        {#if governance.viewerCanRequestRepositoryReplacement}
          <button class="secondary-button" type="button" on:click={toggleRepositoryReplacementComposer}>
            {showRepositoryReplacementComposer ? 'Hide repository form' : 'Propose repository replacement'}
          </button>
        {/if}
      </div>
    </div>

    <div class="detail-card metadata-lines">
      <p>
        Official repository:
        <a class="repo-link" href={normalizeExternalUrl(governance.repositoryUrl)} rel="noreferrer" target="_blank">{governance.repositoryUrl}</a>
      </p>
      <p>License: {normalizedLicenseLabel(governance.licenseLabel)}</p>
      <p>Merge Capability: {mergeCapabilitySummary}</p>
    </div>

    {#if governance.repositoryHistory.length > 0}
      <div class="detail-card">
        <span>Repository replacement history</span>
        <div class="history-list">
          {#each governance.repositoryHistory as entry}
            <div class="history-item">
              <strong>{entry.repositoryUrl}</strong>
              <small>Replaced {entry.previousRepositoryUrl} after {entry.relatedPullRequestId}</small>
              <small>{entry.reason}</small>
              <small>Recorded by {entry.replacedByUsername} {formatRelativeTime(entry.replacedAt)}</small>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if governance.viewerCanRequestRepositoryReplacement && showRepositoryReplacementComposer}
      <div class="composer-card">
        <label>
          <span class="field-label">Blocked pull request</span>
          <select bind:value={repositoryReplacementForm.relatedPullRequestId}>
            <option value="" disabled>Select blocked pull request</option>
            {#each governance.replaceablePullRequests as request}
              <option value={request.id}>{request.pullRequestId} · {request.stageLabel}</option>
            {/each}
          </select>
        </label>
        <input
          bind:value={repositoryReplacementForm.repositoryUrl}
          maxlength="240"
          placeholder="Replacement repository URL"
        />
        <textarea
          bind:value={repositoryReplacementForm.reason}
          rows="3"
          placeholder="Why does this repository replacement need to happen?"
        ></textarea>
        <div class="composer-actions">
          <button class="secondary-button" type="button" on:click={toggleRepositoryReplacementComposer}>Cancel</button>
          <button class="primary-button" type="button" on:click={submitRepositoryReplacement}>
            Submit replacement vote
          </button>
        </div>
      </div>
    {/if}

    {#if governance.viewerCanCreatePullRequests && showComposer}
      <div class="composer-card">
        <input bind:value={form.title} maxlength="120" placeholder="Pull request title" />
        <div class="composer-grid">
          <input bind:value={form.pullRequestId} maxlength="40" placeholder="PR number or ID" />
          <input bind:value={form.pullRequestUrl} maxlength="240" placeholder="Pull request URL" />
        </div>
        <textarea bind:value={form.summary} rows="3" placeholder="What does this pull request change?"></textarea>
        <div class="composer-actions">
          <button class="secondary-button" type="button" on:click={() => (showComposer = false)}>Cancel</button>
          <button class="primary-button" type="button" on:click={submitPullRequest}>Submit for approval</button>
        </div>
      </div>
    {/if}

    {#if mergeQueueRequests.length > 0}
      <div class="request-stack">
        <h4 class="stack-title">Merge record queue</h4>
        {#each mergeQueueRequests as request}
          <article class="request-card pull-request-card">
            <div class="request-head">
              <div>
                <h4>{request.title}</h4>
                <p>{request.summary}</p>
              </div>
              <span class="stage-pill">Awaiting merge record</span>
            </div>

            <div class="pull-request-meta">
              <small>Opened by {request.authorUsername} {formatRelativeTime(request.createdAt)}</small>
            </div>

            <div class="pull-request-links">
              <div class="detail-card">
                <span>PR ID</span>
                <strong>{request.pullRequestId}</strong>
              </div>
              <div class="detail-card">
                <span>PR URL</span>
                <a href={normalizeExternalUrl(request.pullRequestUrl)} rel="noreferrer" target="_blank">
                  {request.pullRequestUrl}
                </a>
              </div>
            </div>

            <div class="merge-entry">
              <span class="governance-subsection-title">Submit merge ID</span>
              <div class="merge-row">
                <input bind:value={mergeIdsByRequestId[request.id]} maxlength="120" placeholder="Merge commit or release ID" />
                <button class="primary-button" type="button" on:click={() => submitMerge(request.id)}>
                  Submit merge ID
                </button>
              </div>
            </div>
          </article>
        {/each}
      </div>
    {/if}

    {#if showActiveVotes}
      <div class="request-stack">
      {#if governance.mergeCapabilityChangeRequests.length > 0}
        <h4 class="stack-title">Open merge capability votes</h4>
        {#each governance.mergeCapabilityChangeRequests as request}
          <article class="request-card">
            <div class="request-head">
              <div>
                <h4>{request.actionLabel}</h4>
                <p>{request.targetMember.username}</p>
              </div>
              <span class="stage-pill">Open vote</span>
            </div>

            <div class="detail-card">
              <span>Requested by</span>
              <strong>{request.authorUsername}</strong>
              <small>{formatRelativeTime(request.createdAt)}</small>
            </div>

            {#if request.voteSummary}
              <div class="vote-card">
                <strong>{formatProjectVoteSummary(request.voteSummary)}</strong>
                <small>{formatProjectVoteRequirement(request.voteSummary, request.approvalThresholdPercent)}</small>
                <small>Vote from the History tab.</small>
              </div>
            {/if}
          </article>
        {/each}
      {/if}

      {#if governance.repositoryReplacementRequests.length > 0}
        <h4 class="stack-title">Open repository replacement votes</h4>
        {#each governance.repositoryReplacementRequests as request}
          <article class="request-card">
            <div class="request-head">
              <div>
                <h4>Repository replacement</h4>
                <p>{request.repositoryUrl}</p>
              </div>
              <span class="stage-pill">Open vote</span>
            </div>

            <div class="software-grid">
              <div class="detail-card">
                <span>Current repository</span>
                <a href={normalizeExternalUrl(request.previousRepositoryUrl)} rel="noreferrer" target="_blank">
                  {request.previousRepositoryUrl}
                </a>
              </div>
              <div class="detail-card">
                <span>Blocked pull request</span>
                <strong>{request.relatedPullRequestId}</strong>
              </div>
            </div>

            <div class="detail-card">
              <span>Reason</span>
              <strong>{request.reason}</strong>
              <small>Requested by {request.authorUsername} {formatRelativeTime(request.createdAt)}</small>
            </div>

            {#if request.voteSummary}
              <div class="vote-card">
                <strong>{formatProjectVoteSummary(request.voteSummary)}</strong>
                <small>{formatProjectVoteRequirement(request.voteSummary, request.approvalThresholdPercent)}</small>
                <small>Vote from the History tab.</small>
              </div>
            {/if}
          </article>
        {/each}
      {/if}

      {#if activePullRequestVotes.length > 0}
        <h4 class="stack-title">Pull requests</h4>
        {#each activePullRequestVotes as request}
          <article class="request-card pull-request-card">
            <div class="request-head">
              <div>
                <h4>{request.title}</h4>
                <p>{request.summary}</p>
              </div>
              <span class="stage-pill">{request.stageLabel}</span>
            </div>

            <div class="pull-request-meta">
              <small>Opened by {request.authorUsername} {formatRelativeTime(request.createdAt)}</small>
            </div>

            <div class="pull-request-links">
              <div class="detail-card">
                <span>PR ID</span>
                <strong>{request.pullRequestId}</strong>
              </div>
              <div class="detail-card">
                <span>PR URL</span>
                <a href={normalizeExternalUrl(request.pullRequestUrl)} rel="noreferrer" target="_blank">
                  {request.pullRequestUrl}
                </a>
              </div>
            </div>

            {#if request.voteSummary}
              <div class="governance-subsection compact">
                <div class="vote-card">
                  <strong>{formatProjectVoteSummary(request.voteSummary)}</strong>
                  <small>{formatProjectVoteRequirement(request.voteSummary, request.approvalThresholdPercent)}</small>
                  <small>
                    {#if request.stage === 'approval'}
                      Vote from the History tab.
                    {:else if request.stage === 'confirmation'}
                      Merge recorded. Members now confirm it from the History tab.
                    {:else if request.stage === 'awaiting-merge'}
                      Approved. Waiting for merge ID submission.
                    {:else}
                      Vote record.
                    {/if}
                  </small>
                </div>
              </div>
            {/if}

            {#if request.mergeId}
              <div class="governance-subsection">
                <div class="detail-card">
                  <span>Merged commit</span>
                  <strong>{request.mergeId}</strong>
                  {#if request.mergedByUsername}
                    <small>Recorded by {request.mergedByUsername}</small>
                  {/if}
                </div>
              </div>
            {/if}
          </article>
        {/each}
      {:else if governance.mergeCapabilityChangeRequests.length === 0 && governance.repositoryReplacementRequests.length === 0}
        <div class="empty-card">No software governance decisions are active in this project yet.</div>
      {/if}
      </div>
    {/if}
  </section>
{/if}

<style>
  .software-panel,
  .software-grid,
  .composer-card,
  .request-stack,
  .request-card,
  .vote-card {
    display: grid;
    gap: 12px;
  }

  .panel-header,
  .panel-actions,
  .composer-actions,
  .merge-row,
  .request-head {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .panel-header h3,
  .panel-header p,
  .request-head h4,
  .request-head p {
    margin: 0;
  }

  .panel-header p,
  .empty-card,
  .detail-card span,
  .detail-card small,
  .vote-card small,
  .field-label,
  .stack-title {
    color: var(--text-soft);
  }

  .composer-card,
  .detail-card,
  .request-card,
  .empty-card,
  .vote-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .detail-card {
    display: grid;
    gap: 4px;
  }

  .metadata-lines p {
    margin: 0;
  }

  .history-list,
  .history-item {
    display: grid;
    gap: 6px;
  }

  .stack-title {
    margin: 0;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .notification-button {
    gap: 8px;
  }

  .notification-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--status-green) 84%, var(--panel));
    color: var(--page-bg);
    font-size: 11px;
    font-weight: 800;
    line-height: 1;
  }

  .governance-subsection {
    display: grid;
    gap: 8px;
  }

  .governance-subsection.compact {
    gap: 0;
  }

  .pull-request-card {
    gap: 10px;
  }

  .pull-request-meta {
    color: var(--text-soft);
    font-size: 12px;
  }

  .pull-request-links {
    display: grid;
    gap: 10px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .merge-entry {
    display: grid;
    gap: 8px;
    padding-top: 2px;
  }

  .governance-subsection-title {
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-soft);
    font-weight: 700;
  }

  .repo-link {
    text-decoration: underline;
    text-underline-offset: 2px;
    font-weight: 700;
  }

  .stage-pill {
    padding: 6px 10px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel);
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .composer-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  label {
    display: grid;
    gap: 6px;
  }

  input,
  select,
  textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-main);
  }

  textarea {
    min-height: 96px;
    resize: vertical;
  }

  .primary-button,
  .secondary-button {
    padding: 8px 12px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 700;
  }

  .primary-button {
    background: var(--brand);
    color: var(--page-bg);
  }

  .secondary-button {
    border: 1px solid var(--panel-border);
    background: var(--panel);
    color: var(--text-soft);
  }

  @media (max-width: 720px) {
    .composer-grid,
    .software-grid,
    .pull-request-links {
      grid-template-columns: minmax(0, 1fr);
    }

    .merge-row {
      align-items: stretch;
    }
  }
</style>