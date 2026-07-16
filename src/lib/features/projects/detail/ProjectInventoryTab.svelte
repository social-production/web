<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import ProjectInventorySummary from './components/ProjectInventorySummary.svelte';
  import { addProjectServiceRequest } from '$lib/services/commands/projects';
  import type { ProjectInventoryFrameData } from '$lib/types/detail';

  export let frame: ProjectInventoryFrameData;

  type AssetRequestUse = 'project' | 'individual';

  let requestedAssetQuantities: Record<string, number> = {};
  let requestComposerOpen = false;
  let requestUse: AssetRequestUse | null = null;
  let requestDescription = '';
  let requestEstimatedDate = '';
  let requestNeedsDelivery = false;
  let requestPending = false;

  function allAssets() {
    return frame.assetGroups.flatMap((group) => group.assets);
  }

  function maxRequestableQuantity(assetId: string) {
    const asset = allAssets().find((entry) => entry.id === assetId);

    if (!asset) {
      return 0;
    }

    return Math.max(asset.availableQuantity ?? asset.quantity ?? 1, 0);
  }

  function selectedAssetRequests() {
    const assetMap = new Map(allAssets().map((asset) => [asset.id, asset]));

    return Object.entries(requestedAssetQuantities).flatMap(([assetId, quantity]) => {
      const asset = assetMap.get(assetId);

      return asset && quantity > 0 ? [{ asset, quantity }] : [];
    });
  }

  function setRequestedQuantity(assetId: string, quantity: number) {
    const nextQuantity = Math.max(0, Math.min(quantity, maxRequestableQuantity(assetId)));

    if (nextQuantity === 0) {
      const { [assetId]: _removed, ...rest } = requestedAssetQuantities;
      requestedAssetQuantities = rest;
      return;
    }

    requestedAssetQuantities = {
      ...requestedAssetQuantities,
      [assetId]: nextQuantity
    };
  }

  function selectedAssetLineCount() {
    return selectedAssetRequests().length;
  }

  function selectedUnitCount() {
    return selectedAssetRequests().reduce((total, entry) => total + entry.quantity, 0);
  }

  function resetRequestComposerFields() {
    requestUse = null;
    requestDescription = '';
    requestEstimatedDate = '';
    requestNeedsDelivery = false;
  }

  function openRequestComposer() {
    if (selectedAssetLineCount() === 0) {
      return;
    }

    requestComposerOpen = true;
    requestUse = null;
  }

  function closeRequestComposer() {
    requestComposerOpen = false;
    resetRequestComposerFields();
  }

  function selectedAssetLabel() {
    const assets = selectedAssetRequests();

    if (assets.length === 0) {
      return 'No assets selected';
    }

    if (assets.length === 1) {
      return `${assets[0].asset.title} x ${assets[0].quantity}`;
    }

    return `${selectedUnitCount()} units across ${assets.length} assets`;
  }

  function estimatedRequestWindow(date: string) {
    const startAt = new Date(`${date}T09:00`);
    const endAt = new Date(`${date}T17:00`);

    return {
      scheduledAt: startAt.toISOString(),
      endsAt: endAt.toISOString()
    };
  }

  async function submitAssetRequest() {
    if (!requestUse || !requestDescription.trim() || !requestEstimatedDate || selectedAssetLineCount() === 0) {
      return;
    }

    const assets = selectedAssetRequests();
    const { scheduledAt, endsAt } = estimatedRequestWindow(requestEstimatedDate);
    const requestTitle =
      requestUse === 'project'
        ? `Project asset request: ${selectedAssetLabel()}`
        : `Individual asset request: ${selectedAssetLabel()}`;
    const requestBody = [
      `Use type: ${requestUse === 'project' ? 'Project use' : 'Individual use'}`,
      `Estimated date of use: ${requestEstimatedDate}`,
      `Delivery needed: ${requestNeedsDelivery ? 'Yes' : 'No'}`,
      '',
      requestDescription.trim(),
      '',
      'Requested assets:',
      ...assets.map(({ asset, quantity }) => `- ${asset.title} x ${quantity}`)
    ].join('\n');

    requestPending = true;

    try {
      await addProjectServiceRequest(frame.projectSlug, {
        title: requestTitle,
        body: requestBody,
        scheduledAt,
        endsAt
      });
      await invalidateAll();
      requestedAssetQuantities = {};
      closeRequestComposer();
    } finally {
      requestPending = false;
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeRequestComposer();
    }
  }

  function handleBackdropKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      closeRequestComposer();
    }
  }

  function handleWindowKeydown(event: KeyboardEvent) {
    if (requestComposerOpen && event.key === 'Escape') {
      closeRequestComposer();
    }
  }

  $: if (selectedAssetLineCount() === 0 && requestComposerOpen) {
    closeRequestComposer();
  }
</script>

<svelte:window on:keydown={handleWindowKeydown} />

<section class="inventory-tab">
  <ProjectInventorySummary {frame} {requestedAssetQuantities} {setRequestedQuantity} />

  {#if frame.canRequestAssets}
    <section class="request-toolbar">
      <span class="selection-copy">
        {#if selectedAssetLineCount() === 0}
          Select inventory to request.
        {:else}
          {selectedUnitCount()} units across {selectedAssetLineCount()} assets selected
        {/if}
      </span>
      <div class="action-row">
        <button
          class="secondary-button"
          disabled={selectedAssetLineCount() === 0}
          type="button"
          on:click={openRequestComposer}
        >
          Request
        </button>
      </div>
    </section>

    {#if requestComposerOpen}
      <div
        aria-hidden="true"
        class="request-backdrop"
        on:click={handleBackdropClick}
        on:keydown={handleBackdropKeydown}
        role="presentation"
        tabindex="-1"
      >
        <section aria-modal="true" class="request-card" role="dialog">
          <div class="request-head">
            <div class="heading-copy">
              <h2>Asset request</h2>
              <p class="selection-copy">{selectedAssetLabel()}</p>
            </div>
            <button class="text-button" type="button" on:click={closeRequestComposer}>Cancel</button>
          </div>

          <div class="request-use-row" role="group" aria-label="Request use type">
            <button
              class:active-request-use={requestUse === 'project'}
              class="secondary-button request-use-button"
              type="button"
              on:click={() => (requestUse = 'project')}
            >
              Request for project use
            </button>
            <button
              class:active-request-use={requestUse === 'individual'}
              class="secondary-button request-use-button"
              type="button"
              on:click={() => (requestUse = 'individual')}
            >
              Request for individual use
            </button>
          </div>

          <label class="field">
            <span>Description</span>
            <textarea bind:value={requestDescription} rows="4" placeholder="What will the asset be used for?"></textarea>
          </label>

          <div class="form-row">
            <label class="field">
              <span>Estimated date of use</span>
              <input bind:value={requestEstimatedDate} type="date" />
            </label>

            <label class="checkbox-field">
              <input bind:checked={requestNeedsDelivery} type="checkbox" />
              <span>I will need delivery</span>
            </label>
          </div>

          <div class="action-row">
            <button
              class="primary-button"
              disabled={!requestUse || requestPending}
              type="button"
              on:click={submitAssetRequest}
            >
              Submit request
            </button>
          </div>
        </section>
      </div>
    {/if}
  {/if}
</section>

<style>
  .inventory-tab {
    display: grid;
    gap: 12px;
  }

  .request-toolbar,
  .request-card,
  .request-head,
  .action-row,
  .form-row,
  .field,
  .heading-copy {
    display: grid;
    gap: 12px;
  }

  .request-toolbar,
  .request-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .request-head,
  .action-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .selection-copy,
  .field span,
  .checkbox-field span {
    color: var(--text-soft);
  }

  .request-use-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .request-use-button.active-request-use {
    border-color: color-mix(in srgb, var(--brand) 40%, var(--panel-border));
    color: var(--brand-strong);
    background: color-mix(in srgb, var(--brand-soft) 72%, var(--panel));
  }

  h2,
  p {
    margin: 0;
  }

  textarea,
  input[type='date'] {
    width: 100%;
  }

  .form-row {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
  }

  .checkbox-field {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    min-height: 42px;
  }

  .text-button {
    color: var(--text-soft);
    font-weight: 700;
  }

  .request-backdrop {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 24px;
    background: color-mix(in srgb, var(--text-main) 18%, transparent);
    z-index: 80;
  }

  .request-card {
    width: min(560px, calc(100vw - 40px));
    background: var(--panel-soft);
    box-shadow: 0 18px 40px color-mix(in srgb, var(--text-main) 14%, transparent);
  }

  @media (max-width: 760px) {
    .form-row {
      grid-template-columns: minmax(0, 1fr);
    }

    .request-use-row {
      display: grid;
    }
  }
</style>