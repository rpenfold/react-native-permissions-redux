import type { PermissionStatus } from 'react-native-permissions';
import { SLICE_NAME } from './constants';
import { resolvePermissionInput } from './cross-platform';
import { getLocationForegroundCapability } from './location-foreground';
import type {
  LocationAccuracyState,
  LocationForegroundCapability,
  NotificationsState,
  PermissionInput,
  PermissionsState,
} from './types';

type RootState = { [SLICE_NAME]: PermissionsState };

const selectSlice = (state: RootState): PermissionsState => state[SLICE_NAME];

export const selectPermissionStatus =
  (permission: PermissionInput) =>
  (state: RootState): PermissionStatus | null => {
    const result = resolvePermissionInput(permission);
    const key = result.unavailable ? permission : result.resolved;
    return selectSlice(state).statuses[key] ?? null;
  };

export const selectAllStatuses = (
  state: RootState,
): Record<string, PermissionStatus> => selectSlice(state).statuses;

export const selectNotifications = (state: RootState): NotificationsState =>
  selectSlice(state).notifications;

export const selectLocationAccuracy = (
  state: RootState,
): LocationAccuracyState => selectSlice(state).locationAccuracy;

export const selectLocationForegroundCapability = (
  state: RootState,
): LocationForegroundCapability =>
  getLocationForegroundCapability(selectSlice(state));

export const selectListening = (state: RootState): boolean =>
  selectSlice(state).listening;

export const selectLastSyncedAt = (state: RootState): string | null =>
  selectSlice(state).lastSyncedAt;
