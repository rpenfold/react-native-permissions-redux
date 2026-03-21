import { configureStore } from '@reduxjs/toolkit';
import { Platform } from 'react-native';
import { SLICE_NAME } from '../src/constants';
import {
  CrossPlatformPermission,
  resolvePermission,
} from '../src/cross-platform';
import { permissionsReducer } from '../src/slice';
import { checkMultiplePermissions, checkPermission } from '../src/thunks';

const RNP = jest.requireMock('react-native-permissions');

function createStore() {
  return configureStore({
    reducer: { [SLICE_NAME]: permissionsReducer },
  });
}

describe('cross-platform', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('resolvePermission (iOS)', () => {
    it('resolves CAMERA to ios.permission.CAMERA', () => {
      expect(resolvePermission(CrossPlatformPermission.CAMERA)).toBe(
        'ios.permission.CAMERA',
      );
    });

    it('resolves MICROPHONE to ios.permission.MICROPHONE', () => {
      expect(resolvePermission(CrossPlatformPermission.MICROPHONE)).toBe(
        'ios.permission.MICROPHONE',
      );
    });

    it('resolves LOCATION_WHEN_IN_USE to ios.permission.LOCATION_WHEN_IN_USE', () => {
      expect(
        resolvePermission(CrossPlatformPermission.LOCATION_WHEN_IN_USE),
      ).toBe('ios.permission.LOCATION_WHEN_IN_USE');
    });

    it('resolves LOCATION_COARSE and LOCATION_FINE to when-in-use on iOS', () => {
      expect(resolvePermission(CrossPlatformPermission.LOCATION_COARSE)).toBe(
        'ios.permission.LOCATION_WHEN_IN_USE',
      );
      expect(resolvePermission(CrossPlatformPermission.LOCATION_FINE)).toBe(
        'ios.permission.LOCATION_WHEN_IN_USE',
      );
    });

    it('resolves CONTACTS_READ to ios.permission.CONTACTS', () => {
      expect(resolvePermission(CrossPlatformPermission.CONTACTS_READ)).toBe(
        'ios.permission.CONTACTS',
      );
    });

    it('returns null for Android-only permissions on iOS', () => {
      expect(
        resolvePermission(CrossPlatformPermission.NOTIFICATIONS),
      ).toBeNull();
      expect(resolvePermission(CrossPlatformPermission.PHONE_CALL)).toBeNull();
      expect(resolvePermission(CrossPlatformPermission.READ_SMS)).toBeNull();
    });
  });

  describe('resolvePermission (Android)', () => {
    const originalOS = Platform.OS;

    beforeAll(() => {
      (Platform as { OS: string }).OS = 'android';
    });

    afterAll(() => {
      (Platform as { OS: string }).OS = originalOS;
    });

    it('resolves CAMERA to android.permission.CAMERA', () => {
      expect(resolvePermission(CrossPlatformPermission.CAMERA)).toBe(
        'android.permission.CAMERA',
      );
    });

    it('resolves MICROPHONE to android.permission.RECORD_AUDIO', () => {
      expect(resolvePermission(CrossPlatformPermission.MICROPHONE)).toBe(
        'android.permission.RECORD_AUDIO',
      );
    });

    it('resolves NOTIFICATIONS to android.permission.POST_NOTIFICATIONS', () => {
      expect(resolvePermission(CrossPlatformPermission.NOTIFICATIONS)).toBe(
        'android.permission.POST_NOTIFICATIONS',
      );
    });

    it('resolves LOCATION_COARSE and LOCATION_FINE on Android', () => {
      expect(resolvePermission(CrossPlatformPermission.LOCATION_COARSE)).toBe(
        'android.permission.ACCESS_COARSE_LOCATION',
      );
      expect(resolvePermission(CrossPlatformPermission.LOCATION_FINE)).toBe(
        'android.permission.ACCESS_FINE_LOCATION',
      );
    });

    it('returns null for iOS-only permissions on Android', () => {
      expect(resolvePermission(CrossPlatformPermission.FACE_ID)).toBeNull();
      expect(resolvePermission(CrossPlatformPermission.SIRI)).toBeNull();
      expect(
        resolvePermission(CrossPlatformPermission.APP_TRACKING),
      ).toBeNull();
    });
  });

  describe('thunks with CrossPlatformPermission (iOS)', () => {
    it('checkPermission resolves and calls RNP.check with native permission', async () => {
      RNP.check.mockResolvedValue('granted');
      const store = createStore();

      await store.dispatch(checkPermission(CrossPlatformPermission.CAMERA));

      expect(RNP.check).toHaveBeenCalledWith('ios.permission.CAMERA');
      expect(
        store.getState()[SLICE_NAME].statuses['ios.permission.CAMERA'],
      ).toBe('granted');
    });

    it('checkPermission returns unavailable for platform-missing permission', async () => {
      const store = createStore();

      // PHONE_CALL has no iOS mapping
      await store.dispatch(checkPermission(CrossPlatformPermission.PHONE_CALL));

      expect(RNP.check).not.toHaveBeenCalled();
      expect(
        store.getState()[SLICE_NAME].statuses[
          CrossPlatformPermission.PHONE_CALL
        ],
      ).toBe('unavailable');
    });

    it('checkMultiplePermissions handles mix of available and unavailable', async () => {
      RNP.checkMultiple.mockResolvedValue({
        'ios.permission.CAMERA': 'granted',
      });
      const store = createStore();

      await store.dispatch(
        checkMultiplePermissions([
          CrossPlatformPermission.CAMERA,
          CrossPlatformPermission.PHONE_CALL, // no iOS mapping
        ]),
      );

      const statuses = store.getState()[SLICE_NAME].statuses;
      expect(statuses['ios.permission.CAMERA']).toBe('granted');
      expect(statuses[CrossPlatformPermission.PHONE_CALL]).toBe('unavailable');
    });

    it('still accepts native Permission strings directly', async () => {
      RNP.check.mockResolvedValue('denied');
      const store = createStore();

      await store.dispatch(checkPermission('ios.permission.CAMERA' as never));

      expect(RNP.check).toHaveBeenCalledWith('ios.permission.CAMERA');
      expect(
        store.getState()[SLICE_NAME].statuses['ios.permission.CAMERA'],
      ).toBe('denied');
    });
  });
});
