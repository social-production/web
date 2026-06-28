<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { redeemScopeInvite } from '$lib/services/queries/scopes';
  import { parseInviteToken } from '$lib/utils/invite-token';

  let status = 'Redeeming invite…';

  onMount(async () => {
    const token = parseInviteToken($page.url.searchParams.get('token') ?? $page.url.searchParams.get('invite') ?? '');

    if (!token) {
      status = 'Missing invite token.';
      return;
    }

    const result = await redeemScopeInvite('community', '', token);

    if (!result.ok) {
      status = 'That invite link or code is invalid or expired.';
      return;
    }

    if (result.slug) {
      await goto(`/communities/${result.slug}`);
      return;
    }

    status = 'Invite redeemed, but the destination community could not be resolved.';
  });
</script>

<section class="page">
  <p>{status}</p>
</section>

<style>
  .page {
    padding: 24px;
    color: var(--text-soft);
  }
</style>
