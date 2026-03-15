import type { Permission, PermissionStatus } from 'react-native-permissions';
import { SLICE_NAME } from './constants';
import type {
  LocationAccuracyState,
  NotificationsState,
  PermissionsState,
} from './types';

type RootState = { [SLICE_NAME]: PermissionsState };

const selectSlice = (state: RootState): PermissionsState => state[SLICE_NAME];

export const selectPermissionStatus =
  (permission: Permission) =>
  (state: RootState): PermissionStatus | null =>
    selectSlice(state).statuses[permission] ?? null;

export const selectAllStatuses = (
  state: RootState,
): Record<string, PermissionStatus> => selectSlice(state).statuses;

export const selectNotifications = (state: RootState): NotificationsState =>
  selectSlice(state).notifications;

export const selectLocationAccuracy = (
  state: RootState,
): LocationAccuracyState => selectSlice(state).locationAccuracy;

export const selectListening = (state: RootState): boolean =>
  selectSlice(state).listening;

export const selectLastSyncedAt = (state: RootState): string | null =>
  selectSlice(state).lastSyncedAt;
