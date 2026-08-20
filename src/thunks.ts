import { createAsyncThunk } from '@reduxjs/toolkit';
import type { Permission } from 'react-native-permissions';
import {
  locationAccuracyChecked,
  notificationsChecked,
  statusChecked,
  statusesChecked,
  syncCompleted,
  syncFailed,
} from './actions';
import { SLICE_NAME } from './constants';
import type { CrossPlatformPermission } from './cross-platform';
import {
  checkLocationAccuracyCore,
  checkMultiplePermissionsCore,
  checkNotificationsCore,
  checkPermissionCore,
  requestLocationAccuracyCore,
  requestMultiplePermissionsCore,
  requestNotificationsCore,
  requestPermissionCore,
  syncPermissionsCore,
} from './permissions-core';
import type {
  PermissionsConfig,
  RequestLocationAccuracyPayload,
  RequestMultiplePermissionsArg,
  RequestNotificationsPayload,
  RequestPermissionPayload,
} from './types';

type PermissionInput = Permission | CrossPlatformPermission;

export const checkPermission = createAsyncThunk(
  `${SLICE_NAME}/checkPermission`,
  async (permission: PermissionInput, { dispatch }) => {
    const payload = await checkPermissionCore(permission);
    dispatch(statusChecked(payload));
    return payload;
  },
);

export const requestPermission = createAsyncThunk(
  `${SLICE_NAME}/requestPermission`,
  async (arg: RequestPermissionPayload, { dispatch }) => {
    const payload = await requestPermissionCore(arg);
    dispatch(statusChecked(payload));
    return payload;
  },
);

export const checkMultiplePermissions = createAsyncThunk(
  `${SLICE_NAME}/checkMultiplePermissions`,
  async (permissions: PermissionInput[], { dispatch }) => {
    const payload = await checkMultiplePermissionsCore(permissions);
    dispatch(statusesChecked(payload.statuses));
    if (payload.notifications) {
      dispatch(notificationsChecked(payload.notifications));
    }
    if (payload.error) {
      dispatch(syncFailed(payload.error));
    }
    return payload.statuses;
  },
);

export const requestMultiplePermissions = createAsyncThunk(
  `${SLICE_NAME}/requestMultiplePermissions`,
  async (arg: RequestMultiplePermissionsArg, { dispatch }) => {
    const permissions = Array.isArray(arg) ? arg : arg.permissions;
    const payload = await requestMultiplePermissionsCore(
      permissions,
      Array.isArray(arg)
        ? undefined
        : { notificationsRationale: arg.notificationsRationale },
    );
    dispatch(statusesChecked(payload.statuses));
    if (payload.notifications) {
      dispatch(notificationsChecked(payload.notifications));
    }
    if (payload.error) {
      dispatch(syncFailed(payload.error));
    }
    return payload.statuses;
  },
);

export const checkNotifications = createAsyncThunk(
  `${SLICE_NAME}/checkNotifications`,
  async (_, { dispatch }) => {
    const payload = await checkNotificationsCore();
    dispatch(notificationsChecked(payload));
    return payload;
  },
);

export const requestNotifications = createAsyncThunk(
  `${SLICE_NAME}/requestNotifications`,
  async (arg: RequestNotificationsPayload, { dispatch }) => {
    const payload = await requestNotificationsCore(arg);
    dispatch(notificationsChecked(payload));
    return payload;
  },
);

export const checkLocationAccuracy = createAsyncThunk(
  `${SLICE_NAME}/checkLocationAccuracy`,
  async (_, { dispatch }) => {
    const payload = await checkLocationAccuracyCore();
    dispatch(locationAccuracyChecked(payload));
    return payload;
  },
);

export const requestLocationAccuracy = createAsyncThunk(
  `${SLICE_NAME}/requestLocationAccuracy`,
  async (arg: RequestLocationAccuracyPayload, { dispatch }) => {
    const payload = await requestLocationAccuracyCore(arg);
    dispatch(locationAccuracyChecked(payload));
    return payload;
  },
);

/** Latest in-flight sync generation; older completions must not write state. */
let syncGeneration = 0;

/** Call from listener teardown so a still-running sync cannot write after stop. */
export function invalidateInFlightSyncs(): void {
  syncGeneration += 1;
}

export const syncPermissions = createAsyncThunk(
  `${SLICE_NAME}/syncPermissions`,
  async (config: PermissionsConfig, { dispatch }) => {
    const generation = ++syncGeneration;
    const payload = await syncPermissionsCore(config);
    if (generation !== syncGeneration) {
      return payload;
    }
    const hasData = Boolean(
      payload.statuses || payload.notifications || payload.locationAccuracy,
    );
    if (hasData) {
      dispatch(syncCompleted(payload));
    }
    if (payload.error) {
      dispatch(syncFailed(payload.error));
    }
    return payload;
  },
);
