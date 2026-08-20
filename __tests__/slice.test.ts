import { configureStore } from '@reduxjs/toolkit';
import { syncFailed } from '../src/actions';
import { SLICE_NAME } from '../src/constants';
import {
  permissionsReducer,
  reset,
  setListening,
  setNotificationsTracking,
  trackPermissions,
  untrackPermissions,
} from '../src/slice';
import {
  checkLocationAccuracy,
  checkMultiplePermissions,
  checkNotifications,
  checkPermission,
  syncPermissions,
} from '../src/thunks';
import type { PermissionsState } from '../src/types';

const {
  check,
  checkMultiple,
  checkNotifications: checkNotificationsRNP,
  checkLocationAccuracy: checkLocationAccuracyRNP,
} = jest.requireMock('react-native-permissions');

function createStore() {
  return configureStore({
    reducer: { [SLICE_NAME]: permissionsReducer },
  });
}

describe('permissionsSlice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('has correct initial state', () => {
    const store = createStore();
    const state: PermissionsState = store.getState()[SLICE_NAME];

    expect(state.statuses).toEqual({});
    expect(state.notifications).toEqual({ status: null, settings: null });
    expect(state.locationAccuracy).toEqual({ accuracy: null });
    expect(state.listening).toBe(false);
    expect(state.lastSyncedAt).toBeNull();
    expect(state.lastError).toBeNull();
    expect(state.errors).toEqual({});
    expect(state.tracked).toEqual({
      permissions: [],
      notifications: false,
      locationAccuracy: false,
    });
  });

  it('handles reset action', () => {
    const store = createStore();
    check.mockResolvedValue('granted');
    store.dispatch(checkPermission('ios.permission.CAMERA' as never));

    store.dispatch(reset());
    const state = store.getState()[SLICE_NAME];
    expect(state.statuses).toEqual({});
  });

  it('handles setListening action', () => {
    const store = createStore();
    store.dispatch(setListening(true));
    expect(store.getState()[SLICE_NAME].listening).toBe(true);

    store.dispatch(setListening(false));
    expect(store.getState()[SLICE_NAME].listening).toBe(false);
  });

  it('handles checkPermission.fulfilled', async () => {
    const store = createStore();
    check.mockResolvedValue('granted');

    await store.dispatch(checkPermission('ios.permission.CAMERA' as never));
    expect(store.getState()[SLICE_NAME].statuses['ios.permission.CAMERA']).toBe(
      'granted',
    );
  });

  it('handles checkMultiplePermissions.fulfilled', async () => {
    const store = createStore();
    checkMultiple.mockResolvedValue({
      'ios.permission.CAMERA': 'granted',
      'ios.permission.PHOTO_LIBRARY': 'denied',
    });

    await store.dispatch(
      checkMultiplePermissions([
        'ios.permission.CAMERA',
        'ios.permission.PHOTO_LIBRARY',
      ] as never),
    );

    const state = store.getState()[SLICE_NAME];
    expect(state.statuses['ios.permission.CAMERA']).toBe('granted');
    expect(state.statuses['ios.permission.PHOTO_LIBRARY']).toBe('denied');
  });

  it('handles checkNotifications.fulfilled', async () => {
    const store = createStore();
    checkNotificationsRNP.mockResolvedValue({
      status: 'granted',
      settings: { alert: true, badge: true, sound: true },
    });

    await store.dispatch(checkNotifications());
    const state = store.getState()[SLICE_NAME];
    expect(state.notifications.status).toBe('granted');
    expect(state.notifications.settings).toEqual({
      alert: true,
      badge: true,
      sound: true,
    });
  });

  it('handles checkLocationAccuracy.fulfilled', async () => {
    const store = createStore();
    checkLocationAccuracyRNP.mockResolvedValue('full');

    await store.dispatch(checkLocationAccuracy());
    expect(store.getState()[SLICE_NAME].locationAccuracy.accuracy).toBe('full');
  });

  it('handles syncPermissions.fulfilled', async () => {
    const store = createStore();
    checkMultiple.mockResolvedValue({
      'ios.permission.CAMERA': 'granted',
    });
    checkNotificationsRNP.mockResolvedValue({
      status: 'denied',
      settings: { alert: false },
    });
    checkLocationAccuracyRNP.mockResolvedValue('reduced');

    await store.dispatch(
      syncPermissions({
        permissions: ['ios.permission.CAMERA'] as never,
        notifications: true,
        locationAccuracy: true,
      }),
    );

    const state = store.getState()[SLICE_NAME];
    expect(state.statuses['ios.permission.CAMERA']).toBe('granted');
    expect(state.notifications.status).toBe('denied');
    expect(state.locationAccuracy.accuracy).toBe('reduced');
    expect(state.lastSyncedAt).not.toBeNull();
    expect(state.lastError).toBeNull();
  });

  it('records lastError on syncFailed and clears it when that key succeeds', async () => {
    const store = createStore();
    store.dispatch(
      syncFailed({ message: 'native boom', key: 'ios.permission.CAMERA' }),
    );
    expect(store.getState()[SLICE_NAME].lastError).toEqual({
      message: 'native boom',
      key: 'ios.permission.CAMERA',
    });
    expect(
      store.getState()[SLICE_NAME].errors['ios.permission.CAMERA'],
    ).toEqual({ message: 'native boom', key: 'ios.permission.CAMERA' });

    check.mockResolvedValue('granted');
    await store.dispatch(checkPermission('ios.permission.CAMERA' as never));
    expect(store.getState()[SLICE_NAME].lastError).toBeNull();
    expect(
      store.getState()[SLICE_NAME].errors['ios.permission.CAMERA'],
    ).toBeUndefined();
  });

  it('keeps lastError for a different key after an unrelated success', async () => {
    const store = createStore();
    store.dispatch(
      syncFailed({ message: 'notify failed', key: 'NOTIFICATIONS' }),
    );
    check.mockResolvedValue('granted');
    await store.dispatch(checkPermission('ios.permission.CAMERA' as never));
    expect(store.getState()[SLICE_NAME].lastError).toEqual({
      message: 'notify failed',
      key: 'NOTIFICATIONS',
    });
  });

  it('records lastError when a thunk is rejected', async () => {
    const store = createStore();
    check.mockRejectedValue(new Error('check failed'));

    await store.dispatch(checkPermission('ios.permission.CAMERA' as never));
    expect(store.getState()[SLICE_NAME].lastError?.message).toBe(
      'check failed',
    );
  });

  it('trackPermissions and untrackPermissions update the tracked set', () => {
    const store = createStore();
    store.dispatch(trackPermissions(['ios.permission.CAMERA'] as never));
    store.dispatch(trackPermissions(['ios.permission.CAMERA'] as never));
    store.dispatch(setNotificationsTracking(true));
    expect(store.getState()[SLICE_NAME].tracked).toEqual({
      permissions: ['ios.permission.CAMERA'],
      notifications: true,
      locationAccuracy: false,
    });

    store.dispatch(untrackPermissions(['ios.permission.CAMERA'] as never));
    expect(store.getState()[SLICE_NAME].tracked.permissions).toEqual([]);
  });
});
