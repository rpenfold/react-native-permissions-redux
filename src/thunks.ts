import { createAsyncThunk } from '@reduxjs/toolkit';
import type { Permission } from 'react-native-permissions';
import {
  locationAccuracyChecked,
  notificationsChecked,
  statusChecked,
  statusesChecked,
  syncCompleted,
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
    dispatch(statusesChecked(payload));
    return payload;
  },
);

export const requestMultiplePermissions = createAsyncThunk(
  `${SLICE_NAME}/requestMultiplePermissions`,
  async (permissions: PermissionInput[], { dispatch }) => {
    const payload = await requestMultiplePermissionsCore(permissions);
    dispatch(statusesChecked(payload));
    return payload;
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

export const syncPermissions = createAsyncThunk(
  `${SLICE_NAME}/syncPermissions`,
  async (config: PermissionsConfig, { dispatch }) => {
    const payload = await syncPermissionsCore(config);
    dispatch(syncCompleted(payload));
    return payload;
  },
);
