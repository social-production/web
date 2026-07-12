export function readActivityTarget(url: URL): string | null {
  if (url.hash.startsWith('#activity-card-')) {
    return url.hash.slice('#activity-card-'.length) || null;
  }

  if (url.hash.startsWith('#event-activity-')) {
    return url.hash.slice('#event-activity-'.length) || null;
  }

  if (url.hash.startsWith('#activity-')) {
    return url.hash.slice('#activity-'.length) || null;
  }

  return url.searchParams.get('activity');
}

export function readRequestTarget(url: URL): string | null {
  if (url.hash.startsWith('#request-card-')) {
    return url.hash.slice('#request-card-'.length) || null;
  }

  if (url.hash.startsWith('#request-')) {
    return url.hash.slice('#request-'.length) || null;
  }

  return url.searchParams.get('request');
}

export function scrollElementIntoComfortView(element: HTMLElement | null, topOffset = 104) {
  if (typeof document === 'undefined' || !element) {
    return;
  }

  const targetTop = Math.max(0, window.scrollY + element.getBoundingClientRect().top - topOffset);
  window.scrollTo({ top: targetTop, behavior: 'smooth' });
}

export function scrollActivityCardIntoView(activityId: string) {
  if (typeof document === 'undefined') {
    return;
  }

  document.getElementById(`activity-card-${activityId}`)?.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
}

export function openActivityDetails(activityId: string) {
  if (typeof document === 'undefined') {
    return;
  }

  const details = document.getElementById(`activity-${activityId}`);

  if (details instanceof HTMLDetailsElement) {
    details.open = true;
  }
}

export function scrollRequestCardIntoView(requestId: string) {
  if (typeof document === 'undefined') {
    return;
  }

  document.getElementById(`request-card-${requestId}`)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}

export function openRequestDetails(requestId: string) {
  if (typeof document === 'undefined') {
    return;
  }

  const details = document.getElementById(`request-${requestId}`);

  if (details instanceof HTMLDetailsElement) {
    details.open = true;
  }
}

export function scrollHistoryCardIntoView(activityId: string) {
  if (typeof document === 'undefined') {
    return;
  }

  document.getElementById(`history-card-${activityId}`)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}

export function openHistorySectionForCard(activityId: string) {
  if (typeof document === 'undefined') {
    return;
  }

  const historyCard = document.getElementById(`history-card-${activityId}`);
  const historySection = historyCard?.closest('details.history-section');

  if (historySection instanceof HTMLDetailsElement) {
    historySection.open = true;
  }
}

export async function focusEndedActivityCard(
  activityId: string,
  options: {
    tick: () => Promise<void>;
    setHighlighted: (activityId: string | null) => void;
    getHighlighted: () => string | null;
    clearHandle: () => void;
    setHandle: (handle: ReturnType<typeof setTimeout>) => void;
  }
) {
  options.clearHandle();
  options.setHighlighted(activityId);
  await options.tick();
  openHistorySectionForCard(activityId);
  openActivityDetails(activityId);
  scrollHistoryCardIntoView(activityId);

  if (typeof window !== 'undefined') {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        openHistorySectionForCard(activityId);
        openActivityDetails(activityId);
        scrollHistoryCardIntoView(activityId);
      });
    });
  }

  options.setHandle(
    setTimeout(() => {
      if (options.getHighlighted() === activityId) {
        options.setHighlighted(null);
      }
    }, 1800)
  );
}

export async function focusActivityOrHistoryTarget(
  activityId: string,
  options: {
    tick: () => Promise<void>;
    setLiveHighlighted: (activityId: string | null) => void;
    getLiveHighlighted: () => string | null;
    clearLiveHandle: () => void;
    setLiveHandle: (handle: ReturnType<typeof setTimeout>) => void;
    setHistoryHighlighted: (activityId: string | null) => void;
    getHistoryHighlighted: () => string | null;
    clearHistoryHandle: () => void;
    setHistoryHandle: (handle: ReturnType<typeof setTimeout>) => void;
  }
) {
  await options.tick();

  if (typeof document !== 'undefined' && document.getElementById(`history-card-${activityId}`)) {
    await focusEndedActivityCard(activityId, {
      tick: options.tick,
      setHighlighted: options.setHistoryHighlighted,
      getHighlighted: options.getHistoryHighlighted,
      clearHandle: options.clearHistoryHandle,
      setHandle: options.setHistoryHandle
    });
    return;
  }

  await focusActivityCard(activityId, {
    tick: options.tick,
    setHighlighted: options.setLiveHighlighted,
    getHighlighted: options.getLiveHighlighted,
    clearHandle: options.clearLiveHandle,
    setHandle: options.setLiveHandle
  });
}

export async function focusActivityCard(
  activityId: string,
  options: {
    tick: () => Promise<void>;
    setHighlighted: (activityId: string | null) => void;
    getHighlighted: () => string | null;
    clearHandle: () => void;
    setHandle: (handle: ReturnType<typeof setTimeout>) => void;
  }
) {
  options.clearHandle();
  options.setHighlighted(activityId);
  await options.tick();
  openActivityDetails(activityId);
  scrollActivityCardIntoView(activityId);

  if (typeof window !== 'undefined') {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        openActivityDetails(activityId);
        scrollActivityCardIntoView(activityId);
      });
    });
  }

  options.setHandle(
    setTimeout(() => {
      if (options.getHighlighted() === activityId) {
        options.setHighlighted(null);
      }
    }, 1800)
  );
}

export async function focusRequestCard(
  requestId: string,
  options: {
    tick: () => Promise<void>;
    setHighlighted: (requestId: string | null) => void;
    getHighlighted: () => string | null;
    clearHandle: () => void;
    setHandle: (handle: ReturnType<typeof setTimeout>) => void;
  }
) {
  options.clearHandle();
  options.setHighlighted(requestId);
  await options.tick();
  openRequestDetails(requestId);
  scrollRequestCardIntoView(requestId);

  if (typeof window !== 'undefined') {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        openRequestDetails(requestId);
        scrollRequestCardIntoView(requestId);
      });
    });
  }

  options.setHandle(
    setTimeout(() => {
      if (options.getHighlighted() === requestId) {
        options.setHighlighted(null);
      }
    }, 1800)
  );
}
