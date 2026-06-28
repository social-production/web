<script lang="ts">
  import { page } from '$app/stores';
  import { dev } from '$app/environment';

  let showDetails = false;

  function reloadPage() {
    window.location.reload();
  }

  function goHome() {
    window.location.href = '/';
  }
</script>

<main class="error-page">
  <section class="error-card">
    <p class="eyebrow">Something went wrong</p>
    <h1>We could not load this page</h1>
    <p class="message">
      {#if $page.error?.message}
        {$page.error.message}
      {:else}
        The app hit an unexpected problem. Try reloading, or return home and open the page again.
      {/if}
    </p>

    <div class="actions">
      <button type="button" class="primary" on:click={reloadPage}>Reload</button>
      <button type="button" class="secondary" on:click={goHome}>Go home</button>
    </div>

    {#if dev && $page.error}
      <button type="button" class="details-toggle" on:click={() => (showDetails = !showDetails)}>
        {showDetails ? 'Hide details' : 'Show details'}
      </button>
      {#if showDetails}
        <pre class="details">{JSON.stringify($page.error, null, 2)}</pre>
      {/if}
    {/if}
  </section>
</main>

<style>
  .error-page {
    min-height: 100vh;
    min-height: 100dvh;
    display: grid;
    place-items: center;
    padding: 24px;
    background: var(--page-background);
    color: var(--text-main);
  }

  .error-card {
    width: min(100%, 520px);
    padding: 28px;
    border-radius: 16px;
    border: 1px solid var(--panel-border);
    background: var(--panel);
    box-shadow: 0 10px 30px color-mix(in srgb, var(--page-bg) 82%, transparent);
  }

  .eyebrow {
    margin: 0 0 8px;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-soft, #6b7280);
  }

  h1 {
    margin: 0 0 12px;
    font-size: 24px;
    line-height: 1.2;
  }

  .message {
    margin: 0 0 20px;
    line-height: 1.5;
    color: var(--text-soft, #374151);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  button {
    border-radius: 10px;
    padding: 10px 14px;
    font: inherit;
    cursor: pointer;
  }

  .primary {
    border: none;
    background: var(--brand);
    color: var(--page-bg);
  }

  .secondary {
    border: 1px solid var(--panel-border);
    background: transparent;
    color: inherit;
  }

  .details-toggle {
    margin-top: 18px;
    border: none;
    background: transparent;
    color: var(--text-soft, #6b7280);
    padding: 0;
    text-decoration: underline;
  }

  .details {
    margin-top: 12px;
    padding: 12px;
    overflow: auto;
    border-radius: 10px;
    background: var(--surface-2, #f3f4f6);
    font-size: 12px;
    line-height: 1.4;
    white-space: pre-wrap;
    word-break: break-word;
  }
</style>
