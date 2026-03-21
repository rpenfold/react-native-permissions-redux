import { Platform } from 'react-native';
import { RESULTS } from 'react-native-permissions';
import type {
  LocationAccuracy,
  PermissionStatus,
} from 'react-native-permissions';
import { CrossPlatformPermission, resolvePermission } from './cross-platform';
import type {
  LocationForegroundCapability,
  LocationForegroundPrecision,
  PermissionsState,
} from './types';

function hasForegroundAccess(status: PermissionStatus | null): boolean {
  return status === RESULTS.GRANTED || status === RESULTS.LIMITED;
}

function iosPrecision(
  accuracy: LocationAccuracy | null,
): LocationForegroundPrecision {
  if (accuracy === 'full') return 'precise';
  if (accuracy === 'reduced') return 'approximate';
  return 'unknown';
}

function androidPrecision(
  coarse: PermissionStatus | null,
  fine: PermissionStatus | null,
): LocationForegroundPrecision {
  if (hasForegroundAccess(fine)) return 'precise';
  if (hasForegroundAccess(coarse)) return 'approximate';
  return 'unknown';
}

function combineForegroundAccess(
  coarseKey: string | null,
  fineKey: string | null,
  coarseStatus: PermissionStatus | null,
  fineStatus: PermissionStatus | null,
): PermissionStatus | null {
  const sameKey =
    coarseKey !== null && fineKey !== null && coarseKey === fineKey;

  if (sameKey) {
    return coarseStatus ?? fineStatus ?? null;
  }

  if (hasForegroundAccess(fineStatus)) return fineStatus;
  if (hasForegroundAccess(coarseStatus)) return coarseStatus;
  if (fineStatus !== null) return fineStatus;
  if (coarseStatus !== null) return coarseStatus;
  return null;
}

/**
 * Derives a unified foreground location view from Redux permission state.
 * Populate `statuses` via checks/sync for `LOCATION_COARSE` and `LOCATION_FINE`.
 * On iOS, set `locationAccuracy: true` in `startPermissionListener` (or dispatch
 * `checkLocationAccuracy`) so `precision` can be `'precise'` / `'approximate'`.
 */
export function getLocationForegroundCapability(
  state: PermissionsState,
): LocationForegroundCapability {
  const coarseKey = resolvePermission(CrossPlatformPermission.LOCATION_COARSE);
  const fineKey = resolvePermission(CrossPlatformPermission.LOCATION_FINE);

  if (coarseKey === null || fineKey === null) {
    return { access: RESULTS.UNAVAILABLE, precision: 'unknown' };
  }

  const coarseStatus = state.statuses[coarseKey] ?? null;
  const fineStatus = state.statuses[fineKey] ?? null;

  const access = combineForegroundAccess(
    coarseKey,
    fineKey,
    coarseStatus,
    fineStatus,
  );

  if (!hasForegroundAccess(access)) {
    return { access, precision: 'unknown' };
  }

  if (Platform.OS === 'android') {
    return {
      access,
      precision: androidPrecision(coarseStatus, fineStatus),
    };
  }

  if (Platform.OS === 'ios') {
    return {
      access,
      precision: iosPrecision(state.locationAccuracy.accuracy),
    };
  }

  return { access, precision: 'unknown' };
}
