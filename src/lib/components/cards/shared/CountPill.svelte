<script lang="ts">
  export let label: string;

  $: countMatch = label.match(/^(\d+)/);
  $: compactCount = countMatch?.[1] ?? '';
</script>

<span class="pill" aria-label={label}>
  <span aria-hidden="true" class="pill-icon">
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2.5 3.25A1.25 1.25 0 0 1 3.75 2h8.5a1.25 1.25 0 0 1 1.25 1.25v5.5A1.25 1.25 0 0 1 12.25 10H9.2l-2.1 2.45a.5.5 0 0 1-.8-.4V10H3.75A1.25 1.25 0 0 1 2.5 8.75v-5.5Z"
        stroke="currentColor"
        stroke-width="1.2"
        stroke-linejoin="round"
      />
    </svg>
  </span>
  <span class="pill-text">{label}</span>
  {#if compactCount}
    <span aria-hidden="true" class="pill-count">{compactCount}</span>
  {/if}
</span>

<style>
  .pill {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 32px;
    padding: 4px 6px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
    transition: border-color 120ms ease, background-color 120ms ease, color 120ms ease;
  }

  .pill:hover {
    border-color: var(--brand);
    background: color-mix(in srgb, var(--brand-soft) 78%, var(--panel-strong));
    color: var(--brand-strong);
  }

  .pill-text {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .pill-icon,
  .pill-count {
    display: inline-flex;
    align-items: center;
  }

  .pill-icon svg {
    width: 16px;
    height: 16px;
    display: block;
  }

  .pill-count {
    min-width: 20px;
    text-align: center;
    color: var(--text-main);
  }

  @media (max-width: 760px) {
    .pill {
      gap: 3px;
      min-height: 24px;
      padding: 2px 4px;
      border-color: color-mix(in srgb, var(--panel-border) 88%, transparent);
      font-size: 11px;
    }

    .pill-icon svg {
      width: 14px;
      height: 14px;
    }

    .pill-count {
      min-width: 16px;
    }
  }
</style>
