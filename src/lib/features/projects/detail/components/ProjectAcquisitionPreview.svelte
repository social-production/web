<script lang="ts">
  import type {
    ProjectAcquisitionExecutionInput,
    ProjectApprovalVote,
    ProjectPhaseFourData
  } from '$lib/types/detail';

  export let preview: ProjectPhaseFourData;
  export let submitExecution: (input: ProjectAcquisitionExecutionInput) => boolean | Promise<boolean> = async () => false;
  export let setConfirmationVote: (vote: ProjectApprovalVote | null) => void | Promise<void> = () => {};

  let executionProofLabel = '';
  let executionNote = '';

  async function recordExecution() {
    if (!executionProofLabel.trim()) {
      return;
    }

    const recorded = await submitExecution({
      proofLabel: executionProofLabel,
      note: executionNote
    });

    if (recorded) {
      executionProofLabel = '';
      executionNote = '';
    }
  }

  function castConfirmationVote(vote: ProjectApprovalVote) {
    void setConfirmationVote(vote);
  }
</script>

<section class="acquisition-stack">
  <div class="intro-card">
    <div class="intro-head">
      <h2>Acquisition</h2>
      <span class="status-pill">{preview.phaseLabel}</span>
    </div>
    <p>{preview.intro}</p>
    <p class="preview-note">{preview.previewNote}</p>
  </div>

  {#if preview.fund}
    <div class="fund-card">
      <div class="fund-head">
        <strong>{preview.fund.title}</strong>
        <span class="status-pill muted-pill">{preview.fund.statusLabel}</span>
      </div>
      <div class="progress-track" aria-hidden="true">
        <span class="progress-fill" style={`width: ${preview.fund.progressPercent}%`}></span>
      </div>
      <div class="fund-meta">
        <span>{preview.fund.raisedLabel}</span>
        <span>{preview.fund.targetLabel}</span>
      </div>
      <p>{preview.fund.note}</p>
    </div>
  {/if}

  <div class="split-grid">
    <section class="detail-card">
      <h3>Existing collective assets</h3>
      {#if preview.existingAssets.length === 0}
        <p>No existing asset previews are available.</p>
      {:else}
        <div class="item-stack">
          {#each preview.existingAssets as item}
            <article class="item-card">
              <div class="item-head">
                <strong>{item.title}</strong>
                <span class="status-pill muted-pill">{item.statusLabel}</span>
              </div>
              <span class="item-meta">{item.sourceLabel} · {item.costLabel}</span>
              <p>{item.note}</p>
              {#if item.href}
                <a class="open-link" href={item.href}>Open related asset record</a>
              {/if}
            </article>
          {/each}
        </div>
      {/if}
    </section>

    <section class="detail-card">
      <h3>Collective purchase targets</h3>
      {#if preview.purchaseTargets.length === 0}
        <p>No purchase-target previews are available.</p>
      {:else}
        <div class="item-stack">
          {#each preview.purchaseTargets as item}
            <article class="item-card">
              <div class="item-head">
                <strong>{item.title}</strong>
                <span class="status-pill muted-pill">{item.statusLabel}</span>
              </div>
              <span class="item-meta">{item.sourceLabel} · {item.costLabel}</span>
              {#if item.destinationLabel}
                <span class="item-meta">Destination: {item.destinationLabel}</span>
              {/if}
              <p>{item.note}</p>
              {#if item.purchaseHref}
                <a class="open-link" href={item.purchaseHref}>Open purchase link</a>
              {/if}
            </article>
          {/each}
        </div>
      {/if}
    </section>
  </div>

  <section class="detail-card">
    <h3>Destination bundles</h3>
    {#if preview.bundles.length === 0}
      <p>No destination bundles are available yet.</p>
    {:else}
      <div class="item-stack">
        {#each preview.bundles as bundle}
          <article class="item-card">
            <div class="item-head">
              <strong>{bundle.title}</strong>
              <span class="status-pill muted-pill">{bundle.statusLabel}</span>
            </div>
            <span class="item-meta">
              {bundle.destinationType === 'existing-service' ? 'Existing asset-management service' : 'New asset-management service'}
              · {bundle.destinationLabel}
            </span>
            <p>{bundle.note}</p>
          </article>
        {/each}
      </div>
    {/if}
  </section>

  {#if preview.execution}
    <section class="detail-card">
      <h3>Execution and confirmation</h3>
      <article class="item-card">
        <div class="item-head">
          <strong>{preview.execution.boardActionLabel}</strong>
          <span class="status-pill muted-pill">{preview.execution.statusLabel}</span>
        </div>
        <span class="item-meta">Proof required · {preview.execution.proofLabel}</span>
        <span class="item-meta">Recorded by {preview.execution.recordedByUsername} · {new Date(preview.execution.recordedAt).toLocaleString()}</span>
        <p>{preview.execution.note}</p>
      </article>

      {#if preview.confirmation}
        <article class="item-card">
          <div class="item-head">
            <strong>Member confirmation</strong>
            <span class="status-pill muted-pill">{preview.confirmation.statusLabel}</span>
          </div>
          <span class="item-meta">
            Approval {preview.confirmation.voteSummary.approvalPercent}% yes · {preview.confirmation.voteSummary.yesCount} yes / {preview.confirmation.voteSummary.noCount} no
          </span>
          <p>{preview.confirmation.note}</p>
          {#if preview.confirmation.viewerCanVote}
            <div class="vote-row">
              <button class="vote-button" type="button" on:click={() => castConfirmationVote('yes')}>Confirm</button>
              <button class="vote-button negative" type="button" on:click={() => castConfirmationVote('no')}>Reject</button>
            </div>
          {/if}
        </article>
      {/if}
    </section>
  {:else if preview.viewerCanRecordExecution}
    <section class="detail-card">
      <h3>Record board execution</h3>
      <article class="item-card">
        <input bind:value={executionProofLabel} maxlength="160" placeholder="Transaction ID or proof reference" />
        <textarea bind:value={executionNote} rows="3" placeholder="Optional execution note"></textarea>
        <div class="vote-row">
          <button class="vote-button" type="button" on:click={recordExecution}>Record execution</button>
        </div>
      </article>
    </section>
  {/if}

  {#if preview.pendingAssets.length > 0}
    <section class="detail-card">
      <h3>Pending asset entries</h3>
      <div class="item-stack">
        {#each preview.pendingAssets as asset}
          <article class="item-card">
            <div class="item-head">
              <strong>{asset.title}</strong>
              <span class="status-pill muted-pill">{asset.statusLabel}</span>
            </div>
            <span class="item-meta">Destination: {asset.destinationLabel}</span>
            <p>{asset.note}</p>
          </article>
        {/each}
      </div>
    </section>
  {/if}

  {#if preview.placeholderSections.length > 0}
    <div class="frame-grid">
      {#each preview.placeholderSections as section}
        <article class="frame-card">
          <div class="item-head">
            <strong>{section.title}</strong>
            {#if section.statusLabel}
              <span class="status-pill muted-pill">{section.statusLabel}</span>
            {/if}
          </div>
          <p>{section.body}</p>
        </article>
      {/each}
    </div>
  {/if}
</section>

<style>
  .acquisition-stack,
  .split-grid,
  .item-stack,
  .frame-grid {
    display: grid;
    gap: 12px;
  }

  .split-grid,
  .frame-grid {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }

  .intro-card,
  .fund-card,
  .detail-card,
  .item-card,
  .frame-card {
    display: grid;
    gap: 10px;
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .intro-head,
  .fund-head,
  .fund-meta,
  .item-head {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .progress-track {
    height: 10px;
    border-radius: 999px;
    background: var(--panel);
    overflow: hidden;
  }

  .progress-fill {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--brand), color-mix(in srgb, var(--brand) 60%, white));
  }

  h2,
  h3,
  strong {
    margin: 0;
    color: var(--text-main);
  }

  p,
  .item-meta,
  .fund-meta span {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.6;
  }

  .preview-note {
    padding: 12px 14px;
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .status-pill {
    padding: 6px 10px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: color-mix(in srgb, var(--accent-warm) 14%, var(--panel));
    color: var(--accent-warm-strong);
    font-size: 11px;
    font-weight: 700;
  }

  .status-pill.muted-pill {
    background: var(--panel);
    color: var(--text-soft);
  }

  .open-link {
    color: var(--brand-strong);
    font-size: 12px;
    font-weight: 700;
  }

  .vote-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .vote-button {
    padding: 8px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-main);
    font-size: 12px;
    font-weight: 700;
  }

  .vote-button.negative {
    border-color: color-mix(in srgb, var(--tablet-community-bg) 45%, var(--panel-border));
    color: var(--tablet-community-text);
  }

  input,
  textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-main);
  }

  textarea {
    min-height: 88px;
    resize: vertical;
  }
</style>
