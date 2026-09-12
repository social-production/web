export function participationScrollTopOffset() {
  const topbarHeight =
    document.querySelector<HTMLElement>('.topbar')?.getBoundingClientRect().height ?? 0;
  const wizardHeight =
    document.querySelector<HTMLElement>('.participation-steps')?.getBoundingClientRect().height ?? 0;

  return topbarHeight + wizardHeight + 16;
}

function nearestScrollParent(element: HTMLElement): HTMLElement | null {
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

export function scrollElementIntoViewWithOffset(
  element: HTMLElement,
  options: { behavior?: ScrollBehavior } = {}
) {
  if (typeof document === 'undefined') {
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
  options: { behavior?: ScrollBehavior } = {}
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
