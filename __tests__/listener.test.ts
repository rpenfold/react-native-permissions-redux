import { configureStore } from '@reduxjs/toolkit';
import { AppState } from 'react-native';
import { SLICE_NAME } from '../src/constants';
import { startPermissionListener } from '../src/listener';
import { permissionsReducer, trackPermissions } from '../src/slice';

const RNP = jest.requireMock('react-native-permissions');

function createStore() {
  return configureStore({
    reducer: { [SLICE_NAME]: permissionsReducer },
  });
}

describe('startPermissionListener', () => {
  let removeMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
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

  it('sets listening to true and runs initial sync', async () => {
    const store = createStore();
    const config = {
      permissions: ['ios.permission.CAMERA'] as never,
      notifications: true,
    };

    startPermissionListener(store, config);

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
    startPermissionListener(store, config);

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
    startPermissionListener(store, config);

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
    startPermissionListener(store, config);

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
    startPermissionListener(store, config);

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
    startPermissionListener(store, {
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

  it('uses the latest tracked set after trackPermissions', async () => {
    const store = createStore();
    startPermissionListener(store, {
      permissions: ['ios.permission.CAMERA'] as never,
    });

    await new Promise((r) => setTimeout(r, 0));
    store.dispatch(trackPermissions(['ios.permission.MICROPHONE'] as never));

    const changeHandler = (AppState.addEventListener as jest.Mock).mock
      .calls[0][1];
    RNP.checkMultiple.mockClear();
    RNP.checkMultiple.mockResolvedValue({});

    (AppState as { currentState: string }).currentState = 'active';
    changeHandler('background');
    await changeHandler('active');

    expect(RNP.checkMultiple).toHaveBeenCalledWith([
      'ios.permission.CAMERA',
      'ios.permission.MICROPHONE',
    ]);
  });

  it('teardown removes subscription and sets listening to false', () => {
    const store = createStore();
    const teardown = startPermissionListener(store, {});

    expect(store.getState()[SLICE_NAME].listening).toBe(true);

    teardown();

    expect(removeMock).toHaveBeenCalled();
    expect(store.getState()[SLICE_NAME].listening).toBe(false);
  });
});
