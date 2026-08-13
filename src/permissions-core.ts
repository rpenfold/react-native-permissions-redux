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
  NotificationOption,
  NotificationSettings,
  Permission,
  PermissionStatus,
  Rationale,
} from 'react-native-permissions';
import {
  type CrossPlatformPermission,
  UNAVAILABLE_STATUS,
  resolvePermissionInput,
} from './cross-platform';
import { errorMessage } from './error';
import type {
  PermissionError,
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
  error?: PermissionError;
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
  rationale,
}: RequestNotificationsPayload): Promise<NotificationsCheckedPayload> {
  const requestWithRationale = requestNotificationsRNP as (
    options: NotificationOption[],
    rationale?: Rationale,
  ) => ReturnType<typeof requestNotificationsRNP>;
  return requestWithRationale(options, rationale);
}

export async function checkLocationAccuracyCore(): Promise<LocationAccuracy> {
  return checkLocationAccuracyRNP();
}

export async function requestLocationAccuracyCore({
  purposeKey,
}: RequestLocationAccuracyPayload): Promise<LocationAccuracy> {
  return requestLocationAccuracyRNP({ purposeKey });
}

function collectError(errors: string[], error: unknown): void {
  errors.push(errorMessage(error));
}

/**
 * Re-checks configured items. Each native call is isolated so one failure
 * does not skip the rest. Partial results are returned with `error` set.
 */
export async function syncPermissionsCore(
  config: PermissionsConfig,
): Promise<SyncPermissionsResult> {
  const results: SyncPermissionsResult = {};
  const errors: string[] = [];

  if (config.permissions && config.permissions.length > 0) {
    try {
      results.statuses = await checkMultiplePermissionsCore(config.permissions);
    } catch (error) {
      collectError(errors, error);
    }
  }

  if (config.notifications) {
    try {
      results.notifications = await checkNotificationsCore();
    } catch (error) {
      collectError(errors, error);
    }
  }

  if (config.locationAccuracy) {
    try {
      results.locationAccuracy = await checkLocationAccuracyCore();
    } catch (error) {
      collectError(errors, error);
    }
  }

  if (errors.length > 0) {
    results.error = { message: errors.join('; ') };
  }

  return results;
}
