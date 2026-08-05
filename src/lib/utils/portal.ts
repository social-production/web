export function portal(node: HTMLElement, target: string | HTMLElement | false = 'body') {
  if (!target) {
    return {
      update() {},
      destroy() {}
    };
  }

  let currentTarget: string | HTMLElement = target;

  function resolveTarget(next: string | HTMLElement): HTMLElement | null {
    if (typeof next !== 'string') {
      return next;
    }

    // Prefer document.body directly — querySelector can miss during early mount
    // and string lookups are unnecessary for the common case.
    if (next === 'body') {
      return document.body;
    }

    return document.querySelector(next) as HTMLElement | null;
  }

  function mount() {
    const targetEl = resolveTarget(currentTarget);
    if (!targetEl) {
      return;
    }

    // Svelte may move the node back into the component tree on updates; keep
    // re-appending so fixed overlays escape card filter/transform contexts.
    if (node.parentElement !== targetEl) {
      targetEl.appendChild(node);
    }
  }

  mount();

  return {
    update(nextTarget: string | HTMLElement | false) {
      if (!nextTarget) {
        return;
      }

      currentTarget = nextTarget;
      mount();
    },
    destroy() {
      node.remove();
    }
  };
}
