import { tick } from 'svelte';

const DEFAULT_TOP_OFFSET = 84;
const BOTTOM_CUSHION = 16;

function readCssPx(name: string, fallback: number): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : fallback;
}

function scrollingParent(element: HTMLElement): HTMLElement | null {
  let parent = element.parentElement;
  while (parent) {
    const overflowY = getComputedStyle(parent).overflowY;
    if (
      (overflowY === 'auto' || overflowY === 'scroll') &&
      parent.scrollHeight > parent.clientHeight + 1
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

function visibleFrame(element: HTMLElement, topOffset?: number) {
  const windowTop = (topOffset ?? readCssPx('--topbar-height', DEFAULT_TOP_OFFSET)) + 8;
  const coveredBottom =
    readCssPx('--shell-bottom-nav-offset', 0) +
    readCssPx('--detail-action-dock-height', 0) +
    readCssPx('--shell-dock-safe-bottom', 0);
  const windowBottom = window.innerHeight - coveredBottom - BOTTOM_CUSHION;
  const parent = scrollingParent(element);
  if (!parent) {
    return { scroller: null as HTMLElement | null, top: windowTop, bottom: windowBottom };
  }

  const rect = parent.getBoundingClientRect();
  return {
    scroller: parent,
    top: Math.max(rect.top + 8, windowTop),
    bottom: Math.min(rect.bottom - 8, windowBottom)
  };
}

function isFullyVisible(element: HTMLElement, frame: { top: number; bottom: number }): boolean {
  const rect = element.getBoundingClientRect();
  const available = frame.bottom - frame.top;
  if (rect.height >= available - 1) {
    return rect.top >= frame.top - 1 && rect.top <= frame.top + 12;
  }
  return rect.top >= frame.top - 1 && rect.bottom <= frame.bottom + 1;
}

function waitForNextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function scrollCommentIntoView(
  getElement: () => HTMLElement | null | undefined,
  options?: { maxAttempts?: number; topOffset?: number }
): Promise<boolean> {
  const maxAttempts = options?.maxAttempts ?? 15;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await tick();
    await waitForNextFrame();

    const element = getElement();
    if (!element) {
      if (attempt < maxAttempts - 1) {
        await wait(50);
      }
      continue;
    }

    const frame = visibleFrame(element, options?.topOffset);
    if (isFullyVisible(element, frame)) {
      return true;
    }

    const rect = element.getBoundingClientRect();
    const available = frame.bottom - frame.top;
    const delta =
      rect.height >= available - 1 || rect.top < frame.top
        ? rect.top - frame.top
        : rect.bottom - frame.bottom;
    if (frame.scroller) {
      frame.scroller.scrollBy({ top: delta, behavior: 'auto' });
    } else {
      window.scrollBy({ top: delta, behavior: 'auto' });
    }

    if (attempt < maxAttempts - 1) {
      await wait(50);
    }
  }

  return false;
}

export async function scrollCenteredInContainer(
  getContainer: () => HTMLElement | null | undefined,
  getElement: () => HTMLElement | null | undefined,
  options?: { maxAttempts?: number }
): Promise<boolean> {
  const maxAttempts = options?.maxAttempts ?? 15;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await tick();
    await waitForNextFrame();

    const container = getContainer();
    const element = getElement();
    if (!container || !element) {
      if (attempt < maxAttempts - 1) {
        await wait(50);
      }
      continue;
    }

    const logBounds = container.getBoundingClientRect();
    const targetBounds = element.getBoundingClientRect();
    const cushion = 12;
    const available = container.clientHeight - cushion * 2;
    const visibleTop = targetBounds.top - logBounds.top;
    const visibleBottom = targetBounds.bottom - logBounds.top;
    const alreadyFits =
      targetBounds.height >= available
        ? visibleTop >= cushion - 1 && visibleTop <= cushion + 12
        : visibleTop >= cushion - 1 && visibleBottom <= container.clientHeight - cushion + 1;
    if (alreadyFits) {
      return true;
    }

    const targetTop = visibleTop + container.scrollTop;
    const nextScrollTop = Math.max(
      targetBounds.height >= available || visibleTop < cushion
        ? targetTop - cushion
        : targetTop + targetBounds.height - (container.clientHeight - cushion),
      0
    );

    container.scrollTo({
      top: nextScrollTop,
      behavior: 'auto'
    });

    await waitForNextFrame();
    const nextBounds = element.getBoundingClientRect();
    const nextLog = container.getBoundingClientRect();
    const nextTop = nextBounds.top - nextLog.top;
    const nextBottom = nextBounds.bottom - nextLog.top;
    const fits =
      nextBounds.height >= available
        ? nextTop >= cushion - 1 && nextTop <= cushion + 12
        : nextTop >= cushion - 1 && nextBottom <= container.clientHeight - cushion + 1;
    if (fits) {
      return true;
    }

    if (attempt < maxAttempts - 1) {
      await wait(50);
    }
  }

  return false;
}
