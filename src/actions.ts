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

export const syncCompleted = createAction<SyncPermissionsResult>(
  `${SLICE_NAME}/syncCompleted`,
);
