import type {
  ContentReportReason,
  ContentReportResolution,
  ContentReportSummary,
  ContentReportVote,
  ModerationState
} from '$lib/types/detail/shared';

const ACTIVE_REPORT_RESOLUTIONS = new Set<ContentReportResolution>(['open', 'under_review', 'hidden']);
const VALID_RESOLUTIONS = new Set<ContentReportResolution>([
  'open',
  'under_review',
  'hidden',
  'removed',
  'dismissed'
]);
const VALID_MODERATION_STATES = new Set<ModerationState>([
  'visible',
  'under_review',
  'hidden',
  'removed'
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function pickString(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
  }
  return '';
}

function pickNumber(record: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return 0;
}

function mapReason(value: unknown): ContentReportReason {
  return value === 'serious-harm' ? 'serious-harm' : 'spam';
}

function mapResolution(value: unknown): ContentReportResolution {
  const raw = typeof value === 'string' ? value : 'open';
  return VALID_RESOLUTIONS.has(raw as ContentReportResolution)
    ? (raw as ContentReportResolution)
    : 'open';
}

function mapActiveVote(value: unknown): ContentReportVote | null {
  return value === 'yes' || value === 'no' ? value : null;
}

export function mapContentReport(raw: unknown): ContentReportSummary | null {
  const record = asRecord(raw);
  if (!record) {
    return null;
  }

  const id = pickString(record, 'id');
  if (!id) {
    return null;
  }

  const voteSummary = asRecord(record.voteSummary ?? record.vote_summary) ?? {};

  return {
    id,
    subjectId: pickString(record, 'subjectId', 'subject_id'),
    targetId: pickString(record, 'targetId', 'target_id'),
    reason: mapReason(record.reason),
    description: pickString(record, 'description'),
    createdAt: pickString(record, 'createdAt', 'created_at'),
    authorUsername: pickString(record, 'authorUsername', 'author_username'),
    resolution: mapResolution(record.resolution),
    voteSummary: {
      yesCount: pickNumber(voteSummary, 'yesCount', 'yes_count'),
      noCount: pickNumber(voteSummary, 'noCount', 'no_count'),
      activeVote: mapActiveVote(voteSummary.activeVote ?? voteSummary.active_vote),
      eligibleVoterCount: pickNumber(voteSummary, 'eligibleVoterCount', 'eligible_voter_count'),
      audienceSize:
        pickNumber(voteSummary, 'audienceSize', 'audience_size') ||
        pickNumber(voteSummary, 'eligibleVoterCount', 'eligible_voter_count'),
      totalVotes:
        pickNumber(voteSummary, 'totalVotes', 'total_votes') ||
        pickNumber(voteSummary, 'yesCount', 'yes_count') +
          pickNumber(voteSummary, 'noCount', 'no_count'),
      votesRequired: pickNumber(voteSummary, 'votesRequired', 'votes_required'),
      requiredYesShare:
        pickNumber(voteSummary, 'requiredYesShare', 'required_yes_share') ||
        pickNumber(voteSummary, 'deleteYesShare', 'delete_yes_share') ||
        0.66,
      deleteYesShare:
        pickNumber(voteSummary, 'deleteYesShare', 'delete_yes_share') ||
        pickNumber(voteSummary, 'requiredYesShare', 'required_yes_share') ||
        0.66,
      hideYesShare: pickNumber(voteSummary, 'hideYesShare', 'hide_yes_share') || 0.66,
      deleteQuorum:
        pickNumber(voteSummary, 'deleteQuorum', 'delete_quorum') ||
        pickNumber(voteSummary, 'removalQuorum', 'removal_quorum') ||
        pickNumber(voteSummary, 'votesRequired', 'votes_required') ||
        1,
      hideQuorum:
        pickNumber(voteSummary, 'hideQuorum', 'hide_quorum') ||
        pickNumber(voteSummary, 'restrictionQuorum', 'restriction_quorum') ||
        1,
      removalQuorum:
        pickNumber(voteSummary, 'removalQuorum', 'removal_quorum') ||
        pickNumber(voteSummary, 'deleteQuorum', 'delete_quorum') ||
        pickNumber(voteSummary, 'votesRequired', 'votes_required') ||
        1,
      restrictionQuorum:
        pickNumber(voteSummary, 'restrictionQuorum', 'restriction_quorum') ||
        pickNumber(voteSummary, 'hideQuorum', 'hide_quorum') ||
        1,
      restrictionVotesRequired:
        pickNumber(voteSummary, 'restrictionVotesRequired', 'restriction_votes_required') ||
        pickNumber(voteSummary, 'hideQuorum', 'hide_quorum') ||
        1
    }
  };
}

export function mapModerationState(raw: unknown): ModerationState | undefined {
  const record = asRecord(raw);
  const value = record
    ? pickString(record, 'moderationState', 'moderation_state')
    : typeof raw === 'string'
      ? raw
      : '';

  return VALID_MODERATION_STATES.has(value as ModerationState)
    ? (value as ModerationState)
    : undefined;
}

export function isActiveReport(report: ContentReportSummary | null | undefined): boolean {
  return !!report && ACTIVE_REPORT_RESOLUTIONS.has(report.resolution);
}

export function isUnderReviewContent(options: {
  moderationState?: ModerationState | null;
  report?: ContentReportSummary | null;
  isUnderReview?: boolean;
  hasActiveReport?: boolean;
}): boolean {
  return (
    options.isUnderReview === true ||
    options.moderationState === 'under_review' ||
    options.report?.resolution === 'under_review' ||
    options.report?.resolution === 'open' ||
    options.hasActiveReport === true
  );
}

export function moderationStatusLabel(options: {
  moderationState?: ModerationState | null;
  report?: ContentReportSummary | null;
  isUnderReview?: boolean;
  hasActiveReport?: boolean;
}): 'Under review' | 'Hidden' | 'Reported' | null {
  if (options.moderationState === 'hidden' || options.report?.resolution === 'hidden') {
    return 'Hidden';
  }

  if (isUnderReviewContent(options) || isActiveReport(options.report)) {
    return 'Under review';
  }

  return null;
}

export function reportReasonLabel(reason: ContentReportReason | string | null | undefined): string {
  return reason === 'serious-harm' ? 'serious harm' : 'spam';
}

/**
 * Short report-threshold lines. Quorum is the derived votes-cast bar, not the
 * raw weekly-active audience size used as the sizing input N.
 */
export function formatReportThresholdLines(report: ContentReportSummary): string[] {
  const deleteShare = Math.round(report.voteSummary.deleteYesShare * 100);
  const hideShare = Math.round(report.voteSummary.hideYesShare * 100);
  const audienceSize = report.voteSummary.audienceSize;
  const deleteQuorum = report.voteSummary.deleteQuorum;
  const sizingNote =
    audienceSize > deleteQuorum ? ` · sized from audience of ~${audienceSize}` : '';

  const lines: string[] = [
    `Delete at ${deleteQuorum} votes cast · ${deleteShare}% yes${sizingNote}`
  ];

  if (report.reason === 'serious-harm' && report.resolution !== 'removed') {
    const hidePrefix = report.resolution === 'hidden' ? 'Hidden at' : 'Hide at';
    const hideQuorum = report.voteSummary.hideQuorum;
    const hideSizingNote =
      audienceSize > hideQuorum ? ` · sized from audience of ~${audienceSize}` : '';
    lines.unshift(
      `${hidePrefix} ${hideQuorum} votes cast · ${hideShare}% yes${hideSizingNote}`
    );
  }

  return lines;
}

export function moderatedPlaceholder(
  report: ContentReportSummary | null | undefined,
  fallbackBody = ''
): string {
  if (report) {
    return `Removed for ${reportReasonLabel(report.reason)}`;
  }

  if (/^Removed for (spam|serious harm)$/i.test(fallbackBody.trim())) {
    return fallbackBody.trim();
  }

  return 'Removed for spam';
}

export function isModeratedPlaceholderBody(body: string): boolean {
  return /^Removed for (spam|serious harm)$/i.test(body.trim());
}

export function shouldHideModeratedBody(options: {
  body?: string;
  report?: ContentReportSummary | null;
  moderationState?: ModerationState | null;
}): boolean {
  // `hidden` is an active moderation state (serious-harm comments/messages).
  // Only terminal `removed` (or a removed placeholder body) fully hides content.
  return (
    options.moderationState === 'removed' ||
    options.report?.resolution === 'removed' ||
    isModeratedPlaceholderBody(options.body ?? '')
  );
}

export function isHiddenModerationState(options: {
  report?: ContentReportSummary | null;
  moderationState?: ModerationState | null;
}): boolean {
  return options.moderationState === 'hidden' || options.report?.resolution === 'hidden';
}

export function feedModerationFields(raw: unknown): {
  moderationState?: ModerationState;
  report?: ContentReportSummary | null;
  isUnderReview?: boolean;
  hasActiveReport?: boolean;
} {
  const record = asRecord(raw) ?? {};
  const moderationState = mapModerationState(record);
  const report = mapContentReport(record.report);
  const isUnderReview =
    record.isUnderReview === true ||
    record.is_under_review === true ||
    moderationState === 'under_review' ||
    report?.resolution === 'under_review' ||
    report?.resolution === 'open';
  const hasActiveReport =
    record.hasActiveReport === true ||
    record.has_active_report === true ||
    isActiveReport(report) ||
    isUnderReview;

  return {
    ...(moderationState ? { moderationState } : {}),
    ...(report ? { report } : {}),
    ...(isUnderReview ? { isUnderReview: true } : {}),
    ...(hasActiveReport ? { hasActiveReport: true } : {})
  };
}
