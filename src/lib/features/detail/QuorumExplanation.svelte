<script lang="ts">
  import {
    platformVoteExamples,
    projectVoteExamples,
    quorumFormulaSteps
  } from '$lib/features/about/aboutContent';

  export let votesRequired = 0;
  export let audienceSize = 0;
  export let audienceLabel = '';
  export let usesPlatform = false;
  export let entityLabel = 'project';

  $: examples = (usesPlatform ? platformVoteExamples : projectVoteExamples).map((example) => ({
    ...example,
    title: example.title.replace(/project/gi, entityLabel),
    audience: example.audience.replace(/Project/g, entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1))
  }));
  $: currentPercent =
    audienceSize > 0 && votesRequired > 0
      ? `${Math.round((votesRequired / audienceSize) * 1000) / 10}%`
      : null;

  function formatCount(n: number) {
    return n.toLocaleString('en-US');
  }
</script>

<div class="quorum-copy">
  {#if votesRequired <= 0}
    <p>No votes required yet. Quorum is derived once this {entityLabel} has an active audience.</p>
  {:else}
    <p>
      Right now this {entityLabel} needs
      <strong>{formatCount(votesRequired)} {votesRequired === 1 ? 'vote' : 'votes'} cast</strong>
      from an audience of
      <strong>{formatCount(audienceSize)} {audienceLabel}</strong>
      {#if currentPercent}
        ({currentPercent} of N)
      {/if}.
    </p>
  {/if}

  <p>
    That audience (N) is weekly unique people who took a meaningful action in the last 7 days
    {#if usesPlatform}
      across the platform, because this {entityLabel} is platform-tagged and affects everyone
    {:else}
      among members of this {entityLabel}
    {/if}.
    N is not the quorum — the required vote count is a sample sized from N, so not everyone has to vote.
  </p>

  <p>
    Once quorum is met, a decision still needs at least <strong>66% yes among votes cast</strong>.
    Meeting quorum unlocks a decision; it does not auto-advance the {entityLabel}.
  </p>

  <div class="math-card" aria-label="Quorum formula">
    <p><strong>Audience N</strong> = weekly unique actives in this vote context</p>
    <p><strong>Margin of error</strong> tightens as N grows (about 10% for tiny groups, toward 2% at large scale)</p>
    <p>
      <strong>Quorum</strong> = min(ceil(0.75 × N), Cochran sample size for that margin). Tiny groups
      often land near 75% of N; large groups need a much smaller share.
    </p>
    <p><strong>Pass</strong> when votes cast ≥ quorum and yes / total ≥ 66%</p>
  </div>

  <ol class="formula-steps">
    {#each quorumFormulaSteps as step}
      <li>{step}</li>
    {/each}
  </ol>

  <div class="example-grid">
    {#each examples as example}
      <article class="example-card">
        <h4>{example.title}</h4>
        <p class="meta">{example.audience}</p>
        <p class="stat">
          N = {formatCount(example.n)} → quorum <strong>{formatCount(example.required)}</strong>
          <span class="pct">({example.percent})</span>
        </p>
        <p>{example.note}</p>
      </article>
    {/each}
  </div>
</div>

<style>
  .quorum-copy {
    display: grid;
    gap: 10px;
  }

  .quorum-copy p,
  .quorum-copy li {
    margin: 0;
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.5;
  }

  .quorum-copy strong,
  .example-card h4 {
    color: var(--text-main);
    font-size: 13px;
  }

  .math-card,
  .example-card {
    display: grid;
    gap: 6px;
    padding: 10px 12px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
  }

  .formula-steps {
    margin: 0;
    padding-left: 1.2em;
    display: grid;
    gap: 6px;
  }

  .example-grid {
    display: grid;
    gap: 8px;
  }

  .example-card h4 {
    margin: 0;
    font-size: 12px;
    font-weight: 700;
  }

  .meta,
  .pct {
    color: var(--text-muted);
    font-size: 12px;
  }

  .stat {
    color: var(--text-main);
    font-weight: 600;
  }
</style>
