/**
 * Ensures only one `run` is in flight. Triggers that arrive while busy set a
 * dirty flag so exactly one extra run happens afterwards (coalesce, not cancel).
 * Native permission checks cannot be aborted.
 */
export function createCoalescedRunner(
  run: () => Promise<void>,
): () => Promise<void> {
  let running = false;
  let dirty = false;

  return async function trigger() {
    if (running) {
      dirty = true;
      return;
    }
    running = true;
    try {
      do {
        dirty = false;
        await run();
      } while (dirty);
    } finally {
      running = false;
    }
  };
}

export type DebouncedCallback = (() => void) & { cancel: () => void };

export function debounceCallback(
  fn: () => void,
  ms: number,
): DebouncedCallback {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const debounced = (() => {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = undefined;
      fn();
    }, ms);
  }) as DebouncedCallback;
  debounced.cancel = () => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };
  return debounced;
}
