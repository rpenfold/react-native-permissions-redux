import { Platform } from 'react-native';
import { RESULTS } from 'react-native-permissions';
import { getLocationForegroundCapability } from '../src/location-foreground';
import type { PermissionsState } from '../src/types';

const iosWhenInUse = 'ios.permission.LOCATION_WHEN_IN_USE';
const androidCoarse = 'android.permission.ACCESS_COARSE_LOCATION';
const androidFine = 'android.permission.ACCESS_FINE_LOCATION';

function baseState(
  overrides: Partial<PermissionsState> = {},
): PermissionsState {
  return {
    statuses: {},
    notifications: { status: null, settings: null },
    locationAccuracy: { accuracy: null },
    listening: false,
    lastSyncedAt: null,
    ...overrides,
  };
}

describe('getLocationForegroundCapability', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    (Platform as { OS: string }).OS = originalOS;
  });

  it('returns unavailable on unknown platform', () => {
    (Platform as { OS: string }).OS = 'web';

    const cap = getLocationForegroundCapability(baseState());

    expect(cap).toEqual({
      access: RESULTS.UNAVAILABLE,
      precision: 'unknown',
    });
  });

  describe('iOS', () => {
    beforeEach(() => {
      (Platform as { OS: string }).OS = 'ios';
    });

    it('combines single permission key for coarse/fine', () => {
      const cap = getLocationForegroundCapability(
        baseState({
          statuses: { [iosWhenInUse]: RESULTS.GRANTED },
          locationAccuracy: { accuracy: 'full' },
        }),
      );

      expect(cap.access).toBe(RESULTS.GRANTED);
      expect(cap.precision).toBe('precise');
    });

    it('uses reduced accuracy for approximate', () => {
      const cap = getLocationForegroundCapability(
        baseState({
          statuses: { [iosWhenInUse]: RESULTS.GRANTED },
          locationAccuracy: { accuracy: 'reduced' },
        }),
      );

      expect(cap.precision).toBe('approximate');
    });

    it('unknown precision when accuracy not synced', () => {
      const cap = getLocationForegroundCapability(
        baseState({
          statuses: { [iosWhenInUse]: RESULTS.GRANTED },
          locationAccuracy: { accuracy: null },
        }),
      );

      expect(cap.access).toBe(RESULTS.GRANTED);
      expect(cap.precision).toBe('unknown');
    });

    it('unknown precision when access not granted', () => {
      const cap = getLocationForegroundCapability(
        baseState({
          statuses: { [iosWhenInUse]: RESULTS.DENIED },
          locationAccuracy: { accuracy: 'full' },
        }),
      );

      expect(cap.access).toBe(RESULTS.DENIED);
      expect(cap.precision).toBe('unknown');
    });
  });

  describe('Android', () => {
    beforeEach(() => {
      (Platform as { OS: string }).OS = 'android';
    });

    it('precise when fine granted', () => {
      const cap = getLocationForegroundCapability(
        baseState({
          statuses: {
            [androidCoarse]: RESULTS.DENIED,
            [androidFine]: RESULTS.GRANTED,
          },
        }),
      );

      expect(cap.access).toBe(RESULTS.GRANTED);
      expect(cap.precision).toBe('precise');
    });

    it('approximate when only coarse granted', () => {
      const cap = getLocationForegroundCapability(
        baseState({
          statuses: {
            [androidCoarse]: RESULTS.GRANTED,
            [androidFine]: RESULTS.DENIED,
          },
        }),
      );

      expect(cap.access).toBe(RESULTS.GRANTED);
      expect(cap.precision).toBe('approximate');
    });

    it('denied when neither granted', () => {
      const cap = getLocationForegroundCapability(
        baseState({
          statuses: {
            [androidCoarse]: RESULTS.DENIED,
            [androidFine]: RESULTS.DENIED,
          },
        }),
      );

      expect(cap.access).toBe(RESULTS.DENIED);
      expect(cap.precision).toBe('unknown');
    });

    it('null access when not yet checked', () => {
      const cap = getLocationForegroundCapability(baseState());

      expect(cap.access).toBeNull();
      expect(cap.precision).toBe('unknown');
    });
  });
});
