type FitTextOptions = {
  min?: number;
  text?: string;
};

export function fitText(node: HTMLElement, options: FitTextOptions = {}) {
  let frame = 0;
  let current = options;
  const observer = new ResizeObserver(() => schedule());

  function measure() {
    const min = current.min ?? 10;
    node.style.display = 'block';
    node.style.maxWidth = '100%';
    node.style.whiteSpace = 'nowrap';
    node.style.overflow = 'hidden';
    node.style.textOverflow = 'clip';
    node.style.fontSize = '';
    const natural = parseFloat(getComputedStyle(node).fontSize) || 13;
    const box = node.clientWidth;
    if (box <= 0) {
      return;
    }
    if (node.scrollWidth <= box + 1) {
      clearInline();
      return;
    }
    const size = Math.max(min, Math.floor(((natural * box) / node.scrollWidth) * 10) / 10);
    node.style.fontSize = `${size}px`;
    if (node.scrollWidth > box + 1) {
      node.style.whiteSpace = 'normal';
      node.style.overflow = 'visible';
      node.style.fontSize = `${min}px`;
    }
  }

  function clearInline() {
    node.style.display = '';
    node.style.maxWidth = '';
    node.style.whiteSpace = '';
    node.style.overflow = '';
    node.style.textOverflow = '';
    node.style.fontSize = '';
  }

  function schedule() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(measure);
  }

  if (node.parentElement) {
    observer.observe(node.parentElement);
  }
  schedule();

  return {
    update(next: FitTextOptions = {}) {
      current = next;
      schedule();
    },
    destroy() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      clearInline();
    }
  };
}
