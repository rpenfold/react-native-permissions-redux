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
import { SLICE_NAME } from './constants';
import type {
  PermissionInput,
  PermissionsConfig,
  PermissionsState,
} from './types';

const initialState: PermissionsState = {
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
  tracked: {
    permissions: [],
    notifications: false,
    locationAccuracy: false,
  },
};

function trackedFromConfig(config: PermissionsConfig) {
  return {
    permissions: config.permissions ? [...config.permissions] : [],
    notifications: config.notifications ?? false,
    locationAccuracy: config.locationAccuracy ?? false,
  };
}

const permissionsSlice = createSlice({
  name: SLICE_NAME,
  initialState,
  reducers: {
    reset: () => initialState,
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
        state.lastError = null;
      })
      .addCase(statusesChecked, (state, action) => {
        Object.assign(state.statuses, action.payload);
        state.lastError = null;
      })
      .addCase(notificationsChecked, (state, action) => {
        state.notifications.status = action.payload.status;
        state.notifications.settings = action.payload
          .settings as NotificationSettings;
        state.lastError = null;
      })
      .addCase(locationAccuracyChecked, (state, action) => {
        state.locationAccuracy.accuracy = action.payload as LocationAccuracy;
        state.lastError = null;
      })
      .addCase(syncCompleted, (state, action) => {
        if (action.payload.statuses) {
          Object.assign(state.statuses, action.payload.statuses);
        }
        if (action.payload.notifications) {
          state.notifications.status = action.payload.notifications.status;
          state.notifications.settings = action.payload.notifications
            .settings as NotificationSettings;
        }
        if (action.payload.locationAccuracy) {
          state.locationAccuracy.accuracy = action.payload
            .locationAccuracy as LocationAccuracy;
        }
        state.lastSyncedAt = action.payload.lastSyncedAt;
        state.lastError = null;
      })
      .addCase(syncFailed, (state, action) => {
        state.lastError = action.payload;
      })
      .addMatcher(
        (action: { type: string }) =>
          action.type.startsWith(`${SLICE_NAME}/`) &&
          action.type.endsWith('/rejected'),
        (state, action: { error?: { message?: string } }) => {
          state.lastError = {
            message: action.error?.message ?? 'Permission request failed',
          };
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
