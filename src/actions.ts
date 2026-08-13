import { createAction } from '@reduxjs/toolkit';
import type {
  LocationAccuracy,
  PermissionStatus,
} from 'react-native-permissions';
import { SLICE_NAME } from './constants';
import type {
  NotificationsCheckedPayload,
  StatusCheckedPayload,
  SyncPermissionsResult,
} from './permissions-core';
import type { PermissionError } from './types';

export const statusChecked = createAction<StatusCheckedPayload>(
  `${SLICE_NAME}/statusChecked`,
);

export const statusesChecked = createAction<Record<string, PermissionStatus>>(
  `${SLICE_NAME}/statusesChecked`,
);

export const notificationsChecked = createAction<NotificationsCheckedPayload>(
  `${SLICE_NAME}/notificationsChecked`,
);

export const locationAccuracyChecked = createAction<LocationAccuracy>(
  `${SLICE_NAME}/locationAccuracyChecked`,
);

export type SyncCompletedPayload = Omit<SyncPermissionsResult, 'error'> & {
  lastSyncedAt: string;
};

export const syncCompleted = createAction(
  `${SLICE_NAME}/syncCompleted`,
  (result: SyncPermissionsResult): { payload: SyncCompletedPayload } => ({
    payload: {
      statuses: result.statuses,
      notifications: result.notifications,
      locationAccuracy: result.locationAccuracy,
      lastSyncedAt: new Date().toISOString(),
    },
  }),
);

export const syncFailed = createAction<PermissionError>(
  `${SLICE_NAME}/syncFailed`,
);
