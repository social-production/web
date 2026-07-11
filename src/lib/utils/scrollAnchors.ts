export function participationScrollTopOffset() {
  const topbarHeight =
    document.querySelector<HTMLElement>('.topbar')?.getBoundingClientRect().height ?? 0;
  const wizardHeight =
    document.querySelector<HTMLElement>('.participation-steps')?.getBoundingClientRect().height ?? 0;

  return topbarHeight + wizardHeight + 16;
}

export function scrollElementIntoViewWithOffset(
  element: HTMLElement,
  options: { behavior?: ScrollBehavior } = {}
) {
  if (typeof document === 'undefined') {
    return;
  }

  const nextTop = window.scrollY + element.getBoundingClientRect().top - participationScrollTopOffset();

  window.scrollTo({
    top: Math.max(nextTop, 0),
    behavior: options.behavior ?? 'smooth'
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
