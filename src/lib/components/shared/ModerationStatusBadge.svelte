<script lang="ts">
  import type { ContentReportSummary, ModerationState } from '$lib/types/detail/shared';
  import { moderationStatusLabel } from '$lib/utils/moderation';

  export let moderationState: ModerationState | null | undefined = undefined;
  export let report: ContentReportSummary | null | undefined = null;
  export let isUnderReview = false;
  export let hasActiveReport = false;

  $: label = moderationStatusLabel({ moderationState, report, isUnderReview, hasActiveReport });
</script>

{#if label}
  <span
    class:under-review={label === 'Under review'}
    class:hidden-state={label === 'Hidden'}
    class="moderation-status-badge"
  >{label}</span>
{/if}

<style>
  .moderation-status-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border: 1px solid var(--panel-border);
    border-radius: 999px;
    background: color-mix(in srgb, var(--panel-soft) 82%, var(--brand-soft) 18%);
    color: var(--text-soft);
    font-size: 11.5px;
    font-weight: 700;
    line-height: 1.25;
    white-space: nowrap;
  }

  .moderation-status-badge.under-review {
    border-color: var(--brand);
    background: var(--brand-soft);
    color: var(--brand-strong);
  }

  .moderation-status-badge.hidden-state {
    border-color: color-mix(in srgb, var(--brand) 55%, var(--panel-border));
    background: var(--brand-badge);
    color: var(--brand-strong);
  }
</style>
