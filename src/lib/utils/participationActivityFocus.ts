import type { EventPageData, ProjectActivityItem, ProjectPageData } from '$lib/types/detail';
import { highlightParticipationTarget } from '$lib/utils/participationHighlight';

function activityList(data: ProjectPageData | EventPageData): ProjectActivityItem[] {
  return 'projectMode' in data ? data.lifecycle.phaseFive.activities : data.lifecycle.activity.activities;
}

function activityHasOpenRolesForViewer(activity: ProjectActivityItem) {
  if (activity.viewerAssignedRoleLabel) {
    return false;
  }

  return activity.roles.some(
    (role) =>
      !role.isViewerAssigned &&
      (role.maximumCount == null || role.filledCount < role.maximumCount)
  );
}

export function getActivitiesNeedingSignup(data: ProjectPageData | EventPageData) {
  return activityList(data).filter((activity) => activityHasOpenRolesForViewer(activity));
}

function activityWrapperId(data: ProjectPageData | EventPageData, activityId: string) {
  return 'projectMode' in data ? `activity-card-${activityId}` : `event-activity-${activityId}`;
}

function openActivityDetails(data: ProjectPageData | EventPageData, activities: ProjectActivityItem[]) {
  for (const activity of activities) {
    const wrapper = document.getElementById(activityWrapperId(data, activity.id));
    const details = wrapper?.querySelector('details');

    if (details instanceof HTMLDetailsElement && !details.open) {
      details.open = true;
    }
  }
}

export function focusActivitySignupTargets(data: ProjectPageData | EventPageData) {
  if (typeof document === 'undefined') {
    return;
  }

  const activities = getActivitiesNeedingSignup(data);
  const first = activities[0];

  const highlightTargets = () => {
    openActivityDetails(data, activities);
    highlightParticipationTarget('#participation-activities [data-participation-target="activity-signup"]');
  };

  if (!first) {
    highlightTargets();
    return;
  }

  const wrapper = document.getElementById(activityWrapperId(data, first.id));

  if (wrapper) {
    wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(highlightTargets, 420);
    return;
  }

  highlightTargets();
}
