<script lang="ts">
  import { afterNavigate, goto } from '$app/navigation';
  import { createLiveSearchScheduler } from '$lib/features/search/liveSearch';
  import { searchKindLabels } from '$lib/features/search/searchKinds';
  import SearchSuggestionsList from '$lib/features/search/SearchSuggestionsList.svelte';
  import type { SearchPageData } from '$lib/types/search';
  import type { SearchResultItem } from '$lib/types/search';

  export let data: SearchPageData;

  const liveSearch = createLiveSearchScheduler();

  let draftQuery = data.query;
  let liveResults: SearchResultItem[] = data.results;
  let liveLoading = false;
  let showSuggestions = false;
  let loadedQuery = data.query;

  afterNavigate(() => {
    if (data.query !== loadedQuery) {
      loadedQuery = data.query;
      draftQuery = data.query;
      liveResults = data.results;
      liveLoading = false;
      showSuggestions = false;
    }
  });

  function handleInput(event: Event) {
    draftQuery = (event.currentTarget as HTMLInputElement).value;
    showSuggestions = true;
    liveSearch.schedule(draftQuery, (results, loading) => {
      liveResults = results;
      liveLoading = loading;
    });
  }

  function handleFocus() {
    if (draftQuery.trim()) {
      showSuggestions = true;
      liveSearch.schedule(draftQuery, (results, loading) => {
        liveResults = results;
        liveLoading = loading;
      });
    }
  }

  function handleBlur() {
    window.setTimeout(() => {
      showSuggestions = false;
    }, 150);
  }

  async function submitSearch(event: Event) {
    event.preventDefault();
    showSuggestions = false;
    const query = draftQuery.trim();
    await goto(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
  }

  async function openSuggestion(href: string) {
    showSuggestions = false;
    await goto(href);
  }
</script>

<section class="page">
  <section class="hero-card">
    <h1>Search</h1>
    {#if data.query.trim()}
      <p>Showing results for "{data.query}".</p>
    {:else}
      <p>Search channels, communities, projects, events, and profiles.</p>
    {/if}

    <form class="search-form" role="search" on:submit={submitSearch}>
      <div class="search-input-wrap">
        <input
          aria-label="Search"
          class="search-input"
          on:blur={handleBlur}
          on:focus={handleFocus}
          on:input={handleInput}
          placeholder="Channels, communities, projects, usernames..."
          type="search"
          value={draftQuery}
        />
        {#if showSuggestions && draftQuery.trim()}
          <SearchSuggestionsList loading={liveLoading} overlay results={liveResults} onSelect={openSuggestion} />
        {/if}
      </div>
      <button class="primary-button" type="submit">Search</button>
    </form>

    {#if !data.query.trim()}
      <div class="chip-row">
        {#each data.suggestedQueries as query}
          <a class="query-chip" href={`/search?q=${encodeURIComponent(query)}`}>{query}</a>
        {/each}
      </div>
    {/if}
  </section>

  <div class="stack">
    {#if data.query.trim() && data.results.length === 0 && !liveLoading}
      <section class="result-card">
        <h2>No results</h2>
        <p>Try a channel name, community name, project title, or username.</p>
      </section>
    {:else if data.query.trim()}
      {#each data.results as result}
        <a class="result-card" href={result.href}>
          <div class="topline">
            <span class="kind-chip">{searchKindLabels[result.kind]}</span>
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

  .search-form {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
    margin-top: 12px;
  }

  .search-input-wrap {
    position: relative;
    min-width: 0;
  }

  .search-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-main);
  }

  .primary-button {
    padding: 10px 14px;
    border: 1px solid var(--brand);
    border-radius: var(--radius-sm);
    background: var(--brand-soft);
    color: var(--brand-strong);
    font-weight: 700;
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

  .chip-row {
    margin-top: 12px;
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
