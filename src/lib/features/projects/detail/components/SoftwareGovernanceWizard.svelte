<script lang="ts">
  import PlanWizardShell from '$lib/components/shared/PlanWizardShell.svelte';
  import VoteCardFooter from '$lib/components/shared/VoteCardFooter.svelte';
  import type {
    ProjectApprovalVote,
    ProjectSoftwareGovernanceData,
    ProjectSoftwareMergeCapabilityChangeInput,
    ProjectSoftwarePullRequest,
    ProjectSoftwarePullRequestInput,
    ProjectSoftwareRepositoryReplacementInput
  } from '$lib/types/detail';
  import { formatProjectVoteRequirement, formatProjectVoteSummary } from '$lib/utils/projectVotes';

  type SoftwareWizardMode =
    | 'create-pr'
    | 'vote-pr'
    | 'record-merge'
    | 'merge-capability'
    | 'repository-replacement'
    | null;

  export let open = false;
  export let mode: SoftwareWizardMode = null;
  export let governance: ProjectSoftwareGovernanceData;
  export let activePullRequest: ProjectSoftwarePullRequest | null = null;
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
  export let onClose: () => void = () => {};

  let stepIndex = 0;
  let form: ProjectSoftwarePullRequestInput = emptyPrForm();
  let mergeId = '';
  let mergeUrl = '';
  let mergeCapabilityForm: ProjectSoftwareMergeCapabilityChangeInput = {
    targetUserId: '',
    action: 'grant'
  };
  let repositoryReplacementForm: ProjectSoftwareRepositoryReplacementInput = {
    repositoryUrl: '',
    reason: '',
    relatedPullRequestId: ''
  };

  function emptyPrForm(): ProjectSoftwarePullRequestInput {
    return {
      title: '',
      summary: '',
      pullRequestId: '',
      pullRequestUrl: ''
    };
  }

  function resetForms() {
    form = emptyPrForm();
    mergeId = '';
    mergeUrl = '';
    mergeCapabilityForm = {
      targetUserId: governance.availableMergeCapabilityCandidates[0]?.id ?? '',
      action: 'grant'
    };
    repositoryReplacementForm = {
      repositoryUrl: '',
      reason: '',
      relatedPullRequestId: governance.replaceablePullRequests[0]?.id ?? ''
    };
    stepIndex = 0;
  }

  $: if (open) {
    // Seed defaults when opening; keep edits while open.
    if (stepIndex === 0 && !form.title && mode === 'create-pr') {
      form = emptyPrForm();
    }
    if (mode === 'merge-capability' && !mergeCapabilityForm.targetUserId) {
      mergeCapabilityForm = {
        targetUserId: governance.availableMergeCapabilityCandidates[0]?.id ?? '',
        action: 'grant'
      };
    }
    if (mode === 'repository-replacement' && !repositoryReplacementForm.relatedPullRequestId) {
      repositoryReplacementForm = {
        repositoryUrl: '',
        reason: '',
        relatedPullRequestId: governance.replaceablePullRequests[0]?.id ?? ''
      };
    }
  }

  $: if (!open) {
    resetForms();
  }

  $: title = wizardTitle(mode, activePullRequest);
  $: stepCount = wizardStepCount(mode);
  $: canGoBack = stepIndex > 0;
  // Read nested fields here so typing retriggers the gate (local object binds alone do not).
  $: canGoNext = canAdvance(
    mode,
    stepIndex,
    form.title,
    form.pullRequestId,
    form.pullRequestUrl,
    form.summary,
    mergeId,
    mergeUrl,
    mergeCapabilityForm.targetUserId,
    mergeCapabilityForm.action,
    repositoryReplacementForm.relatedPullRequestId,
    repositoryReplacementForm.repositoryUrl,
    repositoryReplacementForm.reason,
    activePullRequest
  );
  $: nextLabel = stepIndex >= stepCount - 1 ? submitLabel(mode) : 'Next';
  $: showFooter = mode !== 'vote-pr';
  $: stepValidationMessage = validationMessage(
    mode,
    stepIndex,
    form.title,
    form.pullRequestId,
    form.pullRequestUrl,
    form.summary,
    mergeId,
    mergeUrl,
    mergeCapabilityForm.targetUserId,
    repositoryReplacementForm.relatedPullRequestId,
    repositoryReplacementForm.repositoryUrl,
    repositoryReplacementForm.reason
  );

  function wizardTitle(current: SoftwareWizardMode, pr: ProjectSoftwarePullRequest | null) {
    switch (current) {
      case 'create-pr':
        return 'Submit pull request';
      case 'vote-pr':
        return pr?.stage === 'confirmation'
          ? 'Merge confirmation needed'
          : 'Pull request vote needed';
      case 'record-merge':
        return 'Merge needed';
      case 'merge-capability':
        return 'Merge capability change';
      case 'repository-replacement':
        return 'Replace repository';
      default:
        return 'Software governance';
    }
  }

  function wizardStepCount(current: SoftwareWizardMode) {
    switch (current) {
      case 'create-pr':
        return 4;
      case 'vote-pr':
        return 1;
      case 'record-merge':
        return 1;
      case 'merge-capability':
        return 3;
      case 'repository-replacement':
        return 4;
      default:
        return 1;
    }
  }

  function submitLabel(current: SoftwareWizardMode) {
    switch (current) {
      case 'create-pr':
        return 'Submit for approval';
      case 'vote-pr':
        return 'Done';
      case 'record-merge':
        return 'Submit merge details';
      case 'merge-capability':
        return 'Submit vote request';
      case 'repository-replacement':
        return 'Submit replacement vote';
      default:
        return 'Finish';
    }
  }

  function canAdvance(
    current: SoftwareWizardMode,
    index: number,
    titleValue: string,
    pullRequestId: string,
    pullRequestUrl: string,
    summary: string,
    mergeIdValue: string,
    mergeUrlValue: string,
    targetUserId: string,
    mergeAction: string,
    relatedPullRequestId: string,
    repositoryUrl: string,
    reason: string,
    pullRequest: ProjectSoftwarePullRequest | null
  ) {
    switch (current) {
      case 'create-pr':
        if (index === 0) return !!titleValue.trim();
        if (index === 1) return !!pullRequestId.trim() && !!pullRequestUrl.trim();
        if (index === 2) return !!summary.trim();
        return true;
      case 'vote-pr':
        return true;
      case 'record-merge':
        return !!mergeIdValue.trim() && !!mergeUrlValue.trim() && !!pullRequest;
      case 'merge-capability':
        if (index === 0) return !!targetUserId.trim();
        if (index === 1) return !!mergeAction;
        return true;
      case 'repository-replacement':
        if (index === 0) return !!relatedPullRequestId.trim();
        if (index === 1) return !!repositoryUrl.trim();
        if (index === 2) return !!reason.trim();
        return true;
      default:
        return false;
    }
  }

  function validationMessage(
    current: SoftwareWizardMode,
    index: number,
    titleValue: string,
    pullRequestId: string,
    pullRequestUrl: string,
    summary: string,
    mergeIdValue: string,
    mergeUrlValue: string,
    targetUserId: string,
    relatedPullRequestId: string,
    repositoryUrl: string,
    reason: string
  ) {
    switch (current) {
      case 'create-pr':
        if (index === 0 && !titleValue.trim()) return 'Add a title to continue.';
        if (index === 1 && (!pullRequestId.trim() || !pullRequestUrl.trim())) {
          return 'Add both the PR ID and the pull request URL to continue.';
        }
        if (index === 2 && !summary.trim()) return 'Add a short summary to continue.';
        return null;
      case 'record-merge':
        if (!mergeIdValue.trim() || !mergeUrlValue.trim()) {
          return 'Enter both the merge ID and the merge link to continue.';
        }
        return null;
      case 'merge-capability':
        if (index === 0 && !targetUserId.trim()) return 'Choose a project member to continue.';
        return null;
      case 'repository-replacement':
        if (index === 0 && !relatedPullRequestId.trim()) {
          return 'Choose the blocked pull request that triggered this change.';
        }
        if (index === 1 && !repositoryUrl.trim()) return 'Add the replacement repository URL to continue.';
        if (index === 2 && !reason.trim()) return 'Explain why the repository must change.';
        return null;
      default:
        return null;
    }
  }

  function handleBack() {
    if (stepIndex > 0) stepIndex -= 1;
  }

  async function handleNext() {
    if (stepIndex < stepCount - 1) {
      stepIndex += 1;
      return;
    }

    if (mode === 'create-pr') {
      await createPullRequest({
        title: form.title.trim(),
        summary: form.summary.trim(),
        pullRequestId: form.pullRequestId.trim(),
        pullRequestUrl: form.pullRequestUrl.trim()
      });
    } else if (mode === 'record-merge' && activePullRequest) {
      await recordMerge(activePullRequest.id, mergeId.trim(), mergeUrl.trim());
    } else if (mode === 'merge-capability') {
      await requestMergeCapabilityChange({
        targetUserId: mergeCapabilityForm.targetUserId.trim(),
        action: mergeCapabilityForm.action
      });
    } else if (mode === 'repository-replacement') {
      await requestRepositoryReplacement({
        repositoryUrl: repositoryReplacementForm.repositoryUrl.trim(),
        reason: repositoryReplacementForm.reason.trim(),
        relatedPullRequestId: repositoryReplacementForm.relatedPullRequestId.trim()
      });
    }

    handleClose();
  }

  function handleClose() {
    resetForms();
    onClose();
  }

  async function handlePullRequestVote(vote: ProjectApprovalVote | null) {
    if (!activePullRequest) {
      return;
    }

    try {
      await votePullRequest(activePullRequest.id, vote);
      handleClose();
    } catch {
      // Keep the wizard open so the voter can retry; VoteCardFooter rolls back the chip.
    }
  }

  function normalizeExternalUrl(value: string | null | undefined) {
    const trimmed = value?.trim() ?? '';
    if (!trimmed) return '';
    if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }
</script>

{#if mode}
  <PlanWizardShell
    {open}
    {title}
    {stepIndex}
    {stepCount}
    {nextLabel}
    {canGoBack}
    {canGoNext}
    {showFooter}
    on:close={handleClose}
    on:back={handleBack}
    on:next={handleNext}
  >
    <div class="question-block">
      {#if mode === 'create-pr'}
        {#if stepIndex === 0}
          <h2>What should we call this pull request?</h2>
          <p class="helper-copy">Use a short title that matches the change people will vote on.</p>
          <input bind:value={form.title} maxlength="120" placeholder="Pull request title" />
        {:else if stepIndex === 1}
          <h2>Where is the pull request?</h2>
          <p class="helper-copy">Link the external PR so voters can inspect the change.</p>
          <div class="field-grid">
            <input bind:value={form.pullRequestId} maxlength="40" placeholder="PR number or ID" />
            <input bind:value={form.pullRequestUrl} maxlength="240" placeholder="Pull request URL" />
          </div>
        {:else if stepIndex === 2}
          <h2>What does this change?</h2>
          <p class="helper-copy">Summarise the effect in plain language for non-specialist voters.</p>
          <textarea bind:value={form.summary} rows="5" placeholder="What does this pull request change?"></textarea>
        {:else}
          <h2>Ready to submit?</h2>
          <div class="review-card">
            <strong>{form.title}</strong>
            <span>{form.pullRequestId} · {form.pullRequestUrl}</span>
            <p>{form.summary}</p>
          </div>
        {/if}
        {#if stepValidationMessage}
          <p class="validation-copy" role="status">{stepValidationMessage}</p>
        {/if}
      {:else if mode === 'vote-pr' && activePullRequest}
        <h2>{activePullRequest.title}</h2>
        <p class="helper-copy">
          {#if activePullRequest.stage === 'confirmation'}
            Confirm that the recorded merge actually happened and matches this pull request.
          {:else}
            Approve or reject this pull request before anyone records a merge.
          {/if}
        </p>

        <div class="review-card metadata-card">
          {#if activePullRequest.summary}
            <div class="meta-row">
              <span class="meta-label">Summary</span>
              <p class="meta-value summary-value">{activePullRequest.summary}</p>
            </div>
          {/if}

          <div class="meta-row">
            <span class="meta-label">PR ID</span>
            <span class="meta-value">{activePullRequest.pullRequestId}</span>
          </div>

          <div class="meta-row">
            <span class="meta-label">PR link</span>
            <a
              class="meta-value meta-link"
              href={normalizeExternalUrl(activePullRequest.pullRequestUrl)}
              rel="noreferrer"
              target="_blank"
            >
              {activePullRequest.pullRequestUrl}
            </a>
          </div>

          {#if activePullRequest.mergeId}
            <div class="meta-row">
              <span class="meta-label">Merge ID</span>
              <span class="meta-value">{activePullRequest.mergeId}</span>
            </div>
          {/if}

          {#if activePullRequest.mergeUrl}
            <div class="meta-row">
              <span class="meta-label">Merge link</span>
              <a
                class="meta-value meta-link"
                href={normalizeExternalUrl(activePullRequest.mergeUrl)}
                rel="noreferrer"
                target="_blank"
              >
                {activePullRequest.mergeUrl}
              </a>
            </div>
          {/if}

          <div class="meta-row">
            <span class="meta-label">Submitted by</span>
            <span class="meta-value">{activePullRequest.authorUsername}</span>
          </div>

          <span class="stage-pill">{activePullRequest.stageLabel}</span>
        </div>

        {#if activePullRequest.voteSummary}
          <div class="vote-card">
            <strong>{formatProjectVoteSummary(activePullRequest.voteSummary)}</strong>
            <small>
              {formatProjectVoteRequirement(
                activePullRequest.voteSummary,
                activePullRequest.approvalThresholdPercent
              )}
            </small>
            <VoteCardFooter
              authorUsername={activePullRequest.authorUsername}
              createdAt={activePullRequest.createdAt}
              activeVote={activePullRequest.voteSummary.activeVote}
              canVote={activePullRequest.viewerCanVote &&
                activePullRequest.canStillPass &&
                !activePullRequest.passesApprovalThreshold}
              showMeta={false}
              onVote={handlePullRequestVote}
            />
          </div>
        {/if}
      {:else if mode === 'record-merge' && activePullRequest}
        <h2>Record merge for {activePullRequest.title}</h2>
        <p class="helper-copy">
          This pull request already passed approval. Enter the merge ID and a link others can open to verify it.
          After you submit, members will still need to confirm that the merge was completed correctly.
        </p>

        <div class="review-card metadata-card">
          {#if activePullRequest.summary}
            <div class="meta-row">
              <span class="meta-label">Summary</span>
              <p class="meta-value summary-value">{activePullRequest.summary}</p>
            </div>
          {/if}

          <div class="meta-row">
            <span class="meta-label">PR ID</span>
            <span class="meta-value">{activePullRequest.pullRequestId}</span>
          </div>

          <div class="meta-row">
            <span class="meta-label">PR link</span>
            <a
              class="meta-value meta-link"
              href={normalizeExternalUrl(activePullRequest.pullRequestUrl)}
              rel="noreferrer"
              target="_blank"
            >
              {activePullRequest.pullRequestUrl}
            </a>
          </div>

          <span class="stage-pill">{activePullRequest.stageLabel}</span>
        </div>

        <div class="field-stack">
          <label class="field-label" for="merge-id-input">Merge ID</label>
          <input
            id="merge-id-input"
            bind:value={mergeId}
            maxlength="120"
            placeholder="Merge commit or release ID"
          />

          <label class="field-label" for="merge-url-input">Merge link</label>
          <input
            id="merge-url-input"
            bind:value={mergeUrl}
            maxlength="240"
            placeholder="Merge commit or release URL"
          />
        </div>

        {#if stepValidationMessage}
          <p class="validation-copy" role="status">{stepValidationMessage}</p>
        {/if}
      {:else if mode === 'merge-capability'}
        {#if stepIndex === 0}
          <h2>Which member?</h2>
          <select bind:value={mergeCapabilityForm.targetUserId}>
            <option value="" disabled>Select project member</option>
            {#each governance.availableMergeCapabilityCandidates as candidate}
              <option value={candidate.id}>{candidate.username}</option>
            {/each}
          </select>
        {:else if stepIndex === 1}
          <h2>Grant or revoke merge capability?</h2>
          <select bind:value={mergeCapabilityForm.action}>
            <option value="grant">Grant merge capability</option>
            <option value="revoke">Revoke merge capability</option>
          </select>
        {:else}
          <h2>Submit this change for a vote</h2>
          <div class="review-card">
            <strong>
              {mergeCapabilityForm.action === 'grant' ? 'Grant' : 'Revoke'} merge capability
            </strong>
            <span>
              {governance.availableMergeCapabilityCandidates.find(
                (entry) => entry.id === mergeCapabilityForm.targetUserId
              )?.username ?? 'Selected member'}
            </span>
          </div>
        {/if}
      {:else if mode === 'repository-replacement'}
        {#if stepIndex === 0}
          <h2>Which blocked pull request triggered this?</h2>
          <select bind:value={repositoryReplacementForm.relatedPullRequestId}>
            <option value="" disabled>Select blocked pull request</option>
            {#each governance.replaceablePullRequests as request}
              <option value={request.id}>{request.pullRequestId} · {request.stageLabel}</option>
            {/each}
          </select>
        {:else if stepIndex === 1}
          <h2>What is the replacement repository URL?</h2>
          <input
            bind:value={repositoryReplacementForm.repositoryUrl}
            maxlength="240"
            placeholder="Replacement repository URL"
          />
        {:else if stepIndex === 2}
          <h2>Why does the repository need replacing?</h2>
          <textarea
            bind:value={repositoryReplacementForm.reason}
            rows="5"
            placeholder="Explain why the official repository must change"
          ></textarea>
        {:else}
          <h2>Submit repository replacement for a vote</h2>
          <div class="review-card">
            <strong>{repositoryReplacementForm.repositoryUrl}</strong>
            <span>Blocked PR: {repositoryReplacementForm.relatedPullRequestId}</span>
            <p>{repositoryReplacementForm.reason}</p>
          </div>
        {/if}
      {/if}
    </div>
  </PlanWizardShell>
{/if}

<style>
  .question-block {
    display: grid;
    gap: 14px;
  }

  h2 {
    margin: 0;
    font-size: 22px;
    line-height: 1.3;
    letter-spacing: -0.02em;
  }

  .helper-copy,
  .vote-card small,
  .validation-copy {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.5;
    font-size: 13px;
  }

  .validation-copy {
    color: color-mix(in srgb, var(--brand-strong) 80%, var(--text-soft));
    font-weight: 600;
  }

  input,
  textarea,
  select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-main);
    font: inherit;
  }

  .field-grid {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .field-stack {
    display: grid;
    gap: 8px;
  }

  .field-label,
  .meta-label {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.01em;
    text-transform: uppercase;
  }

  .review-card,
  .vote-card {
    display: grid;
    gap: 8px;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .metadata-card {
    gap: 12px;
  }

  .meta-row {
    display: grid;
    gap: 4px;
  }

  .review-card p,
  .review-card span,
  .meta-value {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  .summary-value {
    color: var(--text-main);
  }

  .meta-link {
    color: var(--brand-strong);
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .stage-pill {
    justify-self: start;
    padding: 4px 8px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    color: var(--brand-strong);
  }

  @media (max-width: 760px) {
    .field-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
