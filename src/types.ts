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

export interface NotificationsState {
  status: PermissionStatus | null;
  settings: NotificationSettings | null;
}

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
