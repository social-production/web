import type { EventPageData, ProjectActivityItem, ProjectPageData } from '$lib/types/detail';
import { highlightParticipationTarget } from '$lib/utils/participationHighlight';
import { scrollElementIntoViewWithOffset, scrollToPageAnchor } from '$lib/utils/scrollAnchors';

export const PARTICIPATION_FOCUS_ACTIVITIES_EVENT = 'participation:focus-activities';

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

function activityWrapperId(activityId: string) {
  return `activity-card-${activityId}`;
}

function openActivityDetails(activities: ProjectActivityItem[]) {
  for (const activity of activities) {
    const wrapper = document.getElementById(activityWrapperId(activity.id));
    const details = wrapper?.querySelector('details');

    if (details instanceof HTMLDetailsElement && !details.open) {
      details.open = true;
    }

    const directDetails = document.getElementById(`activity-${activity.id}`);
    if (directDetails instanceof HTMLDetailsElement && !directDetails.open) {
      directDetails.open = true;
    }
  }
}

export function activateParticipationActivityPhase() {
  if (typeof document === 'undefined') {
    return;
  }

  document.dispatchEvent(new CustomEvent(PARTICIPATION_FOCUS_ACTIVITIES_EVENT));
}

export function focusActivitySignupTargets(data: ProjectPageData | EventPageData) {
  if (typeof document === 'undefined') {
    return;
  }

  const activities = getActivitiesNeedingSignup(data);
  const first = activities[0];

  const highlightTargets = () => {
    openActivityDetails(activities);
    highlightParticipationTarget('#participation-activities [data-participation-target="activity-signup"]');
  };

  const scrollToTarget = () => {
    if (first) {
      const wrapper = document.getElementById(activityWrapperId(first.id));

      if (wrapper) {
        openActivityDetails(activities);
        scrollElementIntoViewWithOffset(wrapper);
        window.setTimeout(highlightTargets, 420);
        return;
      }
    }

    scrollToPageAnchor('participation-activities');
    window.setTimeout(highlightTargets, 280);
  };

  activateParticipationActivityPhase();
  window.setTimeout(scrollToTarget, 120);
}
