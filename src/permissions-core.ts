import {
  check,
  checkLocationAccuracy as checkLocationAccuracyRNP,
  checkMultiple,
  checkNotifications as checkNotificationsRNP,
  request,
  requestLocationAccuracy as requestLocationAccuracyRNP,
  requestMultiple,
  requestNotifications as requestNotificationsRNP,
} from 'react-native-permissions';
import type {
  LocationAccuracy,
  NotificationSettings,
  Permission,
  PermissionStatus,
} from 'react-native-permissions';
import {
  type CrossPlatformPermission,
  UNAVAILABLE_STATUS,
  resolvePermissionInput,
} from './cross-platform';
import type {
  PermissionsConfig,
  RequestLocationAccuracyPayload,
  RequestNotificationsPayload,
  RequestPermissionPayload,
} from './types';

type PermissionInput = Permission | CrossPlatformPermission;

export type StatusCheckedPayload = {
  permission: string;
  status: PermissionStatus;
};

export type NotificationsCheckedPayload = {
  status: PermissionStatus;
  settings: NotificationSettings;
};

export type SyncPermissionsResult = {
  statuses?: Record<string, PermissionStatus>;
  notifications?: NotificationsCheckedPayload;
  locationAccuracy?: LocationAccuracy;
};

export async function checkPermissionCore(
  permission: PermissionInput,
): Promise<StatusCheckedPayload> {
  const result = resolvePermissionInput(permission);
  if (result.unavailable) {
    return { permission, status: UNAVAILABLE_STATUS };
  }
  const status = await check(result.resolved);
  return { permission: result.resolved as string, status };
}

export async function requestPermissionCore({
  permission,
  rationale,
}: RequestPermissionPayload): Promise<StatusCheckedPayload> {
  const result = resolvePermissionInput(permission);
  if (result.unavailable) {
    return { permission, status: UNAVAILABLE_STATUS };
  }
  const status = await request(result.resolved, rationale);
  return { permission: result.resolved as string, status };
}

export async function checkMultiplePermissionsCore(
  permissions: PermissionInput[],
): Promise<Record<string, PermissionStatus>> {
  const statuses: Record<string, PermissionStatus> = {};
  const toCheck: Permission[] = [];

  for (const perm of permissions) {
    const result = resolvePermissionInput(perm);
    if (result.unavailable) {
      statuses[perm] = UNAVAILABLE_STATUS;
    } else {
      toCheck.push(result.resolved);
    }
  }

  if (toCheck.length > 0) {
    const nativeStatuses = await checkMultiple(toCheck);
    Object.assign(statuses, nativeStatuses);
  }

  return statuses;
}

export async function requestMultiplePermissionsCore(
  permissions: PermissionInput[],
): Promise<Record<string, PermissionStatus>> {
  const statuses: Record<string, PermissionStatus> = {};
  const toRequest: Permission[] = [];

  for (const perm of permissions) {
    const result = resolvePermissionInput(perm);
    if (result.unavailable) {
      statuses[perm] = UNAVAILABLE_STATUS;
    } else {
      toRequest.push(result.resolved);
    }
  }

  if (toRequest.length > 0) {
    const nativeStatuses = await requestMultiple(toRequest);
    Object.assign(statuses, nativeStatuses);
  }

  return statuses;
}

export async function checkNotificationsCore(): Promise<NotificationsCheckedPayload> {
  return checkNotificationsRNP();
}

export async function requestNotificationsCore({
  options,
}: RequestNotificationsPayload): Promise<NotificationsCheckedPayload> {
  return requestNotificationsRNP(options);
}

export async function checkLocationAccuracyCore(): Promise<LocationAccuracy> {
  return checkLocationAccuracyRNP();
}

export async function requestLocationAccuracyCore({
  purposeKey,
}: RequestLocationAccuracyPayload): Promise<LocationAccuracy> {
  return requestLocationAccuracyRNP({ purposeKey });
}

export async function syncPermissionsCore(
  config: PermissionsConfig,
): Promise<SyncPermissionsResult> {
  const results: SyncPermissionsResult = {};

  if (config.permissions && config.permissions.length > 0) {
    results.statuses = await checkMultiplePermissionsCore(config.permissions);
  }

  if (config.notifications) {
    results.notifications = await checkNotificationsCore();
  }

  if (config.locationAccuracy) {
    results.locationAccuracy = await checkLocationAccuracyCore();
  }

  return results;
}
