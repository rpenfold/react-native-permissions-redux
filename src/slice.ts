import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type {
  LocationAccuracy,
  NotificationSettings,
} from 'react-native-permissions';
import {
  locationAccuracyChecked,
  notificationsChecked,
  statusChecked,
  statusesChecked,
  syncCompleted,
  syncFailed,
} from './actions';
import {
  LOCATION_ACCURACY_ERROR_KEY,
  NOTIFICATIONS_ERROR_KEY,
  SLICE_NAME,
  SYNC_ERROR_KEY,
} from './constants';
import { CrossPlatformPermission } from './cross-platform';
import type {
  PermissionError,
  PermissionInput,
  PermissionsConfig,
  PermissionsState,
} from './types';

function createInitialState(): PermissionsState {
  return {
    statuses: {},
    notifications: {
      status: null,
      settings: null,
    },
    locationAccuracy: {
      accuracy: null,
    },
    listening: false,
    lastSyncedAt: null,
    lastError: null,
    errors: {},
    tracked: {
      permissions: [],
      notifications: false,
      locationAccuracy: false,
    },
  };
}

const initialState: PermissionsState = createInitialState();

function trackedFromConfig(config: PermissionsConfig) {
  return {
    permissions: config.permissions ? [...config.permissions] : [],
    notifications: config.notifications ?? false,
    locationAccuracy: config.locationAccuracy ?? false,
  };
}

function recordError(state: PermissionsState, error: PermissionError): void {
  const keys =
    error.keys && error.keys.length > 0
      ? error.keys
      : [error.key ?? SYNC_ERROR_KEY];
  state.lastError = { message: error.message, key: keys[0] };
  for (const key of keys) {
    state.errors[key] = { message: error.message, key };
  }
}

function clearErrorKey(state: PermissionsState, key: string): void {
  delete state.errors[key];
  if (state.lastError?.key === key) {
    state.lastError = null;
  }
}

function errorKeyFromRejected(action: {
  type: string;
  meta?: { arg?: unknown };
}): string {
  const arg = action.meta?.arg;
  if (typeof arg === 'string') {
    return arg;
  }
  if (arg && typeof arg === 'object' && 'permission' in arg) {
    return String((arg as { permission: unknown }).permission);
  }
  if (action.type.includes('Notifications')) {
    return NOTIFICATIONS_ERROR_KEY;
  }
  if (action.type.includes('LocationAccuracy')) {
    return LOCATION_ACCURACY_ERROR_KEY;
  }
  return SYNC_ERROR_KEY;
}

const permissionsSlice = createSlice({
  name: SLICE_NAME,
  initialState,
  reducers: {
    /** Slice state only. Does not stop the AppState listener or cancel the saga. */
    reset: () => createInitialState(),
    setListening: (state, action: PayloadAction<boolean>) => {
      state.listening = action.payload;
    },
    setTrackedConfig: (state, action: PayloadAction<PermissionsConfig>) => {
      state.tracked = trackedFromConfig(action.payload);
    },
    trackPermissions: (state, action: PayloadAction<PermissionInput[]>) => {
      for (const permission of action.payload) {
        if (!state.tracked.permissions.includes(permission)) {
          state.tracked.permissions.push(permission);
        }
      }
    },
    untrackPermissions: (state, action: PayloadAction<PermissionInput[]>) => {
      const remove = new Set(action.payload);
      state.tracked.permissions = state.tracked.permissions.filter(
        (permission) => !remove.has(permission),
      );
    },
    setNotificationsTracking: (state, action: PayloadAction<boolean>) => {
      state.tracked.notifications = action.payload;
    },
    setLocationAccuracyTracking: (state, action: PayloadAction<boolean>) => {
      state.tracked.locationAccuracy = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(statusChecked, (state, action) => {
        state.statuses[action.payload.permission] = action.payload.status;
        clearErrorKey(state, action.payload.permission);
        if (action.payload.notifications) {
          state.notifications.status = action.payload.notifications.status;
          state.notifications.settings = action.payload.notifications
            .settings as NotificationSettings;
          clearErrorKey(state, NOTIFICATIONS_ERROR_KEY);
        } else if (
          action.payload.permission === CrossPlatformPermission.NOTIFICATIONS
        ) {
          state.notifications.status = action.payload.status;
          clearErrorKey(state, NOTIFICATIONS_ERROR_KEY);
        }
      })
      .addCase(statusesChecked, (state, action) => {
        Object.assign(state.statuses, action.payload);
        for (const key of Object.keys(action.payload)) {
          clearErrorKey(state, key);
        }
        const notificationStatus =
          action.payload[CrossPlatformPermission.NOTIFICATIONS];
        if (notificationStatus) {
          state.notifications.status = notificationStatus;
          clearErrorKey(state, NOTIFICATIONS_ERROR_KEY);
        }
      })
      .addCase(notificationsChecked, (state, action) => {
        state.notifications.status = action.payload.status;
        state.notifications.settings = action.payload
          .settings as NotificationSettings;
        state.statuses[CrossPlatformPermission.NOTIFICATIONS] =
          action.payload.status;
        clearErrorKey(state, NOTIFICATIONS_ERROR_KEY);
      })
      .addCase(locationAccuracyChecked, (state, action) => {
        state.locationAccuracy.accuracy = action.payload as LocationAccuracy;
        clearErrorKey(state, LOCATION_ACCURACY_ERROR_KEY);
      })
      .addCase(syncCompleted, (state, action) => {
        if (action.payload.statuses) {
          Object.assign(state.statuses, action.payload.statuses);
          for (const key of Object.keys(action.payload.statuses)) {
            clearErrorKey(state, key);
          }
          clearErrorKey(state, SYNC_ERROR_KEY);
        }
        if (action.payload.notifications) {
          state.notifications.status = action.payload.notifications.status;
          state.notifications.settings = action.payload.notifications
            .settings as NotificationSettings;
          state.statuses[CrossPlatformPermission.NOTIFICATIONS] =
            action.payload.notifications.status;
          clearErrorKey(state, NOTIFICATIONS_ERROR_KEY);
        } else if (
          action.payload.statuses?.[CrossPlatformPermission.NOTIFICATIONS]
        ) {
          state.notifications.status =
            action.payload.statuses[CrossPlatformPermission.NOTIFICATIONS];
          clearErrorKey(state, NOTIFICATIONS_ERROR_KEY);
        }
        if (action.payload.locationAccuracy) {
          state.locationAccuracy.accuracy = action.payload
            .locationAccuracy as LocationAccuracy;
          clearErrorKey(state, LOCATION_ACCURACY_ERROR_KEY);
        }
        state.lastSyncedAt = action.payload.lastSyncedAt;
      })
      .addCase(syncFailed, (state, action) => {
        recordError(state, action.payload);
      })
      .addMatcher(
        (action: { type: string }) =>
          action.type.startsWith(`${SLICE_NAME}/`) &&
          action.type.endsWith('/rejected'),
        (
          state,
          action: {
            type: string;
            error?: { message?: string };
            meta?: { arg?: unknown };
          },
        ) => {
          const key = errorKeyFromRejected(action);
          recordError(state, {
            message: action.error?.message ?? 'Permission request failed',
            key,
          });
        },
      );
  },
});

export {
  statusChecked,
  statusesChecked,
  notificationsChecked,
  locationAccuracyChecked,
  syncCompleted,
  syncFailed,
} from './actions';
export const {
  reset,
  setListening,
  setTrackedConfig,
  trackPermissions,
  untrackPermissions,
  setNotificationsTracking,
  setLocationAccuracyTracking,
} = permissionsSlice.actions;
export const permissionsReducer = permissionsSlice.reducer;
