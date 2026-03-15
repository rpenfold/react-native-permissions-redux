import { configureStore } from '@reduxjs/toolkit';
import { SLICE_NAME } from '../src/constants';
import { permissionsReducer } from '../src/slice';
import {
  checkLocationAccuracy,
  checkMultiplePermissions,
  checkNotifications,
  checkPermission,
  requestLocationAccuracy,
  requestMultiplePermissions,
  requestNotifications,
  requestPermission,
  syncPermissions,
} from '../src/thunks';

const RNP = jest.requireMock('react-native-permissions');

function createStore() {
  return configureStore({
    reducer: { [SLICE_NAME]: permissionsReducer },
  });
}

describe('thunks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('checkPermission calls RNP.check and updates state', async () => {
    RNP.check.mockResolvedValue('granted');
    const store = createStore();

    await store.dispatch(checkPermission('ios.permission.CAMERA' as never));

    expect(RNP.check).toHaveBeenCalledWith('ios.permission.CAMERA');
    expect(store.getState()[SLICE_NAME].statuses['ios.permission.CAMERA']).toBe(
      'granted',
    );
  });

  it('requestPermission calls RNP.request with rationale', async () => {
    RNP.request.mockResolvedValue('granted');
    const store = createStore();
    const rationale = {
      title: 'Camera',
      message: 'We need camera access',
    };

    await store.dispatch(
      requestPermission({
        permission: 'ios.permission.CAMERA' as never,
        rationale: rationale as never,
      }),
    );

    expect(RNP.request).toHaveBeenCalledWith(
      'ios.permission.CAMERA',
      rationale,
    );
    expect(store.getState()[SLICE_NAME].statuses['ios.permission.CAMERA']).toBe(
      'granted',
    );
  });

  it('checkMultiplePermissions calls RNP.checkMultiple', async () => {
    const result = {
      'ios.permission.CAMERA': 'granted',
      'ios.permission.PHOTO_LIBRARY': 'denied',
    };
    RNP.checkMultiple.mockResolvedValue(result);
    const store = createStore();

    await store.dispatch(
      checkMultiplePermissions([
        'ios.permission.CAMERA',
        'ios.permission.PHOTO_LIBRARY',
      ] as never),
    );

    expect(RNP.checkMultiple).toHaveBeenCalledWith([
      'ios.permission.CAMERA',
      'ios.permission.PHOTO_LIBRARY',
    ]);
    const state = store.getState()[SLICE_NAME];
    expect(state.statuses['ios.permission.CAMERA']).toBe('granted');
    expect(state.statuses['ios.permission.PHOTO_LIBRARY']).toBe('denied');
  });

  it('requestMultiplePermissions calls RNP.requestMultiple', async () => {
    const result = { 'ios.permission.CAMERA': 'granted' };
    RNP.requestMultiple.mockResolvedValue(result);
    const store = createStore();

    await store.dispatch(
      requestMultiplePermissions(['ios.permission.CAMERA'] as never),
    );

    expect(RNP.requestMultiple).toHaveBeenCalledWith(['ios.permission.CAMERA']);
  });

  it('checkNotifications calls RNP.checkNotifications', async () => {
    RNP.checkNotifications.mockResolvedValue({
      status: 'granted',
      settings: { alert: true },
    });
    const store = createStore();

    await store.dispatch(checkNotifications());

    expect(RNP.checkNotifications).toHaveBeenCalled();
    expect(store.getState()[SLICE_NAME].notifications.status).toBe('granted');
  });

  it('requestNotifications calls RNP.requestNotifications', async () => {
    RNP.requestNotifications.mockResolvedValue({
      status: 'granted',
      settings: { alert: true, badge: true },
    });
    const store = createStore();

    await store.dispatch(requestNotifications({ options: ['alert', 'badge'] }));

    expect(RNP.requestNotifications).toHaveBeenCalledWith(['alert', 'badge']);
  });

  it('checkLocationAccuracy calls RNP.checkLocationAccuracy', async () => {
    RNP.checkLocationAccuracy.mockResolvedValue('full');
    const store = createStore();

    await store.dispatch(checkLocationAccuracy());

    expect(RNP.checkLocationAccuracy).toHaveBeenCalled();
    expect(store.getState()[SLICE_NAME].locationAccuracy.accuracy).toBe('full');
  });

  it('requestLocationAccuracy calls RNP.requestLocationAccuracy', async () => {
    RNP.requestLocationAccuracy.mockResolvedValue('full');
    const store = createStore();

    await store.dispatch(requestLocationAccuracy({ purposeKey: 'navigation' }));

    expect(RNP.requestLocationAccuracy).toHaveBeenCalledWith({
      purposeKey: 'navigation',
    });
  });

  it('syncPermissions checks all configured items', async () => {
    RNP.checkMultiple.mockResolvedValue({
      'ios.permission.CAMERA': 'granted',
    });
    RNP.checkNotifications.mockResolvedValue({
      status: 'granted',
      settings: {},
    });
    RNP.checkLocationAccuracy.mockResolvedValue('full');
    const store = createStore();

    await store.dispatch(
      syncPermissions({
        permissions: ['ios.permission.CAMERA'] as never,
        notifications: true,
        locationAccuracy: true,
      }),
    );

    expect(RNP.checkMultiple).toHaveBeenCalled();
    expect(RNP.checkNotifications).toHaveBeenCalled();
    expect(RNP.checkLocationAccuracy).toHaveBeenCalled();
  });

  it('syncPermissions skips unconfigured items', async () => {
    const store = createStore();

    await store.dispatch(syncPermissions({}));

    expect(RNP.checkMultiple).not.toHaveBeenCalled();
    expect(RNP.checkNotifications).not.toHaveBeenCalled();
    expect(RNP.checkLocationAccuracy).not.toHaveBeenCalled();
  });
});
