<script lang="ts">
  import { isCollectiveServiceProject, isPersonalServiceProject } from '$lib/features/projects/projectMode';
  import type { ProjectPageData } from '$lib/types/detail';

  export let projectMode: ProjectPageData['projectMode'];

  function completionCopy() {
    if (isPersonalServiceProject(projectMode)) {
      return 'This phase closes the current personal service or converts it into a collective service or productive project when the work grows beyond one person.';
    }

    if (isCollectiveServiceProject(projectMode)) {
      return 'This phase closes the service while keeping its history visible. If related work continues later, it should either move back into planning or link to a new project.';
    }

    return 'This phase marks the project as completed or converted into an ongoing service. The history above stays visible either way.';
  }
</script>

<section class="phase-surface">
  <div class="empty-card">{completionCopy()}</div>
</section>

<style>
  .phase-surface,
  .empty-card {
    display: grid;
    gap: 12px;
  }

  .empty-card {
    padding: 16px;
    border: 1px solid var(--panel-border);
    border-radius: var(--radius-sm);
    background: var(--panel);
    color: var(--text-soft);
    line-height: 1.5;
  }
</style>