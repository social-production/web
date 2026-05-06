<script lang="ts">
  export let label: string;
  export let variant:
    | 'thread'
    | 'event'
    | 'project-production'
    | 'project-service'
    | 'project-personal-service'
    | 'post'
    | 'channel'
    | 'community'
    | 'platform'
    | 'stage'
    | 'audience'
    | 'visibility' = 'stage';
</script>

<span class={`tablet ${variant}`}>{label}</span>

<style>
  .tablet {
    display: inline-flex;
    align-items: center;
    padding: 4px 9px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: 0.02em;
    white-space: nowrap;
    color: #fff;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.18);
  }

  .thread {
    background: var(--tablet-thread-bg);
  }

  .event {
    background: var(--tablet-event-bg);
  }

  .project-production {
    background: var(--tablet-project-production-bg);
  }

  .project-service {
    background: var(--tablet-project-service-bg);
  }

  .project-personal-service {
    background: var(--tablet-project-personal-service-bg);
  }

  .post {
    background: var(--tablet-post-bg);
  }

  .channel {
    background: var(--tablet-channel-bg);
  }

  .community {
    background: var(--tablet-community-bg);
  }

  .platform {
    background: var(--tablet-platform-bg);
  }

  .stage,
  .audience,
  .visibility {
    background: var(--tablet-neutral-bg);
  }
</style>