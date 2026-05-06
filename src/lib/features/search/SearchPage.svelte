<script lang="ts">
  import type { SearchPageData } from '$lib/types/search';

  export let data: SearchPageData;

  const kindLabels = {
    project: 'Project',
    thread: 'Thread',
    event: 'Event',
    channel: 'Channel',
    community: 'Community',
    profile: 'Profile'
  } as const;
</script>

<section class="page">
  <section class="hero-card">
    <h1>Search</h1>
    {#if data.query.trim()}
      <p>Showing results for "{data.query}".</p>
    {:else}
      <p>Browse suggested results across public work, channels, communities, and profiles.</p>
    {/if}

    <div class="chip-row">
      {#each data.suggestedQueries as query}
        <a class="query-chip" href={`/search?q=${encodeURIComponent(query)}`}>{query}</a>
      {/each}
    </div>
  </section>

  <div class="stack">
    {#if data.results.length === 0}
      <section class="result-card">
        <h2>No results</h2>
        <p>Try a channel name, community name, project title, or username.</p>
      </section>
    {:else}
      {#each data.results as result}
        <a class="result-card" href={result.href}>
          <div class="topline">
            <span class="kind-chip">{kindLabels[result.kind]}</span>
            <span>{result.meta}</span>
          </div>
          <h2>{result.title}</h2>
          <p>{result.summary}</p>
        </a>
      {/each}
    {/if}
  </div>
</section>

<style>
  .page,
  .stack {
    display: grid;
    gap: 12px;
  }

  .hero-card,
  .result-card {
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

  h2 {
    margin-top: 8px;
    font-size: 16px;
  }

  p,
  span {
    color: var(--text-soft);
    line-height: 1.45;
  }

  .chip-row,
  .topline {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
  }

  .topline {
    justify-content: space-between;
  }

  .query-chip,
  .kind-chip {
    display: inline-flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    font-size: 12px;
    font-weight: 700;
  }

  .query-chip {
    background: var(--panel-strong);
    color: var(--text-main);
  }

  .kind-chip {
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .result-card p {
    margin-top: 8px;
  }
</style>