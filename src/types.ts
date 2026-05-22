import type {
  LocationAccuracy,
  NotificationOption,
  NotificationSettings,
  Permission,
  PermissionStatus,
  Rationale,
} from 'react-native-permissions';
import type { CrossPlatformPermission } from './cross-platform';

export type {
  LocationAccuracy,
  NotificationOption,
  NotificationSettings,
  Permission,
  PermissionStatus,
  Rationale,
} from 'react-native-permissions';

export type PermissionInput = Permission | CrossPlatformPermission;

/**
 * Notification permission state. `status` and `settings` stay `null` until you opt in
 * via `notifications: true` in `startPermissionListener` / `permissionForegroundSyncSaga`,
 * or dispatch `checkNotifications` / `requestNotifications`.
 */
export interface NotificationsState {
  status: PermissionStatus | null;
  settings: NotificationSettings | null;
}

/**
 * iOS location accuracy (full vs reduced). `accuracy` stays `null` until you opt in
 * via `locationAccuracy: true` in the listener/saga config, or dispatch
 * `checkLocationAccuracy` / `requestLocationAccuracy`.
 */
export interface LocationAccuracyState {
  accuracy: LocationAccuracy | null;
}

/** Approximate vs precise fix; see `getLocationForegroundCapability`. */
export type LocationForegroundPrecision = 'approximate' | 'precise' | 'unknown';

/**
 * Unified foreground location: combined coarse/fine permission access and
 * precision (Android grants vs iOS `LocationAccuracy`).
 */
export interface LocationForegroundCapability {
  access: PermissionStatus | null;
  precision: LocationForegroundPrecision;
}

export interface PermissionsState {
  statuses: Record<string, PermissionStatus>;
  notifications: NotificationsState;
  locationAccuracy: LocationAccuracyState;
  listening: boolean;
  lastSyncedAt: string | null;
}

export interface PermissionsConfig {
  permissions?: PermissionInput[];
  notifications?: boolean;
  locationAccuracy?: boolean;
}

export interface RequestPermissionPayload {
  permission: PermissionInput;
  rationale?: Rationale;
}

export interface RequestNotificationsPayload {
  options: NotificationOption[];
  rationale?: Rationale;
}

export interface RequestLocationAccuracyPayload {
  purposeKey: string;
}
