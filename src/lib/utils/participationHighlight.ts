const HIGHLIGHT_CLASS = 'participation-action-highlight';
const UNDER_OVERLAY_CLASS = 'participation-highlight-under-overlay';
const HIGHLIGHT_DURATION_MS = 2600;
const PHASE_HELP_SELECTOR = '[data-participation-target="phase-help"]';
const PHASE_HELP_THEN_ACTION_DELAY_MS = 1400;
const OVERLAY_SELECTOR = '.wizard-backdrop, [role="dialog"][aria-modal="true"]';

let activeHighlightTimeouts: number[] = [];

function queryParticipationTargets(selector: string | null) {
  if (!selector || typeof document === 'undefined') {
    return [] as HTMLElement[];
  }

  return Array.from(document.querySelectorAll<HTMLElement>(selector));
}

function isModalOverlayOpen() {
  if (typeof document === 'undefined') {
    return false;
  }

  return Boolean(document.querySelector(OVERLAY_SELECTOR));
}

function syncUnderOverlayClass() {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.classList.toggle(UNDER_OVERLAY_CLASS, isModalOverlayOpen());
}

function clearActiveHighlights() {
  if (typeof document === 'undefined') {
    return;
  }

  for (const timeoutId of activeHighlightTimeouts) {
    window.clearTimeout(timeoutId);
  }
  activeHighlightTimeouts = [];

  for (const element of document.querySelectorAll<HTMLElement>(`.${HIGHLIGHT_CLASS}`)) {
    element.classList.remove(HIGHLIGHT_CLASS);
  }
}

function applyHighlight(elements: HTMLElement[]) {
  syncUnderOverlayClass();
  clearActiveHighlights();

  for (const element of elements) {
    if (element instanceof HTMLDetailsElement && !element.open) {
      element.open = true;
    }

    element.classList.add(HIGHLIGHT_CLASS);
    const timeoutId = window.setTimeout(() => {
      element.classList.remove(HIGHLIGHT_CLASS);
      syncUnderOverlayClass();
      if (!document.querySelector(`.${HIGHLIGHT_CLASS}`)) {
        document.documentElement.classList.remove(UNDER_OVERLAY_CLASS);
      }
    }, HIGHLIGHT_DURATION_MS);
    activeHighlightTimeouts.push(timeoutId);
  }
}

function scrollTargetIntoView(element: HTMLElement) {
  // Avoid scrolling the page under an open modal — that can push highlighted
  // background content visually across the overlay surface.
  if (isModalOverlayOpen()) {
    return;
  }

  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export function highlightParticipationTarget(selector: string | null) {
  const tryHighlight = (attempt = 0) => {
    const elements = queryParticipationTargets(selector);

    if (elements.length > 0) {
      applyHighlight(elements);
      return;
    }

    if (attempt < 8) {
      window.setTimeout(() => tryHighlight(attempt + 1), 200);
    }
  };

  tryHighlight();
}

export function focusParticipationActionTarget(selector: string | null) {
  const tryFocus = (attempt = 0) => {
    const elements = queryParticipationTargets(selector);

    if (elements.length > 0) {
      scrollTargetIntoView(elements[0]);
      window.setTimeout(() => applyHighlight(elements), isModalOverlayOpen() ? 0 : 420);
      return;
    }

    if (attempt < 8) {
      window.setTimeout(() => tryFocus(attempt + 1), 200);
    }
  };

  tryFocus();
}

/**
 * Teach-first guide: spotlight "How this phase works", then the action control.
 */
export function focusPhaseHelpThenAction(actionSelector: string | null) {
  const tryFocusHelp = (attempt = 0) => {
    const helpTargets = queryParticipationTargets(PHASE_HELP_SELECTOR);

    if (helpTargets.length > 0) {
      scrollTargetIntoView(helpTargets[0]);
      window.setTimeout(() => applyHighlight(helpTargets), isModalOverlayOpen() ? 0 : 420);
      window.setTimeout(() => {
        focusParticipationActionTarget(actionSelector);
      }, PHASE_HELP_THEN_ACTION_DELAY_MS);
      return;
    }

    if (attempt < 8) {
      window.setTimeout(() => tryFocusHelp(attempt + 1), 200);
      return;
    }

    // Fall back to the action alone if phase help is not on the page.
    focusParticipationActionTarget(actionSelector);
  };

  tryFocusHelp();
}
