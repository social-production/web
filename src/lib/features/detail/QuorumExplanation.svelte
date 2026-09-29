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
  <section class="current-card">
    <span class="kicker">This {entityLabel}</span>
    {#if votesRequired <= 0}
      <p class="lead">No votes required yet. Quorum is derived once this {entityLabel} has an active audience.</p>
    {:else}
      <p class="lead">
        <strong>{formatCount(votesRequired)}</strong>
        {votesRequired === 1 ? 'vote' : 'votes'} from
        <strong>{formatCount(audienceSize)}</strong>
        {audienceLabel}
        {#if currentPercent}
          <span class="pct">({currentPercent} of N)</span>
        {/if}
      </p>
    {/if}
  </section>

  <p>
    That audience (N) is weekly unique people who took a meaningful action in the last 7 days
    {#if usesPlatform}
      across the platform, because this {entityLabel} is platform-tagged and affects everyone
    {:else}
      among members of this {entityLabel}
    {/if}.
    N is not the quorum. The required vote count is a sample sized from N, so not everyone has to vote.
  </p>

  <p>
    Once quorum is met, a decision still needs at least <strong>66% yes among votes cast</strong>.
    Meeting quorum unlocks a decision. It does not auto-advance the {entityLabel}.
  </p>

  <div class="math-card" aria-label="Quorum formula">
    <h3>How the number is set</h3>
    <p><strong>Audience N</strong> = weekly unique actives in this vote context</p>
    <p><strong>Margin of error</strong> tightens as N grows (about 10% for tiny groups, toward 2% at large scale)</p>
    <p>
      <strong>Quorum</strong> = min(ceil(0.75 × N), Cochran sample size for that margin). Tiny groups
      often land near 75% of N. Large groups need a much smaller share.
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
    gap: 14px;
    padding: 4px 16px 24px;
  }

  .quorum-copy p,
  .quorum-copy li {
    margin: 0;
    color: var(--text-soft);
    font-size: 14px;
    line-height: 1.5;
  }

  .quorum-copy strong,
  .example-card h4,
  .math-card h3 {
    color: var(--text-main);
  }

  .current-card,
  .math-card,
  .example-card {
    display: grid;
    gap: 8px;
    padding: 14px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel-strong);
  }

  .current-card {
    background: color-mix(in srgb, var(--brand-soft) 55%, var(--panel));
    border-color: color-mix(in srgb, var(--brand) 35%, var(--panel-border));
  }

  .kicker {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--brand-strong);
  }

  .lead {
    color: var(--text-main);
    font-size: 18px;
    line-height: 1.35;
    font-weight: 650;
  }

  .math-card h3,
  .example-card h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
  }

  .formula-steps {
    margin: 0;
    padding-left: 1.2em;
    display: grid;
    gap: 8px;
  }

  .example-grid {
    display: grid;
    gap: 10px;
  }

  .meta,
  .pct {
    color: var(--text-muted);
    font-size: 13px;
    font-weight: 600;
  }

  .stat {
    color: var(--text-main);
    font-weight: 650;
  }
</style>
