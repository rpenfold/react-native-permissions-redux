import type {
  LocationAccuracy,
  NotificationOption,
  NotificationSettings,
  Permission,
  PermissionStatus,
  Rationale,
} from 'react-native-permissions';

export type {
  LocationAccuracy,
  NotificationOption,
  NotificationSettings,
  Permission,
  PermissionStatus,
  Rationale,
} from 'react-native-permissions';

export interface NotificationsState {
  status: PermissionStatus | null;
  settings: NotificationSettings | null;
}

export interface LocationAccuracyState {
  accuracy: LocationAccuracy | null;
}

export interface PermissionsState {
  statuses: Record<string, PermissionStatus>;
  notifications: NotificationsState;
  locationAccuracy: LocationAccuracyState;
  listening: boolean;
  lastSyncedAt: string | null;
}

export interface PermissionsConfig {
  permissions?: Permission[];
  notifications?: boolean;
  locationAccuracy?: boolean;
}

export interface RequestPermissionPayload {
  permission: Permission;
  rationale?: Rationale;
}

export interface RequestNotificationsPayload {
  options: NotificationOption[];
  rationale?: Rationale;
}

export interface RequestLocationAccuracyPayload {
  purposeKey: string;
}
