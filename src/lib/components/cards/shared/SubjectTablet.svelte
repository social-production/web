<script lang="ts">
  import { projectSubjectLabel } from '$lib/features/projects/projectMode';
  import type { ProjectMode, SubjectKind } from '$lib/types/feed';
  import Tablet from '$lib/components/cards/shared/Tablet.svelte';

  export let kind: SubjectKind;
  export let projectMode: ProjectMode = 'productive';

  function subjectLabel(subjectKind: SubjectKind, mode: ProjectMode) {
    if (subjectKind === 'project') {
      return projectSubjectLabel(mode);
    }

    return subjectKind.charAt(0).toUpperCase() + subjectKind.slice(1);
  }

  function subjectVariant(
    subjectKind: SubjectKind,
    mode: ProjectMode
  ):
    | 'thread'
    | 'event'
    | 'post'
    | 'stage'
    | 'project-production'
    | 'project-service'
    | 'project-personal-service' {
    if (subjectKind === 'project') {
      if (mode === 'productive') {
        return 'project-production';
      }

      return mode === 'personal-service' ? 'project-personal-service' : 'project-service';
    }

    if (subjectKind === 'thread' || subjectKind === 'event' || subjectKind === 'post') {
      return subjectKind;
    }

    return 'stage';
  }

  let label = subjectLabel(kind, projectMode);
  let variant:
    | 'thread'
    | 'event'
    | 'post'
    | 'stage'
    | 'project-production'
    | 'project-service'
    | 'project-personal-service' = subjectVariant(kind, projectMode);

  $: label = subjectLabel(kind, projectMode);
  $: variant = subjectVariant(kind, projectMode);
</script>

<Tablet {label} {variant} />