import { SLICE_NAME } from '../src/constants';
import {
  selectAllStatuses,
  selectLastError,
  selectLastSyncedAt,
  selectListening,
  selectLocationAccuracy,
  selectLocationForegroundCapability,
  selectNotifications,
  selectPermissionStatus,
  selectTrackedConfig,
} from '../src/selectors';
import type { PermissionsState } from '../src/types';

function makeState(overrides: Partial<PermissionsState> = {}) {
  const base: PermissionsState = {
    statuses: {},
    notifications: { status: null, settings: null },
    locationAccuracy: { accuracy: null },
    listening: false,
    lastSyncedAt: null,
    lastError: null,
    tracked: {
      permissions: [],
      notifications: false,
      locationAccuracy: false,
    },
    ...overrides,
  };
  return { [SLICE_NAME]: base };
}

describe('selectors', () => {
  it('selectPermissionStatus returns status for known permission', () => {
    const state = makeState({
      statuses: { 'ios.permission.CAMERA': 'granted' as never },
    });
    expect(
      selectPermissionStatus('ios.permission.CAMERA' as never)(state),
    ).toBe('granted');
  });

  it('selectPermissionStatus returns null for unknown permission', () => {
    const state = makeState();
    expect(
      selectPermissionStatus('ios.permission.CAMERA' as never)(state),
    ).toBeNull();
  });

  it('selectAllStatuses returns statuses map', () => {
    const statuses = {
      'ios.permission.CAMERA': 'granted' as never,
      'ios.permission.PHOTO_LIBRARY': 'denied' as never,
    };
    const state = makeState({ statuses });
    expect(selectAllStatuses(state)).toEqual(statuses);
  });

  it('selectNotifications returns notifications state', () => {
    const notifications = {
      status: 'granted' as never,
      settings: { alert: true } as never,
    };
    const state = makeState({ notifications });
    expect(selectNotifications(state)).toEqual(notifications);
  });

  it('selectLocationAccuracy returns location accuracy state', () => {
    const locationAccuracy = { accuracy: 'full' as never };
    const state = makeState({ locationAccuracy });
    expect(selectLocationAccuracy(state)).toEqual(locationAccuracy);
  });

  it('selectListening returns listening flag', () => {
    expect(selectListening(makeState({ listening: true }))).toBe(true);
    expect(selectListening(makeState({ listening: false }))).toBe(false);
  });

  it('selectLastSyncedAt returns timestamp', () => {
    const ts = '2026-01-01T00:00:00.000Z';
    expect(selectLastSyncedAt(makeState({ lastSyncedAt: ts }))).toBe(ts);
    expect(selectLastSyncedAt(makeState())).toBeNull();
  });

  it('selectLastError returns error payload', () => {
    expect(selectLastError(makeState())).toBeNull();
    expect(
      selectLastError(makeState({ lastError: { message: 'boom' } })),
    ).toEqual({ message: 'boom' });
  });

  it('selectTrackedConfig reads the tracked set', () => {
    expect(
      selectTrackedConfig(
        makeState({
          tracked: {
            permissions: ['ios.permission.CAMERA'] as never,
            notifications: true,
            locationAccuracy: false,
          },
        }),
      ),
    ).toEqual({
      permissions: ['ios.permission.CAMERA'],
      notifications: true,
      locationAccuracy: false,
    });
  });

  it('selectLocationForegroundCapability is memoized for the same slice', () => {
    const state = makeState();
    const first = selectLocationForegroundCapability(state);
    const second = selectLocationForegroundCapability(state);
    expect(first).toBe(second);
  });
});
