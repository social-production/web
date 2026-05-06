<script lang="ts">
  import PostDetailPage from '$lib/features/posts/PostDetailPage.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<PostDetailPage data={data.post} />