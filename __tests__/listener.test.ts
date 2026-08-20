import { configureStore } from '@reduxjs/toolkit';
import { AppState } from 'react-native';
import { SLICE_NAME } from '../src/constants';
import { startPermissionListener } from '../src/listener';
import {
  permissionsReducer,
  setNotificationsTracking,
  trackPermissions,
} from '../src/slice';

const RNP = jest.requireMock('react-native-permissions');

function createStore() {
  return configureStore({
    reducer: { [SLICE_NAME]: permissionsReducer },
  });
}

describe('startPermissionListener', () => {
  let removeMock: jest.Mock;
  let stop: (() => void) | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    stop = undefined;
    removeMock = jest.fn();
    (AppState as { currentState: string }).currentState = 'active';
    (AppState.addEventListener as jest.Mock).mockReturnValue({
      remove: removeMock,
    });
    RNP.checkMultiple.mockResolvedValue({});
    RNP.checkNotifications.mockResolvedValue({
      status: 'granted',
      settings: {},
    });
  });

  afterEach(() => {
    stop?.();
    stop = undefined;
  });

  function start(
    store: ReturnType<typeof createStore>,
    config: Parameters<typeof startPermissionListener>[1],
  ) {
    stop = startPermissionListener(store, config);
    return stop;
  }

  it('sets listening to true and runs initial sync', async () => {
    const store = createStore();
    const config = {
      permissions: ['ios.permission.CAMERA'] as never,
      notifications: true,
    };

    start(store, config);

    expect(store.getState()[SLICE_NAME].listening).toBe(true);
    expect(AppState.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );

    await new Promise((r) => setTimeout(r, 0));
    expect(RNP.checkMultiple).toHaveBeenCalled();
    expect(store.getState()[SLICE_NAME].tracked.permissions).toEqual([
      'ios.permission.CAMERA',
    ]);
    expect(store.getState()[SLICE_NAME].tracked.notifications).toBe(true);
  });

  it('syncs on foreground transition', async () => {
    const store = createStore();
    const config = { permissions: ['ios.permission.CAMERA'] as never };

    (AppState as { currentState: string }).currentState = 'background';
    start(store, config);

    await new Promise((r) => setTimeout(r, 0));

    const changeHandler = (AppState.addEventListener as jest.Mock).mock
      .calls[0][1];

    RNP.checkMultiple.mockClear();
    await changeHandler('active');
    await new Promise((r) => setTimeout(r, 0));

    expect(RNP.checkMultiple).toHaveBeenCalled();
  });

  it('syncs on inactive → active by default', async () => {
    const store = createStore();
    const config = { permissions: ['ios.permission.CAMERA'] as never };

    (AppState as { currentState: string }).currentState = 'inactive';
    start(store, config);

    await new Promise((r) => setTimeout(r, 0));

    const changeHandler = (AppState.addEventListener as jest.Mock).mock
      .calls[0][1];

    RNP.checkMultiple.mockClear();
    await changeHandler('active');
    await new Promise((r) => setTimeout(r, 0));

    expect(RNP.checkMultiple).toHaveBeenCalled();
  });

  it('does not sync inactive → active when syncOn is backgroundToActive', async () => {
    const store = createStore();
    const config = {
      permissions: ['ios.permission.CAMERA'] as never,
      syncOn: 'backgroundToActive' as const,
    };

    (AppState as { currentState: string }).currentState = 'inactive';
    start(store, config);

    const changeHandler = (AppState.addEventListener as jest.Mock).mock
      .calls[0][1];

    RNP.checkMultiple.mockClear();
    await changeHandler('active');

    expect(RNP.checkMultiple).not.toHaveBeenCalled();
  });

  it('does not sync on active→active', async () => {
    const store = createStore();
    const config = { permissions: ['ios.permission.CAMERA'] as never };

    (AppState as { currentState: string }).currentState = 'active';
    start(store, config);

    const changeHandler = (AppState.addEventListener as jest.Mock).mock
      .calls[0][1];

    RNP.checkMultiple.mockClear();

    await changeHandler('active');

    expect(RNP.checkMultiple).not.toHaveBeenCalled();
  });

  it('coalesces overlapping foreground syncs', async () => {
    let resolveFirst: (value: Record<string, string>) => void = () => {};
    RNP.checkMultiple.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
    );
    RNP.checkMultiple.mockResolvedValue({
      'ios.permission.CAMERA': 'granted',
    });

    const store = createStore();
    (AppState as { currentState: string }).currentState = 'background';
    start(store, {
      permissions: ['ios.permission.CAMERA'] as never,
    });

    await new Promise((r) => setTimeout(r, 0));
    expect(RNP.checkMultiple).toHaveBeenCalledTimes(1);

    const changeHandler = (AppState.addEventListener as jest.Mock).mock
      .calls[0][1];
    void changeHandler('active');
    void changeHandler('background');
    void changeHandler('active');

    resolveFirst({ 'ios.permission.CAMERA': 'denied' });
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));

    expect(RNP.checkMultiple.mock.calls.length).toBe(2);
  });

  it('syncs immediately after trackPermissions', async () => {
    const store = createStore();
    start(store, {
      permissions: ['ios.permission.CAMERA'] as never,
    });

    await new Promise((r) => setTimeout(r, 0));
    RNP.checkMultiple.mockClear();
    RNP.checkMultiple.mockResolvedValue({});

    store.dispatch(trackPermissions(['ios.permission.MICROPHONE'] as never));
    await new Promise((r) => setTimeout(r, 0));

    expect(RNP.checkMultiple).toHaveBeenCalledWith([
      'ios.permission.CAMERA',
      'ios.permission.MICROPHONE',
    ]);
  });

  it('syncs immediately when notifications tracking is turned on', async () => {
    const store = createStore();
    start(store, {
      permissions: ['ios.permission.CAMERA'] as never,
    });
    await new Promise((r) => setTimeout(r, 0));
    RNP.checkNotifications.mockClear();

    store.dispatch(setNotificationsTracking(true));
    await new Promise((r) => setTimeout(r, 0));

    expect(RNP.checkNotifications).toHaveBeenCalled();
  });

  it('restarts if startPermissionListener is called twice', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const store = createStore();
    const firstRemove = jest.fn();
    (AppState.addEventListener as jest.Mock).mockReturnValueOnce({
      remove: firstRemove,
    });

    start(store, {
      permissions: ['ios.permission.CAMERA'] as never,
    });
    start(store, {
      permissions: ['ios.permission.MICROPHONE'] as never,
    });

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('already listening'),
    );
    expect(firstRemove).toHaveBeenCalled();
    expect(store.getState()[SLICE_NAME].tracked.permissions).toEqual([
      'ios.permission.MICROPHONE',
    ]);
    warn.mockRestore();
  });

  it('teardown removes subscription and sets listening to false', () => {
    const store = createStore();
    const teardown = start(store, {});

    expect(store.getState()[SLICE_NAME].listening).toBe(true);

    teardown();

    expect(removeMock).toHaveBeenCalled();
    expect(store.getState()[SLICE_NAME].listening).toBe(false);
  });

  it('keeps listening after a rejected check and records lastError', async () => {
    RNP.checkMultiple.mockRejectedValueOnce(new Error('native boom'));
    const store = createStore();
    start(store, {
      permissions: ['ios.permission.CAMERA'] as never,
    });

    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));

    expect(store.getState()[SLICE_NAME].listening).toBe(true);
    expect(store.getState()[SLICE_NAME].lastError?.message).toBe('native boom');
  });

  it('does not apply an in-flight sync after stop', async () => {
    let resolveCheck: (value: Record<string, string>) => void = () => {};
    RNP.checkMultiple.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveCheck = resolve;
        }),
    );

    const store = createStore();
    const teardown = start(store, {
      permissions: ['ios.permission.CAMERA'] as never,
    });

    await new Promise((r) => setTimeout(r, 0));
    teardown();
    resolveCheck({ 'ios.permission.CAMERA': 'granted' });
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));

    expect(store.getState()[SLICE_NAME].listening).toBe(false);
    expect(
      store.getState()[SLICE_NAME].statuses['ios.permission.CAMERA'],
    ).toBeUndefined();
  });

  it('debounces AppState-triggered syncs', async () => {
    jest.useFakeTimers();
    try {
      const store = createStore();
      (AppState as { currentState: string }).currentState = 'background';
      start(store, {
        permissions: ['ios.permission.CAMERA'] as never,
        debounceMs: 200,
      });

      await jest.runOnlyPendingTimersAsync();
      expect(RNP.checkMultiple).toHaveBeenCalledTimes(1);
      RNP.checkMultiple.mockClear();

      const changeHandler = (AppState.addEventListener as jest.Mock).mock
        .calls[0][1];
      changeHandler('active');
      expect(RNP.checkMultiple).not.toHaveBeenCalled();

      await jest.advanceTimersByTimeAsync(199);
      expect(RNP.checkMultiple).not.toHaveBeenCalled();

      await jest.advanceTimersByTimeAsync(1);
      expect(RNP.checkMultiple).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });
});
