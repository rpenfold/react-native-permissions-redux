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

export const checkPermission = createAsyncThunk(
  `${SLICE_NAME}/checkPermission`,
  async (permission: PermissionInput) => {
    const result = resolvePermissionInput(permission);
    if (result.unavailable) {
      return { permission, status: UNAVAILABLE_STATUS };
    }
    const status = await check(result.resolved);
    return { permission: result.resolved as string, status };
  },
);

export const requestPermission = createAsyncThunk(
  `${SLICE_NAME}/requestPermission`,
  async ({ permission, rationale }: RequestPermissionPayload) => {
    const result = resolvePermissionInput(permission);
    if (result.unavailable) {
      return { permission, status: UNAVAILABLE_STATUS };
    }
    const status = await request(result.resolved, rationale);
    return { permission: result.resolved as string, status };
  },
);

export const checkMultiplePermissions = createAsyncThunk(
  `${SLICE_NAME}/checkMultiplePermissions`,
  async (permissions: PermissionInput[]) => {
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
  },
);

export const requestMultiplePermissions = createAsyncThunk(
  `${SLICE_NAME}/requestMultiplePermissions`,
  async (permissions: PermissionInput[]) => {
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
      const statuses: Record<string, PermissionStatus> = {};
      const toCheck: Permission[] = [];

      for (const perm of config.permissions) {
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

      results.statuses = statuses;
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
