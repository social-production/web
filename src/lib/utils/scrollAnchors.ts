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

  const topbarHeight =
    document.querySelector<HTMLElement>('.topbar')?.getBoundingClientRect().height ?? 0;
  const wizardHeight =
    document.querySelector<HTMLElement>('.participation-steps')?.getBoundingClientRect().height ?? 0;
  const topOffset = topbarHeight + wizardHeight + 16;
  const nextTop = window.scrollY + element.getBoundingClientRect().top - topOffset;

  window.scrollTo({
    top: Math.max(nextTop, 0),
    behavior: options.behavior ?? 'smooth'
  });
}
