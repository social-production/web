import { invalidate } from '$app/navigation';
import { clearFeedCache } from '$lib/services/feedCache';
import type { SignalToggleResult, ViewerSignal, VoteDirection } from '$lib/types/feed';

export const PUBLIC_FEED_DEPENDS = 'app:feed:public';
export const PERSONAL_FEED_DEPENDS = 'app:feed:personal';

export function viewerSignalFromToggle(result: SignalToggleResult): ViewerSignal {
  if (!result || result.action === 'removed') {
    return null;
  }
  return result.signalType ?? null;
}

export function favorabilityFromCounts(supportCount: number, opposeCount: number): number | null {
  const total = supportCount + opposeCount;
  if (total <= 0) {
    return null;
  }
  return supportCount / total;
}

export type VoteEngagement = {
  activeVote: VoteDirection;
  voteCount: number;
};

export type SignalEngagement = {
  supportCount: number;
  opposeCount: number;
  favorability: number | null;
  viewerSignal: ViewerSignal;
};

export function voteEngagementFromItem(item: {
  activeVote?: VoteDirection;
  voteCount?: number;
}): VoteEngagement {
  return {
    activeVote: item.activeVote ?? 0,
    voteCount: item.voteCount ?? 0
  };
}

export function applyVoteTarget(
  activeVote: VoteDirection,
  voteCount: number,
  targetVote: VoteDirection
): VoteEngagement {
  const score = (vote: VoteDirection) => (vote === 1 ? 1 : vote === -1 ? -1 : 0);

  return {
    activeVote: targetVote,
    voteCount: voteCount + (score(targetVote) - score(activeVote))
  };
}

export function applyOptimisticSignalToggle(
  current: SignalEngagement,
  signal: 'demand' | 'opposition'
): SignalEngagement {
  let { supportCount, opposeCount, viewerSignal } = current;

  if (viewerSignal === signal) {
    if (signal === 'demand') {
      supportCount = Math.max(0, supportCount - 1);
    } else {
      opposeCount = Math.max(0, opposeCount - 1);
    }
    viewerSignal = null;
  } else if (viewerSignal === null) {
    if (signal === 'demand') {
      supportCount += 1;
    } else {
      opposeCount += 1;
    }
    viewerSignal = signal;
  } else {
    if (viewerSignal === 'demand') {
      supportCount = Math.max(0, supportCount - 1);
    } else {
      opposeCount = Math.max(0, opposeCount - 1);
    }
    if (signal === 'demand') {
      supportCount += 1;
    } else {
      opposeCount += 1;
    }
    viewerSignal = signal;
  }

  return {
    supportCount,
    opposeCount,
    viewerSignal,
    favorability: favorabilityFromCounts(supportCount, opposeCount)
  };
}

export function invalidateFeedEngagementCache(): Promise<void> {
  clearFeedCache();
  return Promise.all([invalidate(PUBLIC_FEED_DEPENDS), invalidate(PERSONAL_FEED_DEPENDS)]).then(
    () => undefined
  );
}

export function invalidateThreadCache(slug: string): Promise<void> {
  return Promise.all([invalidate(`app:thread:${slug}`), invalidateFeedEngagementCache()]).then(
    () => undefined
  );
}

export function signalEngagementFromItem(item: {
  supportCount?: number;
  opposeCount?: number;
  favorability?: number | null;
  viewerSignal?: ViewerSignal;
}): SignalEngagement {
  return {
    supportCount: item.supportCount ?? 0,
    opposeCount: item.opposeCount ?? 0,
    favorability: item.favorability ?? null,
    viewerSignal: item.viewerSignal ?? null
  };
}

export function applySignalToggleToEngagement(result: SignalToggleResult): SignalEngagement {
  const supportCount = result.signals?.demand ?? 0;
  const opposeCount = result.signals?.opposition ?? 0;

  return {
    supportCount,
    opposeCount,
    favorability: favorabilityFromCounts(supportCount, opposeCount),
    viewerSignal: viewerSignalFromToggle(result)
  };
}

export function isProposalAdvancementUnlocked(
  signals: { demand: number; opposition: number; total: number },
  summary: { requiredDemandCount: number; usesPlatformVoteContext: boolean }
): boolean {
  const { demand, total } = signals;
  if (total <= 0) {
    return false;
  }

  const ratioMet = (demand / total) * 100 >= 66;
  if (summary.usesPlatformVoteContext) {
    return ratioMet && demand >= summary.requiredDemandCount;
  }
  return ratioMet;
}

export function applySignalToggleToDetailPhaseOneImmutable<
  T extends {
    signalCount?: number;
    lifecycle: {
      phaseOne: {
        viewerHasDemandSignal: boolean;
        viewerHasOppositionSignal: boolean;
        signalSummary: {
          demandCount: number;
          oppositionCount: number;
          totalCount: number;
          viewerSignal: ViewerSignal;
          signalRatioPercent: number;
          ratioRequirementMet: boolean;
          requiredDemandCount: number;
          demandRequirementMet: boolean;
          advancementUnlocked: boolean;
        } | null;
      };
    };
  }
>(data: T, result: SignalToggleResult): T {
  const viewerSignal = viewerSignalFromToggle(result);
  const demand = result.signals.demand;
  const opposition = result.signals.opposition;
  const total = result.signals.total;
  const signalRatioPercent = total > 0 ? (demand / total) * 100 : 0;
  const summary = data.lifecycle.phaseOne.signalSummary;
  const advancementUnlocked = summary
    ? isProposalAdvancementUnlocked(result.signals, {
        requiredDemandCount: summary.requiredDemandCount,
        usesPlatformVoteContext:
          'usesPlatformVoteContext' in summary ? Boolean(summary.usesPlatformVoteContext) : false
      })
    : isProposalAdvancementUnlocked(result.signals, {
        requiredDemandCount: 0,
        usesPlatformVoteContext: false
      });

  return {
    ...data,
    signalCount: typeof data.signalCount === 'number' ? total : data.signalCount,
    lifecycle: {
      ...data.lifecycle,
      phaseOne: {
        ...data.lifecycle.phaseOne,
        viewerHasDemandSignal: viewerSignal === 'demand',
        viewerHasOppositionSignal: viewerSignal === 'opposition',
        signalSummary: summary
          ? {
              ...summary,
              demandCount: demand,
              oppositionCount: opposition,
              totalCount: total,
              viewerSignal,
              signalRatioPercent,
              ratioRequirementMet: total > 0 && signalRatioPercent >= 66,
              demandRequirementMet: demand >= summary.requiredDemandCount,
              advancementUnlocked
            }
          : summary
      }
    }
  };
}

export function invalidateEntitySignalCache(kind: 'project' | 'event', slug: string): Promise<void> {
  // Feed list loaders use an in-memory TTL cache; clear it before invalidating
  // depends keys so returning to a feed reloads fresh signal counts.
  return Promise.all([invalidate(`app:${kind}:${slug}`), invalidateFeedEngagementCache()]).then(
    () => undefined
  );
}

export function mergeFeedEngagement<
  T extends {
    kind?: string;
    id: string;
    slug?: string;
    activeVote?: VoteDirection;
    voteCount?: number;
    viewerSignal?: ViewerSignal;
    supportCount?: number;
    opposeCount?: number;
    favorability?: number | null;
    moderationState?: string;
    report?: unknown;
    isUnderReview?: boolean;
    hasActiveReport?: boolean;
  }
>(current: T[], incoming: T[]): T[] {
  if (incoming.length === 0) {
    return current;
  }

  const engagementByKey = new Map<string, T>();
  for (const item of incoming) {
    const key = feedEngagementKey(item);
    if (key) {
      engagementByKey.set(key, item);
    }
  }

  if (engagementByKey.size === 0) {
    return current;
  }

  return current.map((item) => {
    const key = feedEngagementKey(item);
    const fresh = key ? engagementByKey.get(key) : undefined;
    if (!fresh) {
      return item;
    }

    return {
      ...item,
      activeVote: fresh.activeVote,
      voteCount: fresh.voteCount,
      viewerSignal: fresh.viewerSignal,
      supportCount: fresh.supportCount,
      opposeCount: fresh.opposeCount,
      favorability: fresh.favorability,
      moderationState: fresh.moderationState,
      report: fresh.report,
      isUnderReview: fresh.isUnderReview,
      hasActiveReport: fresh.hasActiveReport
    };
  });
}

function feedEngagementKey(item: {
  kind?: string;
  id: string;
  slug?: string;
  subjectKind?: string;
  subjectSlug?: string;
  subjectId?: string;
}): string | null {
  if (item.kind === 'project' || item.kind === 'event') {
    return item.slug ?? item.id;
  }
  if (
    item.kind === 'activity' &&
    (item.subjectKind === 'project' || item.subjectKind === 'event')
  ) {
    return item.subjectSlug ?? item.subjectId ?? item.id;
  }
  if (item.slug) {
    return item.slug;
  }
  return item.id;
}
