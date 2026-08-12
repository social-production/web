type VisibilityPollOptions = {
  activeMs: number;
  idleMs?: number;
  isActive?: () => boolean;
  runImmediately?: boolean;
};

export function startVisibilityPoll(
  task: () => Promise<void> | void,
  options: VisibilityPollOptions
) {
  const idleMs = options.idleMs ?? Math.max(options.activeMs * 4, 30_000);
  const isActive = options.isActive ?? (() => true);
  let timer: number | null = null;
  let stopped = false;
  let running = false;

  const schedule = (delay: number) => {
    if (stopped) return;
    if (timer !== null) window.clearTimeout(timer);
    timer = window.setTimeout(run, delay);
  };

  const run = async () => {
    timer = null;
    if (stopped) return;
    const active = document.visibilityState === 'visible' && isActive();
    if (!active || running) {
      schedule(idleMs);
      return;
    }

    running = true;
    try {
      await task();
    } finally {
      running = false;
      schedule(options.activeMs);
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && isActive()) {
      schedule(0);
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  schedule(options.runImmediately ? 0 : options.activeMs);

  return () => {
    stopped = true;
    if (timer !== null) window.clearTimeout(timer);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
