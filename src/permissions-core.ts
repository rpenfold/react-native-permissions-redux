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
  LOCATION_ACCURACY_ERROR_KEY,
  NOTIFICATIONS_ERROR_KEY,
} from './constants';
import {
  CrossPlatformPermission,
  UNAVAILABLE_STATUS,
  isNotificationsPermission,
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
  notifications?: NotificationsCheckedPayload;
};

export type NotificationsCheckedPayload = {
  status: PermissionStatus;
  settings: NotificationSettings;
};

export type MultipleCheckResult = {
  statuses: Record<string, PermissionStatus>;
  notifications?: NotificationsCheckedPayload;
  error?: PermissionError;
};

export type SyncPermissionsResult = {
  statuses?: Record<string, PermissionStatus>;
  notifications?: NotificationsCheckedPayload;
  locationAccuracy?: LocationAccuracy;
  error?: PermissionError;
};

export const DEFAULT_NOTIFICATION_OPTIONS: NotificationOption[] = [
  'alert',
  'badge',
  'sound',
];

export async function checkPermissionCore(
  permission: PermissionInput,
): Promise<StatusCheckedPayload> {
  if (isNotificationsPermission(permission)) {
    const notifications = await checkNotificationsCore();
    return {
      permission: CrossPlatformPermission.NOTIFICATIONS,
      status: notifications.status,
      notifications,
    };
  }
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
  if (isNotificationsPermission(permission)) {
    const notifications = await requestNotificationsCore({
      options: DEFAULT_NOTIFICATION_OPTIONS,
      rationale,
    });
    return {
      permission: CrossPlatformPermission.NOTIFICATIONS,
      status: notifications.status,
      notifications,
    };
  }
  const result = resolvePermissionInput(permission);
  if (result.unavailable) {
    return { permission, status: UNAVAILABLE_STATUS };
  }
  const status = await request(result.resolved, rationale);
  return { permission: result.resolved as string, status };
}

function uniquePermissions(permissions: Permission[]): Permission[] {
  return [...new Set(permissions)];
}

export async function checkMultiplePermissionsCore(
  permissions: PermissionInput[],
): Promise<MultipleCheckResult> {
  const statuses: Record<string, PermissionStatus> = {};
  const toCheck: Permission[] = [];
  let notifications: NotificationsCheckedPayload | undefined;
  const errorKeys: string[] = [];
  const messages: string[] = [];

  for (const perm of permissions) {
    if (isNotificationsPermission(perm)) {
      try {
        notifications = await checkNotificationsCore();
        statuses[CrossPlatformPermission.NOTIFICATIONS] = notifications.status;
      } catch (error) {
        messages.push(errorMessage(error));
        errorKeys.push(NOTIFICATIONS_ERROR_KEY);
      }
      continue;
    }
    const result = resolvePermissionInput(perm);
    if (result.unavailable) {
      statuses[perm] = UNAVAILABLE_STATUS;
    } else {
      toCheck.push(result.resolved);
    }
  }

  const nativeToCheck = uniquePermissions(toCheck);

  if (nativeToCheck.length > 0) {
    try {
      Object.assign(statuses, await checkMultiple(nativeToCheck));
    } catch (error) {
      messages.push(errorMessage(error));
      errorKeys.push(...nativeToCheck.map(String));
    }
  }

  const result: MultipleCheckResult = { statuses, notifications };
  if (messages.length > 0) {
    result.error = {
      message: messages.join('; '),
      key: errorKeys[0],
      keys: errorKeys,
    };
  }
  return result;
}

export async function requestMultiplePermissionsCore(
  permissions: PermissionInput[],
  options?: { notificationsRationale?: Rationale },
): Promise<MultipleCheckResult> {
  const statuses: Record<string, PermissionStatus> = {};
  const toRequest: Permission[] = [];
  let notifications: NotificationsCheckedPayload | undefined;
  const errorKeys: string[] = [];
  const messages: string[] = [];

  for (const perm of permissions) {
    if (isNotificationsPermission(perm)) {
      try {
        notifications = await requestNotificationsCore({
          options: DEFAULT_NOTIFICATION_OPTIONS,
          rationale: options?.notificationsRationale,
        });
        statuses[CrossPlatformPermission.NOTIFICATIONS] = notifications.status;
      } catch (error) {
        messages.push(errorMessage(error));
        errorKeys.push(NOTIFICATIONS_ERROR_KEY);
      }
      continue;
    }
    const result = resolvePermissionInput(perm);
    if (result.unavailable) {
      statuses[perm] = UNAVAILABLE_STATUS;
    } else {
      toRequest.push(result.resolved);
    }
  }

  const nativeToRequest = uniquePermissions(toRequest);

  if (nativeToRequest.length > 0) {
    try {
      Object.assign(statuses, await requestMultiple(nativeToRequest));
    } catch (error) {
      messages.push(errorMessage(error));
      errorKeys.push(...nativeToRequest.map(String));
    }
  }

  const result: MultipleCheckResult = { statuses, notifications };
  if (messages.length > 0) {
    result.error = {
      message: messages.join('; '),
      key: errorKeys[0],
      keys: errorKeys,
    };
  }
  return result;
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

/**
 * Re-checks configured items. Each native call is isolated so one failure
 * does not skip the rest. Partial results are returned with `error` set.
 */
export async function syncPermissionsCore(
  config: PermissionsConfig,
): Promise<SyncPermissionsResult> {
  const results: SyncPermissionsResult = {};
  const messages: string[] = [];
  const keys: string[] = [];

  if (config.permissions && config.permissions.length > 0) {
    const batch = await checkMultiplePermissionsCore(config.permissions);
    if (Object.keys(batch.statuses).length > 0) {
      results.statuses = batch.statuses;
    }
    if (batch.notifications) {
      results.notifications = batch.notifications;
    }
    if (batch.error) {
      messages.push(batch.error.message);
      keys.push(
        ...(batch.error.keys ?? [batch.error.key ?? NOTIFICATIONS_ERROR_KEY]),
      );
    }
  }

  if (config.notifications && !results.notifications) {
    try {
      results.notifications = await checkNotificationsCore();
    } catch (error) {
      messages.push(errorMessage(error));
      keys.push(NOTIFICATIONS_ERROR_KEY);
    }
  }

  if (config.locationAccuracy) {
    try {
      results.locationAccuracy = await checkLocationAccuracyCore();
    } catch (error) {
      messages.push(errorMessage(error));
      keys.push(LOCATION_ACCURACY_ERROR_KEY);
    }
  }

  if (messages.length > 0) {
    results.error = {
      message: messages.join('; '),
      key: keys[0],
      keys,
    };
  }

  return results;
}
