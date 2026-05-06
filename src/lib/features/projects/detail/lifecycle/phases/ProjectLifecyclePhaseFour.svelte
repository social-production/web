<section class="phase-surface">
  <div class="empty-card locked-card">
    Funding and shared resource acquisition are intentionally unavailable in this beta, so projects skip from planning straight into activity once the relevant plan votes are settled.
  </div>

  <div class="meta-card">
    <strong>When this phase is built</strong>
    <p>
      Managers will be able to line up community funding, sourced materials, and any other required inputs before activity scheduling begins.
    </p>
  </div>
</section>

<style>
  .phase-surface,
  .empty-card,
  .meta-card {
    display: grid;
    gap: 12px;
  }

  .empty-card,
  .meta-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    line-height: 1.5;
  }

  .empty-card {
    background: var(--panel);
    color: var(--text-soft);
  }

  .locked-card {
    border-color: var(--tablet-community-bg);
    color: var(--tablet-community-text);
    background: color-mix(in srgb, var(--tablet-community-bg) 14%, var(--panel));
  }

  .meta-card {
    background: var(--panel-strong);
  }

  .meta-card strong {
    color: var(--text-main);
  }

  .meta-card p {
    margin: 0;
    color: var(--text-soft);
  }
</style>