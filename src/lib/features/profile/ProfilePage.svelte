<script lang="ts">
  import PersonalFeedCard from '$lib/components/cards/personal-feed/PersonalFeedCard.svelte';
  import type { ProfilePageData } from '$lib/types/account';
  import type { PersonalFeedItem } from '$lib/types/feed';

  export let data: ProfilePageData;

  type FeedFilter = 'all' | 'public' | 'personal';
  type PeopleListMode = 'followers' | 'following' | null;
  type SortMode = 'newest' | 'top';

  let activeFilter: FeedFilter = 'all';
  let activePeopleList: PeopleListMode = null;
  let sortMode: SortMode = 'newest';

  function togglePeopleList(mode: Exclude<PeopleListMode, null>) {
    activePeopleList = activePeopleList === mode ? null : mode;
  }

  function matchesFilter(item: PersonalFeedItem, filter: FeedFilter) {
    if (filter === 'all') {
      return true;
    }

    if (filter === 'public') {
      return item.kind === 'activity' || (item.kind === 'post' && item.audience === 'public');
    }

    return item.kind === 'post';
  }

  function score(item: PersonalFeedItem) {
    return item.voteCount + item.commentCount;
  }

  $: visibleFeed = data.feed
    .filter((item) => matchesFilter(item, activeFilter))
    .slice()
    .sort((left, right) => {
      if (sortMode === 'top') {
        const difference = score(right) - score(left);

        if (difference !== 0) {
          return difference;
        }
      }

      return +new Date(right.createdAt) - +new Date(left.createdAt);
    });
  $: peopleItems = activePeopleList === 'followers' ? data.followers : data.following;
</script>

<section class="page">
  <section class="hero-card">
    <div class="hero-topline">
      <div>
        <span class="eyebrow">Profile</span>
        <h1>{data.username}</h1>
      </div>

      <div class="stats-row">
        <button class:active={activePeopleList === 'followers'} class="stat-chip" type="button" on:click={() => togglePeopleList('followers')}>
          <strong>{data.followersCount}</strong>
          <span>Followers</span>
        </button>
        <button class:active={activePeopleList === 'following'} class="stat-chip" type="button" on:click={() => togglePeopleList('following')}>
          <strong>{data.followingCount}</strong>
          <span>Following</span>
        </button>
      </div>
    </div>

    {#if data.bio}
      <p>{data.bio}</p>
    {/if}
  </section>

  {#if activePeopleList}
    <section class="people-card">
      <div class="people-topline">
        <h2>{activePeopleList === 'followers' ? 'Followers' : 'Following'}</h2>
        <button class="toolbar-button" type="button" on:click={() => (activePeopleList = null)}>Close</button>
      </div>

      {#if peopleItems.length === 0}
        <p>No users in this list yet.</p>
      {:else}
        <div class="people-list">
          {#each peopleItems as person}
            <a class="person-row" href={`/profile/${person.username}`}>
              <strong>{person.username}</strong>
              {#if person.bio}
                <span>{person.bio}</span>
              {/if}
            </a>
          {/each}
        </div>
      {/if}
    </section>
  {/if}

  <section class="toolbar-card">
    <div class="toolbar-group">
      <button class:active={activeFilter === 'all'} class="toolbar-button" type="button" on:click={() => (activeFilter = 'all')}>
        All
      </button>
      <button
        class:active={activeFilter === 'public'}
        class="toolbar-button"
        type="button"
        on:click={() => (activeFilter = 'public')}
      >
        Public
      </button>
      <button
        class:active={activeFilter === 'personal'}
        class="toolbar-button"
        type="button"
        on:click={() => (activeFilter = 'personal')}
      >
        Personal
      </button>
    </div>

    <div class="toolbar-group">
      <span class="toolbar-label">Sort</span>
      <button
        class:active={sortMode === 'newest'}
        class="toolbar-button"
        type="button"
        on:click={() => (sortMode = 'newest')}
      >
        Newest
      </button>
      <button class:active={sortMode === 'top'} class="toolbar-button" type="button" on:click={() => (sortMode = 'top')}>
        Top
      </button>
    </div>
  </section>

  <section class="feed-stack">
    {#if visibleFeed.length === 0}
      <section class="empty-card">
        <p>{activeFilter === 'personal' && !data.canViewPersonalFeed ? 'This personal feed is hidden from non-followers.' : 'No activity matches this view yet.'}</p>
      </section>
    {:else}
      {#each visibleFeed as item}
        <PersonalFeedCard {item} />
      {/each}
    {/if}
  </section>
</section>

<style>
  .page,
  .feed-stack,
  .people-list {
    display: grid;
    gap: 12px;
  }

  .hero-card,
  .toolbar-card,
  .people-card,
  .empty-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .hero-topline,
  .stats-row,
  .toolbar-card,
  .toolbar-group,
  .people-topline {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
  }

  .hero-topline,
  .toolbar-card,
  .people-topline {
    justify-content: space-between;
  }

  .eyebrow,
  .toolbar-label {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  h1 {
    margin-top: 6px;
    font-size: 22px;
    letter-spacing: -0.02em;
    color: var(--brand-strong);
  }

  p {
    color: var(--text-soft);
    line-height: 1.45;
  }

  .hero-card p {
    margin-top: 10px;
    max-width: 72ch;
  }

  .stat-chip {
    display: grid;
    gap: 4px;
    min-width: 104px;
    padding: 10px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .stat-chip.active {
    border-color: var(--brand);
    background: var(--brand-soft);
  }

  .stat-chip strong {
    font-size: 16px;
  }

  .stat-chip span {
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .toolbar-button {
    padding: 7px 10px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
    color: var(--text-soft);
    font-size: 12px;
    font-weight: 700;
  }

  .toolbar-button.active {
    border-color: var(--brand);
    color: var(--brand-strong);
  }

  .person-row {
    display: grid;
    gap: 4px;
    padding: 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-soft);
  }

  .person-row strong {
    font-size: 14px;
  }

  .person-row span {
    color: var(--text-soft);
    font-size: 12px;
    line-height: 1.45;
  }
</style>