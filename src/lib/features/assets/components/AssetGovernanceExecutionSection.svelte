<script lang="ts">
  import type { AssetGovernanceData } from '$lib/types/assets';

  export let governance: AssetGovernanceData;
  export let assetLabel = 'this asset';
  export let title = 'Governance execution';
  export let summary = 'Availability decisions, borrowing policy votes, borrowing lifecycle, and delivery handoffs.';
  export let description =
    'Availability approvals, borrowing policy votes, borrowing lifecycle, and delivery handoffs are all seeded here through the adapter-backed asset contract.';

  let showHowItWorks = false;

  function tone(label: string) {
    const normalized = label.toLowerCase();

    if (normalized.includes('approved') || normalized.includes('active') || normalized.includes('completed')) {
      return 'approved';
    }

    if (normalized.includes('overdue') || normalized.includes('rejected')) {
      return 'blocked';
    }

    return 'pending';
  }
</script>

<section class="governance-stack">
  <div class="section-copy">
    <div class="section-title-row">
      <h2>{title}</h2>
      <button
        class="section-help-button"
        type="button"
        aria-label={showHowItWorks ? 'Hide how it works' : 'Show how it works'}
        aria-expanded={showHowItWorks}
        on:click={() => (showHowItWorks = !showHowItWorks)}
      >
        ?
      </button>
    </div>
    <p class="section-subtitle">{summary}</p>
  </div>

  {#if showHowItWorks}
    <div class="mechanics-card">
      <p>{description}</p>
    </div>
  {/if}

  <div class="section-grid">
    <section class="detail-card">
      <div class="section-head">
        <strong>Availability decisions</strong>
        <span>{governance.availabilityRequests.length}</span>
      </div>

      {#if governance.availabilityRequests.length === 0}
        <p>No availability requests are seeded for {assetLabel}.</p>
      {:else}
        <div class="card-list">
          {#each governance.availabilityRequests as request}
            <article class="item-card">
              <div class="item-head">
                <strong>{request.title}</strong>
                <span class={`status-pill ${tone(request.statusLabel)}`}>{request.statusLabel}</span>
              </div>
              <span class="meta-line">{request.assetLabel} · {request.requestingPartyLabel}</span>
              <span class="meta-line">{request.requestedAtLabel} · {request.timeframeLabel}</span>
              <p>{request.summary}</p>
              <p class="note-card">{request.outcomeNote}</p>

              {#if request.voteSummary}
                <div class="vote-grid">
                  <span>{request.voteSummary.yesCount} yes / {request.voteSummary.noCount} no</span>
                  <span>{request.voteSummary.approvalPercent}% approval</span>
                  <span>{request.voteSummary.votesRequired} votes required</span>
                </div>
                <p class="vote-note">{request.voteSummary.note}</p>
              {/if}
            </article>
          {/each}
        </div>
      {/if}
    </section>

    <section class="detail-card">
      <div class="section-head">
        <strong>Borrowing policies</strong>
        <span>{governance.borrowingPolicies.length}</span>
      </div>

      {#if governance.borrowingPolicies.length === 0}
        <p>No borrowing-policy votes are seeded for {assetLabel}.</p>
      {:else}
        <div class="card-list">
          {#each governance.borrowingPolicies as policy}
            <article class="item-card">
              <div class="item-head">
                <strong>{policy.assetLabel}</strong>
                <span class={`status-pill ${tone(policy.statusLabel)}`}>{policy.policyLabel}</span>
              </div>
              <span class="meta-line">{policy.managingProjectLabel}</span>
              <span class="meta-line">{policy.decidedAtLabel}</span>
              <p>{policy.summary}</p>
              <div class="vote-grid">
                <span>{policy.voteSummary.yesCount} yes / {policy.voteSummary.noCount} no</span>
                <span>{policy.voteSummary.approvalPercent}% approval</span>
                <span>{policy.voteSummary.votesRequired} votes required</span>
              </div>
              <p class="vote-note">{policy.voteSummary.note}</p>
            </article>
          {/each}
        </div>
      {/if}
    </section>
  </div>

  <div class="section-grid">
    <section class="detail-card">
      <div class="section-head">
        <strong>Borrowing lifecycle</strong>
        <span>{governance.borrowingRequests.length}</span>
      </div>

      {#if governance.borrowingRequests.length === 0}
        <p>No borrowing lifecycle records are seeded for {assetLabel}.</p>
      {:else}
        <div class="card-list">
          {#each governance.borrowingRequests as request}
            <article class="item-card">
              <div class="item-head">
                <strong>{request.title}</strong>
                <span class={`status-pill ${tone(request.statusLabel)}`}>{request.statusLabel}</span>
              </div>
              <span class="meta-line">{request.borrowerLabel} · {request.requestedAtLabel}</span>
              <span class="meta-line">{request.expectedReturnLabel}</span>
              <p>{request.purpose}</p>
              <p class="note-card">{request.currentCustodyLabel}</p>
              <p class="vote-note">{request.coordinationNote}</p>
              {#if request.responsiblePartyLabel}
                <span class="meta-line">Responsible party: {request.responsiblePartyLabel}</span>
              {/if}
            </article>
          {/each}
        </div>
      {/if}
    </section>

    <section class="detail-card">
      <div class="section-head">
        <strong>Delivery lifecycle</strong>
        <span>{governance.deliveryRequests.length}</span>
      </div>

      {#if governance.deliveryRequests.length === 0}
        <p>No delivery lifecycle records are seeded for {assetLabel}.</p>
      {:else}
        <div class="card-list">
          {#each governance.deliveryRequests as delivery}
            <article class="item-card">
              <div class="item-head">
                <strong>{delivery.title}</strong>
                <span class={`status-pill ${tone(delivery.statusLabel)}`}>{delivery.statusLabel}</span>
              </div>
              <span class="meta-line">{delivery.requesterLabel} · {delivery.requestedAtLabel}</span>
              <span class="meta-line">{delivery.originLabel} -> {delivery.destinationLabel}</span>
              <span class="meta-line">{delivery.neededByLabel} · {delivery.assignedVolunteerLabel}</span>
              <p>{delivery.summary}</p>
            </article>
          {/each}
        </div>
      {/if}
    </section>
  </div>
</section>

<style>
  .governance-stack,
  .section-copy,
  .section-grid,
  .detail-card,
  .card-list,
  .item-card,
  .mechanics-card {
    display: grid;
    gap: 12px;
  }

  .section-grid {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }

  .detail-card,
  .item-card,
  .note-card,
  .mechanics-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .item-head,
  .section-head,
  .section-title-row,
  .vote-grid {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .section-title-row {
    align-items: center;
  }

  h2,
  strong {
    margin: 0;
    color: var(--text-main);
  }

  p,
  span {
    margin: 0;
    color: var(--text-soft);
    line-height: 1.6;
  }

  .meta-line,
  .vote-grid,
  .vote-note {
    font-size: 12px;
  }

  .section-subtitle {
    font-size: 13px;
  }

  .section-help-button {
    width: 26px;
    height: 26px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel);
    color: var(--text-main);
    font-size: 14px;
    font-weight: 700;
    line-height: 1;
    display: grid;
    place-items: center;
  }

  .status-pill {
    padding: 6px 10px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: var(--panel);
    color: var(--text-soft);
    font-size: 11px;
    font-weight: 700;
  }

  .status-pill.approved {
    border-color: var(--brand-strong);
    color: var(--brand-strong);
  }

  .status-pill.blocked {
    border-color: var(--accent-warm);
    color: var(--accent-warm-strong);
  }

  .note-card {
    background: var(--panel);
  }
</style>