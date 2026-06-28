import { tick } from 'svelte';

const DEFAULT_TOP_OFFSET = 84;

function isElementInViewport(element: HTMLElement, topOffset = DEFAULT_TOP_OFFSET): boolean {
  const rect = element.getBoundingClientRect();
  return rect.top >= topOffset && rect.bottom <= window.innerHeight - 20;
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
  const topOffset = options?.topOffset ?? DEFAULT_TOP_OFFSET;

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

    element.scrollIntoView({
      behavior: attempt === 0 ? 'auto' : 'smooth',
      block: 'center'
    });

    if (isElementInViewport(element, topOffset)) {
      return true;
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
    const targetTop = targetBounds.top - logBounds.top + container.scrollTop;
    const nextScrollTop = Math.max(
      targetTop - container.clientHeight / 2 + targetBounds.height / 2,
      0
    );

    container.scrollTo({
      top: nextScrollTop,
      behavior: attempt === 0 ? 'auto' : 'smooth'
    });

    const visibleTop = targetBounds.top - logBounds.top;
    const visibleBottom = targetBounds.bottom - logBounds.top;
    if (visibleTop >= 0 && visibleBottom <= container.clientHeight) {
      return true;
    }

    if (attempt < maxAttempts - 1) {
      await wait(50);
    }
  }

  return false;
}
