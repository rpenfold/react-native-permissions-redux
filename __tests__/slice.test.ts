import { configureStore } from '@reduxjs/toolkit';
import { SLICE_NAME } from '../src/constants';
import { permissionsReducer, reset, setListening } from '../src/slice';
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
  });
});
