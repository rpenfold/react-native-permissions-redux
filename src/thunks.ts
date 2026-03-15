import { createAsyncThunk } from '@reduxjs/toolkit';
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
import type { Permission, PermissionStatus } from 'react-native-permissions';
import { SLICE_NAME } from './constants';
import type {
  PermissionsConfig,
  RequestLocationAccuracyPayload,
  RequestNotificationsPayload,
  RequestPermissionPayload,
} from './types';

export const checkPermission = createAsyncThunk(
  `${SLICE_NAME}/checkPermission`,
  async (permission: Permission) => {
    const status = await check(permission);
    return { permission, status };
  },
);

export const requestPermission = createAsyncThunk(
  `${SLICE_NAME}/requestPermission`,
  async ({ permission, rationale }: RequestPermissionPayload) => {
    const status = await request(permission, rationale);
    return { permission, status };
  },
);

export const checkMultiplePermissions = createAsyncThunk(
  `${SLICE_NAME}/checkMultiplePermissions`,
  async (permissions: Permission[]) => {
    const statuses = await checkMultiple(permissions);
    return statuses as Record<string, PermissionStatus>;
  },
);

export const requestMultiplePermissions = createAsyncThunk(
  `${SLICE_NAME}/requestMultiplePermissions`,
  async (permissions: Permission[]) => {
    const statuses = await requestMultiple(permissions);
    return statuses as Record<string, PermissionStatus>;
  },
);

export const checkNotifications = createAsyncThunk(
  `${SLICE_NAME}/checkNotifications`,
  async () => {
    const result = await checkNotificationsRNP();
    return result;
  },
);

export const requestNotifications = createAsyncThunk(
  `${SLICE_NAME}/requestNotifications`,
  async ({ options }: RequestNotificationsPayload) => {
    const result = await requestNotificationsRNP(options);
    return result;
  },
);

export const checkLocationAccuracy = createAsyncThunk(
  `${SLICE_NAME}/checkLocationAccuracy`,
  async () => {
    const accuracy = await checkLocationAccuracyRNP();
    return accuracy;
  },
);

export const requestLocationAccuracy = createAsyncThunk(
  `${SLICE_NAME}/requestLocationAccuracy`,
  async ({ purposeKey }: RequestLocationAccuracyPayload) => {
    const accuracy = await requestLocationAccuracyRNP({ purposeKey });
    return accuracy;
  },
);

export const syncPermissions = createAsyncThunk(
  `${SLICE_NAME}/syncPermissions`,
  async (config: PermissionsConfig) => {
    const results: {
      statuses?: Record<string, PermissionStatus>;
      notifications?: { status: PermissionStatus; settings: unknown };
      locationAccuracy?: string;
    } = {};

    if (config.permissions && config.permissions.length > 0) {
      const statuses = await checkMultiple(config.permissions);
      results.statuses = statuses as Record<string, PermissionStatus>;
    }

    if (config.notifications) {
      results.notifications = await checkNotificationsRNP();
    }

    if (config.locationAccuracy) {
      results.locationAccuracy = await checkLocationAccuracyRNP();
    }

    return results;
  },
);
