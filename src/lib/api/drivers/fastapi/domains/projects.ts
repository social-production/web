import { apiClient } from '../client';
import type {
  ProjectPageData,
  ProjectProductionPlanInput,
  ProjectDistributionPlanInput,
  ProjectSoftwarePullRequestInput,
  ProjectSoftwareMergeCapabilityChangeInput,
  ProjectSoftwareRepositoryReplacementInput,
  ProjectActivityInput,
  ProjectServiceRequestInput,
  ProjectServiceRequestStatus,
  ProjectLifecyclePhaseId,
  ProjectPhaseChangeRequestOptions,
  ProjectApprovalVote,
  ProjectImportanceVoteValue,
  GovernanceSignalType,
  ShareTargetResult,
} from '$lib/types/detail';
import type { CreateProjectInput, CreateResult } from '$lib/types/feed';

// Membership cache for toggle direction (populated from getProject viewerIsMember)
const membershipCache = new Map<string, boolean>();

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function notImplemented(method: string): never {
  throw new Error(`projects.${method}: no backend endpoint yet`);
}

// -- Read -------------------------------------------------------------------

export async function fetchProject(slug: string): Promise<ProjectPageData | null> {
  try {
    const res = await apiClient.get<ProjectPageData>(`/projects/${slug}`);
    membershipCache.set(slug, res.viewerIsMember);
    return res;
  } catch (err) {
    if ((err as { status?: number }).status === 404) return null;
    throw err;
  }
}

// -- Create -----------------------------------------------------------------

export async function fetchCreateProject(input: CreateProjectInput): Promise<CreateResult> {
  try {
    const res = await apiClient.post<{ project: { slug: string } }>('/projects', {
      slug: slugify(input.title),
      title: input.title,
      description: input.description,
      project_mode: input.projectMode,
      location_label: input.locationLabel,
      channel_slugs: input.channelTags.map(t => t.slug),
    });
    return { ok: true, slug: res.project.slug };
  } catch (err) {
    return { ok: false, error: (err as { body?: { detail?: string } }).body?.detail ?? 'Could not create project' };
  }
}

// -- Membership --------------------------------------------------------------

export async function fetchToggleProjectMembership(projectSlug: string): Promise<void> {
  const isMember = membershipCache.get(projectSlug) ?? false;
  if (isMember) {
    await apiClient.delete(`/projects/${projectSlug}/leave`);
    membershipCache.set(projectSlug, false);
  } else {
    await apiClient.post(`/projects/${projectSlug}/join`);
    membershipCache.set(projectSlug, true);
  }
}

// -- Signals ----------------------------------------------------------------

export async function fetchToggleProjectDemandSignal(projectSlug: string): Promise<void> {
  await apiClient.post(`/projects/${projectSlug}/signals`, { signal_type: 'demand' });
}

export async function fetchSetProjectSignal(projectSlug: string, signal: GovernanceSignalType): Promise<void> {
  await apiClient.post(`/projects/${projectSlug}/signals`, { signal_type: signal });
}

// -- Values -----------------------------------------------------------------

export async function fetchAddProjectValue(projectSlug: string, label: string): Promise<void> {
  await apiClient.post(`/projects/${projectSlug}/values`, { label });
}

export async function fetchSetProjectValueImportance(
  projectSlug: string,
  valueId: string,
  importance: ProjectImportanceVoteValue
): Promise<void> {
  await apiClient.post(`/projects/${projectSlug}/values/${valueId}/importance`, { importance });
}

// -- Plans ------------------------------------------------------------------

export async function fetchAddProjectProductionPlan(
  projectSlug: string,
  input: ProjectProductionPlanInput
): Promise<boolean> {
  try {
    await apiClient.post(`/projects/${projectSlug}/plans`, {
      plan_type: 'production',
      title: input.title,
      description: input.description,
      demand_consideration_note: input.demandConsiderationNote,
      total_cost_label: input.totalCostLabel,
      repository_url: input.repositoryUrl ?? null,
      plan_payload: {
        projectSubtype: input.projectSubtype,
        planPhases: input.planPhases,
        outputSummary: input.outputSummary ?? '',
        materialsSummary: input.materialsSummary ?? '',
        acquisitionsSummary: input.acquisitionsSummary ?? '',
        acquisitionBundles: input.acquisitionBundles ?? [],
        purchaseRows: input.purchaseRows ?? [],
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function fetchUpdateProjectProductionPlan(
  _projectSlug: string,
  _planId: string,
  _input: ProjectProductionPlanInput
): Promise<boolean> {
  notImplemented('updateProjectProductionPlan');
}

export async function fetchAddProjectDistributionPlan(
  projectSlug: string,
  input: ProjectDistributionPlanInput
): Promise<boolean> {
  try {
    await apiClient.post(`/projects/${projectSlug}/plans`, {
      plan_type: 'distribution',
      title: input.title,
      description: input.description,
      demand_consideration_note: input.demandConsiderationNote,
      total_cost_label: input.totalCostLabel,
      plan_payload: {
        planPhases: input.planPhases,
        distributionSummary: input.distributionSummary ?? '',
        accessSummary: input.accessSummary ?? '',
        reserveSummary: input.reserveSummary ?? '',
        requestSystemEnabled: input.requestSystemEnabled ?? false,
        requestMode: input.requestMode ?? 'direct',
        allowOffScheduleRequests: input.allowOffScheduleRequests ?? false,
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function fetchSetProjectPlanOverallVote(
  projectSlug: string,
  _phaseId: string,
  planId: string,
  vote: ProjectApprovalVote | null
): Promise<void> {
  if (!vote) return;
  await apiClient.post(`/projects/${projectSlug}/plans/${planId}/vote`, { vote });
}

export async function fetchSetProjectPlanValueVote(
  projectSlug: string,
  _phaseId: string,
  planId: string,
  valueId: string,
  vote: ProjectApprovalVote | null
): Promise<void> {
  if (!vote) return;
  await apiClient.post(`/projects/${projectSlug}/plans/${planId}/value-votes`, {
    value_id: valueId,
    vote,
  });
}

// -- Activities --------------------------------------------------------------

export async function fetchAddProjectActivity(
  projectSlug: string,
  input: ProjectActivityInput
): Promise<void> {
  await apiClient.post(`/projects/${projectSlug}/activities`, {
    title: input.title,
    scheduled_at: input.scheduledAt,
    ends_at: input.endsAt,
    location_label: input.locationLabel,
    note: input.note,
    role_requirements: input.roleRequirements.map(r => ({
      label: r.label,
      required_count: r.requiredCount,
      maximum_count: r.maximumCount ?? null,
    })),
    linked_plan_phase_id: input.linkedPlanPhaseId ?? null,
  });
}

export async function fetchSetProjectActivityCommitment(
  projectSlug: string,
  activityId: string,
  roleLabel: string | null
): Promise<void> {
  if (roleLabel === null) {
    await apiClient.delete(`/projects/${projectSlug}/activities/${activityId}/commit`);
  } else {
    await apiClient.post(`/projects/${projectSlug}/activities/${activityId}/commit`, { role_label: roleLabel });
  }
}

// -- Software ----------------------------------------------------------------

export async function fetchAddProjectPullRequest(
  projectSlug: string,
  input: ProjectSoftwarePullRequestInput
): Promise<void> {
  await apiClient.post(`/projects/${projectSlug}/software/pull-requests`, {
    title: input.title,
    summary: input.summary,
    pullRequestId: input.pullRequestId,
    pullRequestUrl: input.pullRequestUrl,
  });
}

export async function fetchSetProjectPullRequestVote(
  projectSlug: string,
  decisionId: string,
  vote: ProjectApprovalVote | null
): Promise<void> {
  if (!vote) return;
  await apiClient.post(`/projects/${projectSlug}/software/pull-requests/${decisionId}/vote`, { vote });
}

export async function fetchRecordProjectPullRequestMerge(
  projectSlug: string,
  requestId: string,
  mergeId: string
): Promise<void> {
  await apiClient.post(`/projects/${projectSlug}/software/pull-requests/${requestId}/merge`, {
    mergeId,
  });
}

export async function fetchRequestProjectMergeCapabilityChange(
  projectSlug: string,
  input: ProjectSoftwareMergeCapabilityChangeInput
): Promise<void> {
  await apiClient.post(`/projects/${projectSlug}/software/merge-capability-requests`, {
    targetUserId: input.targetUserId,
    action: input.action,
  });
}

export async function fetchSetProjectMergeCapabilityChangeVote(
  projectSlug: string,
  decisionId: string,
  vote: ProjectApprovalVote | null
): Promise<void> {
  if (!vote) return;
  await apiClient.post(
    `/projects/${projectSlug}/software/merge-capability-requests/${decisionId}/vote`,
    { vote }
  );
}

export async function fetchRequestProjectRepositoryReplacement(
  projectSlug: string,
  input: ProjectSoftwareRepositoryReplacementInput
): Promise<void> {
  await apiClient.post(`/projects/${projectSlug}/software/repository-replacement-requests`, {
    repositoryUrl: input.repositoryUrl,
    reason: input.reason,
    relatedPullRequestId: input.relatedPullRequestId,
  });
}

export async function fetchSetProjectRepositoryReplacementVote(
  projectSlug: string,
  decisionId: string,
  vote: ProjectApprovalVote | null
): Promise<void> {
  if (!vote) return;
  await apiClient.post(
    `/projects/${projectSlug}/software/repository-replacement-requests/${decisionId}/vote`,
    { vote }
  );
}

// -- Service requests --------------------------------------------------------

export async function fetchAddProjectServiceRequest(
  projectSlug: string,
  input: ProjectServiceRequestInput
): Promise<void> {
  await apiClient.post(`/projects/${projectSlug}/service-requests`, {
    title: input.title,
    body: input.body,
    scheduled_at: input.scheduledAt ?? null,
    ends_at: input.endsAt ?? null,
  });
}

export async function fetchSetProjectServiceRequestStatus(
  projectSlug: string,
  requestId: string,
  status: ProjectServiceRequestStatus
): Promise<void> {
  await apiClient.patch(`/projects/${projectSlug}/service-requests/${requestId}`, { status });
}

export async function fetchPlanProjectServiceRequest(): Promise<void> {
  notImplemented('planProjectServiceRequest');
}

export async function fetchRequestProjectServiceRequestSettingsChange(): Promise<void> {
  notImplemented('requestProjectServiceRequestSettingsChange');
}

export async function fetchSetProjectServiceRequestSettingsChangeVote(): Promise<void> {
  notImplemented('setProjectServiceRequestSettingsChangeVote');
}

export async function fetchToggleProjectServiceHistoryCompletion(): Promise<void> {
  notImplemented('toggleProjectServiceHistoryCompletion');
}

// -- Phase lifecycle ---------------------------------------------------------

export async function fetchRequestProjectPhaseChange(
  projectSlug: string,
  targetPhaseId: ProjectLifecyclePhaseId,
  reason: string,
  _options?: ProjectPhaseChangeRequestOptions
): Promise<void> {
  await apiClient.post(`/projects/${projectSlug}/phase-requests`, {
    target_phase_id: targetPhaseId,
    reason,
  });
}

export async function fetchSetProjectPhaseChangeVote(
  projectSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
): Promise<void> {
  if (!vote) return;
  await apiClient.post(`/projects/${projectSlug}/phase-requests/${requestId}/vote`, { vote });
}

export async function fetchAdvanceProjectPhase(projectSlug: string, closeNote?: string): Promise<void> {
  await apiClient.post(`/projects/${projectSlug}/phase-advance`, {
    close_note: closeNote ?? null,
  });
}

export async function fetchRevertProjectPhase(
  projectSlug: string,
  targetPhaseId: string,
  reason: string
): Promise<void> {
  await apiClient.post(`/projects/${projectSlug}/revert-requests`, {
    target_phase_id: targetPhaseId,
    reason,
  });
}

// -- Updates and edits -------------------------------------------------------

export async function fetchRequestProjectUpdate(projectSlug: string, body: string): Promise<void> {
  await apiClient.post(`/projects/${projectSlug}/update-requests`, { body });
}

export async function fetchSetProjectUpdateVote(
  projectSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
): Promise<void> {
  if (!vote) return;
  await apiClient.post(`/projects/${projectSlug}/update-requests/${requestId}/vote`, { vote });
}

export async function fetchUpdateProjectDetails(): Promise<void> {
  notImplemented('updateProjectDetails');
}

export async function fetchRequestProjectEdit(
  projectSlug: string,
  title: string,
  description: string
): Promise<void> {
  await apiClient.post(`/projects/${projectSlug}/edit-requests`, { title, description });
}

export async function fetchSetProjectEditVote(
  projectSlug: string,
  requestId: string,
  vote: ProjectApprovalVote | null
): Promise<void> {
  if (!vote) return;
  await apiClient.post(`/projects/${projectSlug}/edit-requests/${requestId}/vote`, { vote });
}

export async function fetchAddProjectUpdate(
  projectSlug: string,
  title: string,
  body: string
): Promise<void> {
  await apiClient.post(`/projects/${projectSlug}/updates`, { title, body });
}

// -- Manual links ------------------------------------------------------------

export async function fetchCreateProjectManualLinkRequest(): Promise<void> {
  notImplemented('createProjectManualLinkRequest');
}

export async function fetchSetProjectManualLinkVote(): Promise<void> {
  notImplemented('setProjectManualLinkVote');
}

// -- Misc --------------------------------------------------------------------

export async function fetchToggleProjectManagerNomination(): Promise<void> {
  notImplemented('toggleProjectManagerNomination');
}

export async function fetchShareProjectWithUser(
  projectSlug: string,
  username: string
): Promise<ShareTargetResult> {
  try {
    await apiClient.post(`/projects/${projectSlug}/share`, { username });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as { body?: { detail?: string } }).body?.detail ?? 'Could not share' };
  }
}
