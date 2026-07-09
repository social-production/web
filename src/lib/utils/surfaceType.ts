import { projectSubjectLabel } from '$lib/features/projects/projectMode';
import type { ProjectMode, SubjectKind } from '$lib/types/feed';

export type SurfaceIconId =
  | 'project'
  | 'event'
  | 'thread'
  | 'post'
  | 'help-request'
  | 'channel'
  | 'community'
  | 'platform'
  | 'feedback'
  | 'document';

export type SurfaceTypeAccent =
  | 'thread'
  | 'event'
  | 'post'
  | 'help-request'
  | 'project-production'
  | 'project-service'
  | 'project-personal-service'
  | 'channel'
  | 'community'
  | 'platform'
  | 'neutral';

export function surfaceTypeLabel(kind: SubjectKind, projectMode: ProjectMode = 'productive') {
  if (kind === 'project') {
    return projectSubjectLabel(projectMode);
  }

  if (kind === 'help-request') {
    return 'Help request';
  }

  if (kind === 'post') {
    return 'Post';
  }

  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

export function surfaceTypeAccent(
  kind: SubjectKind,
  projectMode: ProjectMode = 'productive'
): SurfaceTypeAccent {
  if (kind === 'project') {
    if (projectMode === 'productive') {
      return 'project-production';
    }

    return projectMode === 'personal-service' ? 'project-personal-service' : 'project-service';
  }

  if (kind === 'thread' || kind === 'event' || kind === 'post' || kind === 'help-request') {
    return kind;
  }

  return 'neutral';
}

export function surfaceIconForKind(kind: SubjectKind): SurfaceIconId {
  if (kind === 'help-request') {
    return 'help-request';
  }

  if (kind === 'project' || kind === 'event' || kind === 'thread' || kind === 'post') {
    return kind;
  }

  return 'document';
}

export function surfaceAccentCssVar(accent: SurfaceTypeAccent) {
  switch (accent) {
    case 'thread':
      return 'var(--type-accent-thread)';
    case 'event':
      return 'var(--type-accent-event)';
    case 'help-request':
      return 'var(--type-accent-help-request)';
    case 'project-production':
      return 'var(--type-accent-project-production)';
    case 'project-service':
      return 'var(--type-accent-project-service)';
    case 'project-personal-service':
      return 'var(--type-accent-project-personal-service)';
    case 'post':
      return 'var(--type-accent-post)';
    case 'channel':
      return 'var(--type-accent-channel)';
    case 'community':
      return 'var(--type-accent-community)';
    case 'platform':
      return 'var(--type-accent-platform)';
    default:
      return 'var(--type-accent-neutral)';
  }
}
