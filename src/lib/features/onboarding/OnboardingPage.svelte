<script lang="ts">
  import type { OnboardingPageData } from '$lib/types/account';

  export let data: OnboardingPageData;
</script>

<section class="page">
  <section class="hero-card">
    <h1>{data.title}</h1>
    <p>{data.intro}</p>
  </section>

  <section class="grid">
    <section class="panel">
      <h2>Account Mode</h2>
      <div class="stack">
        {#each data.accountModes as option}
          <div class="option-row">
            <strong>{option.label}</strong>
            <span>{option.description}</span>
          </div>
        {/each}
      </div>
    </section>

    <section class="panel">
      <h2>Profile Visibility</h2>
      <div class="stack">
        {#each data.visibilityOptions as option}
          <div class="option-row">
            <strong>{option.label}</strong>
            <span>{option.description}</span>
          </div>
        {/each}
      </div>
    </section>
  </section>

  <section class="grid">
    <section class="panel">
      <h2>Starter Channels</h2>
      <div class="chip-row">
        {#each data.starterChannels as label}
          <span class="tag-chip">{label}</span>
        {/each}
      </div>
    </section>

    <section class="panel">
      <h2>Starter Communities</h2>
      <div class="chip-row">
        {#each data.starterCommunities as label}
          <span class="tag-chip community">{label}</span>
        {/each}
      </div>
    </section>
  </section>
</section>

<style>
  .page,
  .stack {
    display: grid;
    gap: 12px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .hero-card,
  .panel,
  .option-row {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  h1 {
    font-size: 22px;
    letter-spacing: -0.02em;
    color: var(--brand-strong);
  }

  h2,
  strong {
    font-size: 14px;
  }

  p,
  span {
    color: var(--text-soft);
    line-height: 1.45;
  }

  .hero-card p,
  .option-row span {
    margin-top: 6px;
  }

  .chip-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .tag-chip {
    display: inline-flex;
    padding: 7px 10px;
    border-radius: var(--radius-sm);
    background: var(--brand-soft);
    color: var(--brand-strong);
    font-size: 12px;
    font-weight: 700;
  }

  .community {
    background: var(--accent-warm-soft);
    color: var(--accent-warm-strong);
  }

  @media (max-width: 760px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>