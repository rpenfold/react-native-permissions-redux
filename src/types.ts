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

/** Serializable native-call failure. `null` status still means "not checked yet". */
export interface PermissionError {
  message: string;
  /** Permission string, `NOTIFICATIONS`, `locationAccuracy`, or `_sync`. */
  key?: string;
  /** All keys affected by a bulk/sync failure. */
  keys?: string[];
}

/** Permissions re-checked on each foreground sync. */
export interface TrackedPermissions {
  permissions: PermissionInput[];
  notifications: boolean;
  locationAccuracy: boolean;
}

/**
 * Which AppState transition triggers a foreground re-sync.
 * Default `nonActiveToActive` treats control-centre / permission-dialog
 * `inactive → active` the same as returning from Settings.
 */
export type ForegroundSyncOn = 'nonActiveToActive' | 'backgroundToActive';

export interface PermissionsState {
  statuses: Record<string, PermissionStatus>;
  notifications: NotificationsState;
  locationAccuracy: LocationAccuracyState;
  listening: boolean;
  lastSyncedAt: string | null;
  lastError: PermissionError | null;
  /** Per-key failures. A missing key means that item has not failed (or was cleared). */
  errors: Record<string, PermissionError>;
  tracked: TrackedPermissions;
}

export interface PermissionsConfig {
  permissions?: PermissionInput[];
  notifications?: boolean;
  locationAccuracy?: boolean;
  /** @default 'nonActiveToActive' */
  syncOn?: ForegroundSyncOn;
  /** Debounce AppState-triggered syncs. Initial sync is never debounced. */
  debounceMs?: number;
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

/** Object form of `requestMultiplePermissions`; the array form still works. */
export interface RequestMultiplePermissionsPayload {
  permissions: PermissionInput[];
  /** Forwarded when the batch includes `NOTIFICATIONS`. */
  notificationsRationale?: Rationale;
}

export type RequestMultiplePermissionsArg =
  | PermissionInput[]
  | RequestMultiplePermissionsPayload;
