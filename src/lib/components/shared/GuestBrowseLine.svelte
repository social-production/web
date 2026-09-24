<script lang="ts">
  import { page } from '$app/stores';

  export let kind = 'page';
</script>

{#if !$page.data.bootstrap?.viewer}
  <p class="guest-browse">
    You're browsing this {kind}.
    <a href="/onboarding">Sign in</a>
    to support, join, or vote.
  </p>
{/if}

<style>
  .guest-browse {
    margin: 0;
    color: var(--text-soft);
    font-size: 13px;
    line-height: 1.45;
  }

  .guest-browse a {
    color: var(--brand-strong);
    font-weight: 700;
    text-decoration: none;
  }

  .guest-browse a:hover {
    text-decoration: underline;
  }
</style>
