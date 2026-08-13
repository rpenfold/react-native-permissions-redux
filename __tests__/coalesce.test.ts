import { createCoalescedRunner, debounceCallback } from '../src/coalesce';

describe('createCoalescedRunner', () => {
  it('runs once when triggered sequentially after completion', async () => {
    const run = jest.fn().mockResolvedValue(undefined);
    const trigger = createCoalescedRunner(run);

    await trigger();
    await trigger();

    expect(run).toHaveBeenCalledTimes(2);
  });

  it('coalesces overlapping triggers into one extra run', async () => {
    const resolvers: Array<() => void> = [];
    const run = jest.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolvers.push(resolve);
        }),
    );
    const trigger = createCoalescedRunner(run);

    const first = trigger();
    void trigger();
    void trigger();

    expect(run).toHaveBeenCalledTimes(1);

    resolvers[0]();
    await Promise.resolve();
    await Promise.resolve();

    expect(run).toHaveBeenCalledTimes(2);

    resolvers[1]();
    await first;
  });
});

describe('debounceCallback', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('invokes after the quiet period', () => {
    const fn = jest.fn();
    const debounced = debounceCallback(fn, 100);

    debounced();
    debounced();
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('cancel prevents a pending call', () => {
    const fn = jest.fn();
    const debounced = debounceCallback(fn, 100);

    debounced();
    debounced.cancel();
    jest.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
  });
});
