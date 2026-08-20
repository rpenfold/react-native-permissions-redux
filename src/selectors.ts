import { createSelector } from '@reduxjs/toolkit';
import type { PermissionStatus } from 'react-native-permissions';
import { SLICE_NAME } from './constants';
import {
  CrossPlatformPermission,
  isNotificationsPermission,
  resolvePermissionInput,
} from './cross-platform';
import { getLocationForegroundCapability } from './location-foreground';
import type {
  LocationAccuracyState,
  NotificationsState,
  PermissionError,
  PermissionInput,
  PermissionsConfig,
  PermissionsState,
} from './types';

type RootState = { [SLICE_NAME]: PermissionsState };

const selectSlice = (state: RootState): PermissionsState => state[SLICE_NAME];

export function permissionStatusKey(permission: PermissionInput): string {
  if (isNotificationsPermission(permission)) {
    return CrossPlatformPermission.NOTIFICATIONS;
  }
  const result = resolvePermissionInput(permission);
  return result.unavailable ? permission : (result.resolved as string);
}

const permissionStatusSelectors = new Map<
  string,
  (state: RootState) => PermissionStatus | null
>();

const permissionErrorSelectors = new Map<
  string,
  (state: RootState) => PermissionError | null
>();

export const selectPermissionStatus = (
  permission: PermissionInput,
): ((state: RootState) => PermissionStatus | null) => {
  const cacheKey = String(permission);
  let selector = permissionStatusSelectors.get(cacheKey);
  if (!selector) {
    const key = permissionStatusKey(permission);
    selector = (state: RootState): PermissionStatus | null =>
      selectSlice(state).statuses[key] ?? null;
    permissionStatusSelectors.set(cacheKey, selector);
  }
  return selector;
};

export const selectPermissionError = (
  permission: PermissionInput,
): ((state: RootState) => PermissionError | null) => {
  const cacheKey = String(permission);
  let selector = permissionErrorSelectors.get(cacheKey);
  if (!selector) {
    const key = permissionStatusKey(permission);
    selector = (state: RootState): PermissionError | null =>
      selectSlice(state).errors[key] ?? null;
    permissionErrorSelectors.set(cacheKey, selector);
  }
  return selector;
};

export const selectAllStatuses = (
  state: RootState,
): Record<string, PermissionStatus> => selectSlice(state).statuses;

export const selectNotifications = (state: RootState): NotificationsState =>
  selectSlice(state).notifications;

export const selectLocationAccuracy = (
  state: RootState,
): LocationAccuracyState => selectSlice(state).locationAccuracy;

export const selectLocationForegroundCapability = createSelector(
  selectSlice,
  getLocationForegroundCapability,
);

export const selectListening = (state: RootState): boolean =>
  selectSlice(state).listening;

export const selectLastSyncedAt = (state: RootState): string | null =>
  selectSlice(state).lastSyncedAt;

export const selectLastError = (state: RootState): PermissionError | null =>
  selectSlice(state).lastError;

export const selectErrors = (
  state: RootState,
): Record<string, PermissionError> => selectSlice(state).errors;

export const selectTrackedConfig = (state: RootState): PermissionsConfig => {
  const tracked = selectSlice(state).tracked;
  return {
    permissions: tracked.permissions,
    notifications: tracked.notifications,
    locationAccuracy: tracked.locationAccuracy,
  };
};
