import { browser } from '$app/environment';

const PERFORMANCE_DEBUG_KEY = 'sp_perf_debug';
let longTaskObserver: PerformanceObserver | null = null;

export function performanceDebugEnabled() {
  return browser && window.localStorage.getItem(PERFORMANCE_DEBUG_KEY) === '1';
}

export async function measureAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
  if (!browser || typeof performance === 'undefined' || !performanceDebugEnabled()) {
    return operation();
  }

  const start = performance.now();
  try {
    return await operation();
  } finally {
    const end = performance.now();
    performance.measure(name, { start, end });
    if (performanceDebugEnabled()) {
      console.info('[sp-perf] measure', {
        name,
        durationMs: Math.round((end - start) * 10) / 10
      });
    }
  }
}

export function startLongTaskObserver() {
  if (!browser || longTaskObserver || !performanceDebugEnabled()) return;
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.warn('[sp-perf] long-task', {
          startTime: Math.round(entry.startTime * 10) / 10,
          durationMs: Math.round(entry.duration * 10) / 10
        });
      }
    });
    longTaskObserver.observe({ entryTypes: ['longtask'] });
  } catch {
    longTaskObserver = null;
  }
}
