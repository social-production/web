<script lang="ts">
  import SoftwareGovernanceWizard from '$lib/features/projects/detail/components/SoftwareGovernanceWizard.svelte';
  import CountBadge from '$lib/components/shared/CountBadge.svelte';
  import type {
    ProjectApprovalVote,
    ProjectSoftwareGovernanceData,
    ProjectSoftwareMergeCapabilityChangeInput,
    ProjectSoftwarePullRequest,
    ProjectSoftwarePullRequestInput,
    ProjectSoftwareRepositoryReplacementInput
  } from '$lib/types/detail';
  import { formatCompactVoteStatus } from '$lib/utils/projectVotes';
  import { formatRelativeTime } from '$lib/utils/time';

  type SoftwareWizardMode =
    | 'create-pr'
    | 'vote-pr'
    | 'record-merge'
    | 'merge-capability'
    | 'repository-replacement'
    | null;

  export let governance: ProjectSoftwareGovernanceData | null = null;
  export let createPullRequest: (input: ProjectSoftwarePullRequestInput) => void | Promise<void> = () => {};
  export let requestMergeCapabilityChange: (
    input: ProjectSoftwareMergeCapabilityChangeInput
  ) => void | Promise<void> = () => {};
  export let requestRepositoryReplacement: (
    input: ProjectSoftwareRepositoryReplacementInput
  ) => void | Promise<void> = () => {};
  export let recordMerge: (
    requestId: string,
    mergeId: string,
    mergeUrl: string
  ) => void | Promise<void> = () => {};
  export let votePullRequest: (requestId: string, vote: ProjectApprovalVote | null) => void | Promise<void> =
    () => {};
  export let softwareWizardRequest: { mode: 'record-merge' | 'vote-pr'; requestId: string } | null = null;
  export let onSoftwareWizardRequestHandled: () => void = () => {};

  let wizardMode: SoftwareWizardMode = null;
  let wizardOpen = false;
  let activePullRequest: ProjectSoftwarePullRequest | null = null;
  let lastHandledWizardRequestKey = '';
  let expandedPullRequestId = '';
  let prQueueExpanded = false;

  export function openCreatePullRequest() {
    openWizard('create-pr');
  }

  export function openSoftwareWizard(mode: Exclude<SoftwareWizardMode, null>, requestId?: string) {
    const request =
      requestId && governance
        ? governance.pullRequests.find((entry) => entry.id === requestId) ?? null
        : null;
    openWizard(mode, request);
  }

  function openWizard(mode: SoftwareWizardMode, request: ProjectSoftwarePullRequest | null = null) {
    if (request) {
      prQueueExpanded = true;
      expandedPullRequestId = request.id;
    }
    wizardMode = mode;
    activePullRequest = request;
    wizardOpen = true;
  }

  function closeWizard() {
    wizardOpen = false;
    wizardMode = null;
    activePullRequest = null;
  }

  function normalizeExternalUrl(value: string | null | undefined) {
    const trimmed = value?.trim() ?? '';
    if (!trimmed) return '';
    if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }

  function normalizedLicenseLabel(value: string) {
    return value.replace(/\s*by\s+default\.?$/i, '');
  }

  function isInProgressPullRequest(request: ProjectSoftwarePullRequest) {
    return (
      request.stage === 'approval' ||
      request.stage === 'awaiting-merge' ||
      request.stage === 'confirmation'
    );
  }

  function stageHelperCopy(request: ProjectSoftwarePullRequest) {
    if (request.stage === 'awaiting-merge') {
      return 'Awaiting a merge-capable member to record the merge ID and merge link.';
    }
    if (request.stage === 'confirmation') {
      return 'Awaiting confirmation that the recorded merge matches this pull request.';
    }
    return 'Awaiting approval before anyone can record a merge.';
  }

  function stageFilledCount(stage: ProjectSoftwarePullRequest['stage']) {
    if (stage === 'confirmation' || stage === 'confirmed') {
      return 3;
    }
    if (stage === 'awaiting-merge') {
      return 2;
    }
    return 1;
  }

  function stageTooltip(request: ProjectSoftwarePullRequest) {
    if (request.stage === 'awaiting-merge') {
      return 'Stage 2 of 3: merge needed';
    }
    if (request.stage === 'confirmation') {
      return 'Stage 3 of 3: merge confirmation needed';
    }
    return 'Stage 1 of 3: pull request vote needed';
  }

  function togglePullRequestQueue() {
    prQueueExpanded = !prQueueExpanded;
  }

  function togglePullRequestCard(requestId: string) {
    expandedPullRequestId = expandedPullRequestId === requestId ? '' : requestId;
  }

  function openPullRequestAction(request: ProjectSoftwarePullRequest) {
    if (request.stage === 'awaiting-merge') {
      openWizard('record-merge', request);
      return;
    }
    openWizard('vote-pr', request);
  }

  function canShowPullRequestAction(request: ProjectSoftwarePullRequest) {
    if (request.stage === 'awaiting-merge') {
      return request.viewerCanRecordMerge;
    }
    return request.viewerCanVote && request.canStillPass && !request.passesApprovalThreshold;
  }

  $: mergeCapabilitySummary =
    governance && governance.mergeCapabilityMembers.length > 0
      ? governance.mergeCapabilityMembers.map((member) => member.username).join(', ')
      : 'No merge-capable members recorded yet.';
  $: inProgressPullRequests =
    governance?.pullRequests.filter((request) => isInProgressPullRequest(request)) ?? [];
  $: if (softwareWizardRequest) {
    const key = `${softwareWizardRequest.mode}:${softwareWizardRequest.requestId}`;
    if (key !== lastHandledWizardRequestKey) {
      lastHandledWizardRequestKey = key;
      prQueueExpanded = true;
      expandedPullRequestId = softwareWizardRequest.requestId;
      openSoftwareWizard(softwareWizardRequest.mode, softwareWizardRequest.requestId);
      onSoftwareWizardRequestHandled();
    }
  }
  $: if (
    expandedPullRequestId &&
    !inProgressPullRequests.some((request) => request.id === expandedPullRequestId)
  ) {
    expandedPullRequestId = '';
  }
  $: if (inProgressPullRequests.length === 0) {
    prQueueExpanded = false;
  }
  $: if (wizardOpen && activePullRequest && governance) {
    const activeId = activePullRequest.id;
    const fresh = governance.pullRequests.find((request) => request.id === activeId) ?? null;
    if (!fresh) {
      closeWizard();
    } else if (fresh !== activePullRequest) {
      activePullRequest = fresh;
    }
  }

  function handlePullRequestCardKeydown(event: KeyboardEvent, requestId: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      togglePullRequestCard(requestId);
    }
  }
</script>

{#if governance}
  <section id="software-governance-panel" class="software-panel">
    <div class="panel-header">
      <div>
        <h3>Software governance</h3>
        <p>
          Create pull requests and manage repository roles here. Votes, merges, and merge confirmations appear in the
          main Action needed panel and right rail.
        </p>
      </div>
      <div class="panel-actions">
        {#if governance.viewerCanCreatePullRequests}
          <button
            class="detail-action-button"
            type="button"
            data-participation-action="make-pull-request"
            on:click={() => openWizard('create-pr')}
          >
            New pull request
          </button>
        {/if}
        {#if governance.viewerCanRequestRepositoryReplacement}
          <button
            class="detail-action-button"
            type="button"
            on:click={() => openWizard('repository-replacement')}
          >
            Replace repository
          </button>
        {/if}
        {#if governance.viewerCanRequestMergeCapabilityChanges}
          <button
            class="detail-action-button"
            type="button"
            on:click={() => openWizard('merge-capability')}
          >
            Change merge capability
          </button>
        {/if}
      </div>
    </div>

    <div class="detail-card metadata-lines">
      <p>
        Official repository:
        <a class="repo-link" href={normalizeExternalUrl(governance.repositoryUrl)} rel="noreferrer" target="_blank">
          {governance.repositoryUrl}
        </a>
      </p>
      <p>License: {normalizedLicenseLabel(governance.licenseLabel)}</p>
      <p>Merge capability: {mergeCapabilitySummary}</p>
      <p class="github-note">
        {#if governance.mergeCapabilityManagedByPlatform}
          Merge holders are synced from active platform moderators.
        {:else}
          These users must have merge access on the GitHub repo manually.
        {/if}
      </p>
    </div>

    {#if inProgressPullRequests.length > 0}
      <div class="detail-card pr-queue-card">
        <button
          class="pr-queue-toggle"
          type="button"
          aria-expanded={prQueueExpanded}
          on:click={togglePullRequestQueue}
        >
          <span class="pr-queue-toggle-copy">
            <span class="pr-queue-title">In-progress pull requests</span>
            <CountBadge count={inProgressPullRequests.length} />
          </span>
          <span class="pr-queue-chevron" class:open={prQueueExpanded} aria-hidden="true">▾</span>
        </button>

        {#if prQueueExpanded}
          <div
            class="pr-card-list"
            class:scrollable={inProgressPullRequests.length > 5}
          >
            {#each inProgressPullRequests as request (request.id)}
              {@const expanded = expandedPullRequestId === request.id}
              {@const filled = stageFilledCount(request.stage)}
              <article class="pr-card" class:expanded id={`software-pr-card-${request.id}`}>
                <div
                  class="pr-card-body-shell"
                  role="button"
                  tabindex="0"
                  aria-expanded={expanded}
                  aria-label={expanded ? `Collapse ${request.title}` : `Expand ${request.title}`}
                  on:click={() => togglePullRequestCard(request.id)}
                  on:keydown={(event) => handlePullRequestCardKeydown(event, request.id)}
                >
                  <div class="pr-card-toggle">
                    <span class="pr-card-top">
                      <span class="pr-card-title-group">
                        <strong class="pr-card-title">{request.title}</strong>
                      </span>
                      <span
                        class="stage-dots"
                        title={stageTooltip(request)}
                        aria-label={stageTooltip(request)}
                      >
                        {#each [1, 2, 3] as step}
                          <span class="stage-dot" class:filled={step <= filled}></span>
                        {/each}
                      </span>
                    </span>
                  </div>

                  <div class="pr-card-link-row">
                    <a
                      class="repo-link"
                      href={normalizeExternalUrl(request.pullRequestUrl)}
                      rel="noreferrer"
                      target="_blank"
                      on:click|stopPropagation
                    >
                      {request.pullRequestId}
                    </a>
                  </div>

                  {#if expanded}
                    <div class="pr-card-body">
                      <span class="stage-copy">{stageHelperCopy(request)}</span>
                      {#if request.summary}
                        <span class="summary-copy">{request.summary}</span>
                      {/if}
                      <div class="pr-card-meta">
                        <a
                          class="repo-link"
                          href={normalizeExternalUrl(request.pullRequestUrl)}
                          rel="noreferrer"
                          target="_blank"
                          on:click|stopPropagation
                        >
                          {request.pullRequestUrl}
                        </a>
                        {#if request.mergeId}
                          <span class="merge-row">
                            <span>Merge ID:</span>
                            {#if request.mergeUrl}
                              <a
                                class="repo-link"
                                href={normalizeExternalUrl(request.mergeUrl)}
                                rel="noreferrer"
                                target="_blank"
                                on:click|stopPropagation
                              >
                                {request.mergeId}
                              </a>
                            {:else}
                              <span>{request.mergeId}</span>
                            {/if}
                          </span>
                        {/if}
                        {#if request.mergeUrl}
                          <a
                            class="repo-link"
                            href={normalizeExternalUrl(request.mergeUrl)}
                            rel="noreferrer"
                            target="_blank"
                            on:click|stopPropagation
                          >
                            {request.mergeUrl}
                          </a>
                        {/if}
                        {#if request.voteSummary}
                          <small>
                            {formatCompactVoteStatus(request.voteSummary, request.approvalThresholdPercent)}
                          </small>
                        {/if}
                      </div>
                    </div>
                  {/if}

                  <div class="pr-card-footer">
                    {#if expanded && canShowPullRequestAction(request)}
                      <div class="pr-card-actions">
                        <button
                          class="detail-action-button primary-action"
                          type="button"
                          on:click|stopPropagation={() => openPullRequestAction(request)}
                        >
                          {request.stage === 'awaiting-merge' ? 'Record merge' : 'Assess'}
                        </button>
                      </div>
                    {:else}
                      <span></span>
                    {/if}
                    <div class="pr-card-meta-corner">
                      <span class="expand-chevrons" class:open={expanded} aria-hidden="true">
                        {#each [1, 2, 3] as step}
                          <span
                            class="expand-chevron"
                            class:filled={step <= filled}
                            class:pulse={step === filled && !expanded}
                          >▾</span>
                        {/each}
                      </span>
                      <span>
                        {request.authorUsername} · {formatRelativeTime(request.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    {#if governance.repositoryHistory.length > 0}
      <div class="detail-card">
        <span>Repository replacement history</span>
        <div class="history-list">
          {#each governance.repositoryHistory as entry}
            <div class="history-item">
              <strong>
                <a class="repo-link" href={normalizeExternalUrl(entry.repositoryUrl)} rel="noreferrer" target="_blank">
                  {entry.repositoryUrl}
                </a>
              </strong>
              <small>
                Replaced
                <a
                  class="repo-link"
                  href={normalizeExternalUrl(entry.previousRepositoryUrl)}
                  rel="noreferrer"
                  target="_blank"
                >
                  {entry.previousRepositoryUrl}
                </a>
                after {entry.relatedPullRequestId}
              </small>
              <small>{entry.reason}</small>
              <small>Recorded by {entry.replacedByUsername} {formatRelativeTime(entry.replacedAt)}</small>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <SoftwareGovernanceWizard
      open={wizardOpen}
      mode={wizardMode}
      {governance}
      {activePullRequest}
      {createPullRequest}
      {requestMergeCapabilityChange}
      {requestRepositoryReplacement}
      {recordMerge}
      {votePullRequest}
      onClose={closeWizard}
    />
  </section>
{/if}

<style>
  .software-panel {
    display: grid;
    gap: 12px;
  }

  .panel-header {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .panel-actions {
    display: flex;
    gap: 8px;
    align-items: stretch;
    justify-content: flex-start;
    flex-wrap: nowrap;
  }

  .panel-actions :global(.detail-action-button) {
    white-space: nowrap;
  }

  @media (max-width: 760px) {
    .panel-header {
      flex-direction: column;
      align-items: stretch;
    }

    .panel-actions {
      width: 100%;
      gap: 6px;
    }

    .panel-actions :global(.detail-action-button) {
      flex: 1 1 0;
      min-width: 0;
      min-height: 52px;
      padding: 8px 6px;
      white-space: normal;
      text-align: center;
      font-size: 11px;
      line-height: 1.25;
      align-items: center;
      justify-content: center;
    }
  }

  .panel-header h3,
  .panel-header p {
    margin: 0;
  }

  .panel-header p,
  .detail-card span,
  .detail-card small,
  .github-note {
    color: var(--text-soft);
  }

  .detail-card {
    display: grid;
    gap: 4px;
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .metadata-lines p {
    margin: 0;
    line-height: 1.45;
  }

  .github-note {
    font-size: 12px;
    line-height: 1.4;
  }

  .history-list,
  .history-item {
    display: grid;
    gap: 6px;
  }

  .pr-queue-title {
    margin: 0;
    color: var(--text-main);
    font-size: 14px;
    font-weight: 800;
  }

  .pr-queue-toggle {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 0;
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
    text-align: left;
  }

  .pr-queue-toggle-copy {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .pr-queue-chevron {
    color: var(--text-soft);
    transition: transform 160ms ease;
  }

  .pr-queue-chevron.open {
    transform: rotate(180deg);
  }

  .pr-card-list {
    display: grid;
    gap: 0;
    margin-top: 10px;
  }

  .pr-card-list.scrollable {
    max-height: 27.5rem;
    overflow-y: auto;
    padding-right: 2px;
  }

  .pr-card {
    border: 1px solid var(--panel-border);
    border-bottom-width: 0;
    background: var(--panel);
    scroll-margin-top: 120px;
  }

  .pr-card:first-child {
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  }

  .pr-card:last-child {
    border-bottom-width: 1px;
    border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  }

  .pr-card:only-child {
    border-radius: var(--radius-sm);
  }

  .pr-card.expanded {
    border-color: color-mix(in srgb, var(--brand) 35%, var(--panel-border));
    z-index: 1;
  }

  .pr-card-body-shell {
    display: grid;
    gap: 8px;
    padding: 12px;
    cursor: pointer;
  }

  .pr-card-body-shell:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--brand) 55%, transparent);
    outline-offset: 2px;
  }

  .pr-card-toggle {
    display: grid;
    gap: 8px;
    width: 100%;
    text-align: left;
    color: inherit;
  }

  .pr-card-top,
  .pr-card-title-group,
  .pr-card-link-row,
  .pr-card-footer,
  .pr-card-actions,
  .merge-row,
  .stage-dots,
  .expand-chevrons,
  .pr-card-meta-corner {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .pr-card-top,
  .pr-card-footer {
    justify-content: space-between;
  }

  .pr-card-title {
    color: var(--brand-strong);
    font-size: 14px;
    font-weight: 800;
  }

  .pr-card-meta-corner {
    margin-left: auto;
    color: var(--text-soft);
    font-size: 12px;
    line-height: 1.45;
    text-align: right;
    white-space: nowrap;
  }

  .expand-chevrons {
    gap: 1px;
  }

  .expand-chevrons.open .expand-chevron {
    transform: rotate(180deg);
  }

  .expand-chevron {
    display: inline-flex;
    color: color-mix(in srgb, var(--text-soft) 70%, transparent);
    font-size: 12px;
    line-height: 1;
    transition: transform 160ms ease, color 160ms ease, opacity 160ms ease;
  }

  .expand-chevron.filled {
    color: var(--brand-strong);
    opacity: 1;
  }

  .expand-chevron.pulse {
    animation: chevron-pulse 1.8s ease-in-out infinite;
  }

  @keyframes chevron-pulse {
    0%,
    100% {
      transform: translateY(0);
      opacity: 0.55;
    }
    50% {
      transform: translateY(2px);
      opacity: 1;
    }
  }

  .stage-dots {
    gap: 5px;
  }

  .stage-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #111;
    box-shadow: 0 0 0 1.5px color-mix(in srgb, var(--text-soft) 70%, transparent);
  }

  .stage-dot.filled {
    background: var(--brand-strong);
    box-shadow: none;
  }

  .pr-card-body,
  .pr-card-meta {
    display: grid;
    gap: 6px;
  }

  .pr-card-body {
    padding-top: 8px;
    border-top: 1px solid var(--panel-border);
  }

  .stage-copy,
  .summary-copy {
    color: var(--text-soft);
    font-size: 12px;
    line-height: 1.45;
  }

  .repo-link {
    text-decoration: underline;
    text-underline-offset: 2px;
    font-weight: 700;
  }
</style>
