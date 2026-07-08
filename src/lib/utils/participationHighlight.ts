const HIGHLIGHT_CLASS = 'participation-action-highlight';
const HIGHLIGHT_DURATION_MS = 2600;

function queryParticipationTargets(selector: string | null) {
  if (!selector || typeof document === 'undefined') {
    return [] as HTMLElement[];
  }

  return Array.from(document.querySelectorAll<HTMLElement>(selector));
}

function applyHighlight(elements: HTMLElement[]) {
  for (const element of elements) {
    if (element instanceof HTMLDetailsElement && !element.open) {
      element.open = true;
    }

    element.classList.remove(HIGHLIGHT_CLASS);
    // Force reflow so repeated clicks restart the animation.
    void element.offsetWidth;
    element.classList.add(HIGHLIGHT_CLASS);
    window.setTimeout(() => {
      element.classList.remove(HIGHLIGHT_CLASS);
    }, HIGHLIGHT_DURATION_MS);
  }
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
      elements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => applyHighlight(elements), 420);
      return;
    }

    if (attempt < 8) {
      window.setTimeout(() => tryFocus(attempt + 1), 200);
    }
  };

  tryFocus();
}
