import { configureStore } from '@reduxjs/toolkit';
import { AppState } from 'react-native';
import { runSaga } from 'redux-saga';
import { SLICE_NAME } from '../src/constants';
import { permissionForegroundSyncSaga } from '../src/sagas';
import { permissionsReducer, trackPermissions } from '../src/slice';

const RNP = jest.requireMock('react-native-permissions');

function createStore() {
  return configureStore({
    reducer: { [SLICE_NAME]: permissionsReducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: false,
        serializableCheck: false,
        immutableCheck: false,
      }),
  });
}

function getChangeHandler() {
  return (AppState.addEventListener as jest.Mock).mock.calls[0][1] as (
    next: string,
  ) => void;
}

function flush() {
  return new Promise((r) => setTimeout(r, 0));
}

describe('permissionForegroundSyncSaga', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AppState as { currentState: string }).currentState = 'active';
    RNP.checkMultiple.mockResolvedValue({
      'ios.permission.CAMERA': 'granted',
    });
  });

  it('syncs permissions and updates state without thunk middleware', async () => {
    const store = createStore();

    const task = runSaga(
      {
        dispatch: store.dispatch,
        getState: store.getState,
      },
      permissionForegroundSyncSaga,
      { permissions: ['ios.permission.CAMERA'] as never },
    );

    await flush();

    expect(RNP.checkMultiple).toHaveBeenCalled();
    expect(store.getState()[SLICE_NAME].statuses['ios.permission.CAMERA']).toBe(
      'granted',
    );
    expect(store.getState()[SLICE_NAME].listening).toBe(true);

    task.cancel();
    await task.toPromise();

    expect(store.getState()[SLICE_NAME].listening).toBe(false);
  });

  it('re-syncs on background → active', async () => {
    (AppState as { currentState: string }).currentState = 'background';
    const store = createStore();
    const task = runSaga(
      {
        dispatch: store.dispatch,
        getState: store.getState,
      },
      permissionForegroundSyncSaga,
      { permissions: ['ios.permission.CAMERA'] as never },
    );

    await flush();
    RNP.checkMultiple.mockClear();

    getChangeHandler()('active');
    await flush();

    expect(RNP.checkMultiple).toHaveBeenCalled();
    task.cancel();
    await task.toPromise();
  });

  it('re-syncs on inactive → active by default', async () => {
    (AppState as { currentState: string }).currentState = 'inactive';
    const store = createStore();
    const task = runSaga(
      {
        dispatch: store.dispatch,
        getState: store.getState,
      },
      permissionForegroundSyncSaga,
      { permissions: ['ios.permission.CAMERA'] as never },
    );

    await flush();
    RNP.checkMultiple.mockClear();

    getChangeHandler()('active');
    await flush();

    expect(RNP.checkMultiple).toHaveBeenCalled();
    task.cancel();
    await task.toPromise();
  });

  it('does not sync on active → active', async () => {
    const store = createStore();
    const task = runSaga(
      {
        dispatch: store.dispatch,
        getState: store.getState,
      },
      permissionForegroundSyncSaga,
      { permissions: ['ios.permission.CAMERA'] as never },
    );

    await flush();
    RNP.checkMultiple.mockClear();

    getChangeHandler()('active');
    await flush();

    expect(RNP.checkMultiple).not.toHaveBeenCalled();
    task.cancel();
    await task.toPromise();
  });

  it('keeps listening after a rejected check and syncs on a later foreground', async () => {
    RNP.checkMultiple.mockRejectedValueOnce(new Error('native boom'));
    const store = createStore();
    const task = runSaga(
      {
        dispatch: store.dispatch,
        getState: store.getState,
      },
      permissionForegroundSyncSaga,
      { permissions: ['ios.permission.CAMERA'] as never },
    );

    await flush();

    expect(store.getState()[SLICE_NAME].listening).toBe(true);
    expect(store.getState()[SLICE_NAME].lastError?.message).toBe('native boom');

    (AppState as { currentState: string }).currentState = 'active';
    getChangeHandler()('background');
    RNP.checkMultiple.mockResolvedValue({
      'ios.permission.CAMERA': 'granted',
    });
    getChangeHandler()('active');
    await flush();

    expect(store.getState()[SLICE_NAME].listening).toBe(true);
    expect(store.getState()[SLICE_NAME].statuses['ios.permission.CAMERA']).toBe(
      'granted',
    );
    expect(store.getState()[SLICE_NAME].lastError).toBeNull();

    task.cancel();
    await task.toPromise();
  });

  it('does not drop a foreground event that arrives during an in-flight sync', async () => {
    let release: (value: Record<string, string>) => void = () => {};
    RNP.checkMultiple.mockImplementation(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );

    (AppState as { currentState: string }).currentState = 'background';
    const store = createStore();
    const task = runSaga(
      {
        dispatch: store.dispatch,
        getState: store.getState,
      },
      permissionForegroundSyncSaga,
      { permissions: ['ios.permission.CAMERA'] as never },
    );

    await flush();
    expect(RNP.checkMultiple).toHaveBeenCalledTimes(1);

    const handler = getChangeHandler();
    handler('active');
    handler('background');
    handler('active');

    release({ 'ios.permission.CAMERA': 'denied' });
    await flush();
    await flush();

    expect(RNP.checkMultiple.mock.calls.length).toBeGreaterThanOrEqual(2);

    task.cancel();
    await task.toPromise();
  });

  it('picks up permissions added via trackPermissions', async () => {
    const store = createStore();
    const task = runSaga(
      {
        dispatch: store.dispatch,
        getState: store.getState,
      },
      permissionForegroundSyncSaga,
      { permissions: ['ios.permission.CAMERA'] as never },
    );

    await flush();
    store.dispatch(trackPermissions(['ios.permission.MICROPHONE'] as never));
    RNP.checkMultiple.mockClear();
    RNP.checkMultiple.mockResolvedValue({
      'ios.permission.CAMERA': 'granted',
      'ios.permission.MICROPHONE': 'denied',
    });

    getChangeHandler()('background');
    getChangeHandler()('active');
    await flush();

    expect(RNP.checkMultiple).toHaveBeenCalledWith([
      'ios.permission.CAMERA',
      'ios.permission.MICROPHONE',
    ]);

    task.cancel();
    await task.toPromise();
  });

  it('ignores inactive → active when syncOn is backgroundToActive', async () => {
    (AppState as { currentState: string }).currentState = 'inactive';
    const store = createStore();
    const task = runSaga(
      {
        dispatch: store.dispatch,
        getState: store.getState,
      },
      permissionForegroundSyncSaga,
      {
        permissions: ['ios.permission.CAMERA'] as never,
        syncOn: 'backgroundToActive',
      },
    );

    await flush();
    RNP.checkMultiple.mockClear();
    getChangeHandler()('active');
    await flush();

    expect(RNP.checkMultiple).not.toHaveBeenCalled();
    task.cancel();
    await task.toPromise();
  });
});
