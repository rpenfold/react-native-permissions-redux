import { configureStore } from '@reduxjs/toolkit';
import { AppState } from 'react-native';
import { SLICE_NAME } from '../src/constants';
import { startPermissionListener } from '../src/listener';
import { permissionsReducer } from '../src/slice';

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

    // Wait for initial sync
    await new Promise((r) => setTimeout(r, 0));
    expect(RNP.checkMultiple).toHaveBeenCalled();
  });

  it('syncs on foreground transition', async () => {
    const store = createStore();
    const config = { permissions: ['ios.permission.CAMERA'] as never };

    // Set initial state to background
    (AppState as { currentState: string }).currentState = 'background';
    startPermissionListener(store, config);

    // Get the change handler
    const changeHandler = (AppState.addEventListener as jest.Mock).mock
      .calls[0][1];

    // Clear initial sync call
    RNP.checkMultiple.mockClear();

    // Simulate returning to foreground
    await changeHandler('active');

    expect(RNP.checkMultiple).toHaveBeenCalled();
  });

  it('does not sync on active→active', async () => {
    const store = createStore();
    const config = { permissions: ['ios.permission.CAMERA'] as never };

    (AppState as { currentState: string }).currentState = 'active';
    startPermissionListener(store, config);

    const changeHandler = (AppState.addEventListener as jest.Mock).mock
      .calls[0][1];

    RNP.checkMultiple.mockClear();

    // active → active should not trigger sync
    await changeHandler('active');

    expect(RNP.checkMultiple).not.toHaveBeenCalled();
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
