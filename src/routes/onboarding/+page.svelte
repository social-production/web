<script lang="ts">
  import OnboardingPage from '$lib/features/onboarding/OnboardingPage.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<OnboardingPage data={data.onboarding} />