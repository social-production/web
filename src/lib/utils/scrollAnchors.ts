export function participationScrollTopOffset() {
  const topbarHeight =
    document.querySelector<HTMLElement>('.topbar')?.getBoundingClientRect().height ?? 0;
  const wizardHeight =
    document.querySelector<HTMLElement>('.participation-steps')?.getBoundingClientRect().height ?? 0;

  return topbarHeight + wizardHeight + 16;
}

function mainContentScroller(): HTMLElement | null {
  const main = document.querySelector<HTMLElement>('.main-content');
  if (!main) {
    return null;
  }

  const overflowY = window.getComputedStyle(main).overflowY;
  if ((overflowY === 'auto' || overflowY === 'scroll') && main.scrollHeight > main.clientHeight + 1) {
    return main;
  }

  return null;
}

function nearestScrollParent(element: HTMLElement): HTMLElement | null {
  const main = mainContentScroller();
  if (main && main.contains(element)) {
    return main;
  }

  let node = element.parentElement;

  while (node) {
    const overflowY = window.getComputedStyle(node).overflowY;
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight + 1) {
      return node;
    }
    node = node.parentElement;
  }

  return null;
}

export function isElementInComfortView(element: HTMLElement, padding = 16): boolean {
  const rect = element.getBoundingClientRect();
  const scroller = nearestScrollParent(element);
  const viewport = scroller
    ? scroller.getBoundingClientRect()
    : { top: 0, left: 0, right: window.innerWidth, bottom: window.innerHeight };

  return (
    rect.top >= viewport.top + padding &&
    rect.bottom <= viewport.bottom - padding &&
    rect.left >= viewport.left &&
    rect.right <= viewport.right
  );
}

export function scrollElementIntoViewWithOffset(
  element: HTMLElement,
  options: { behavior?: ScrollBehavior; force?: boolean } = {}
) {
  if (typeof document === 'undefined') {
    return;
  }

  if (!options.force && isElementInComfortView(element)) {
    return;
  }

  const behavior = options.behavior ?? 'smooth';
  const scroller = nearestScrollParent(element);

  if (scroller) {
    const nextTop =
      scroller.scrollTop +
      element.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top -
      16;
    scroller.scrollTo({ top: Math.max(nextTop, 0), behavior });
    return;
  }

  const nextTop = window.scrollY + element.getBoundingClientRect().top - participationScrollTopOffset();

  window.scrollTo({
    top: Math.max(nextTop, 0),
    behavior
  });
}

export function scrollToPageAnchor(
  anchorId: string,
  options: { behavior?: ScrollBehavior; force?: boolean } = {}
) {
  if (typeof document === 'undefined') {
    return;
  }

  const element = document.getElementById(anchorId);

  if (!element) {
    return;
  }

  scrollElementIntoViewWithOffset(element, options);
}

export async function preserveScrollDuring(action: () => Promise<void>) {
  if (typeof window === 'undefined') {
    await action();
    return;
  }

  const main = document.querySelector<HTMLElement>('.main-content');
  const windowY = window.scrollY;
  const mainY = main?.scrollTop ?? 0;

  await action();

  requestAnimationFrame(() => {
    window.scrollTo({ top: windowY, behavior: 'instant' as ScrollBehavior });
    if (main) {
      main.scrollTop = mainY;
    }
  });
}
