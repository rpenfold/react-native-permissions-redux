import { createSlice } from '@reduxjs/toolkit';
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
} from './actions';
import { SLICE_NAME } from './constants';
import type { PermissionsState } from './types';

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
};

const permissionsSlice = createSlice({
  name: SLICE_NAME,
  initialState,
  reducers: {
    reset: () => initialState,
    setListening: (state, action: { payload: boolean }) => {
      state.listening = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(statusChecked, (state, action) => {
        state.statuses[action.payload.permission] = action.payload.status;
      })
      .addCase(statusesChecked, (state, action) => {
        Object.assign(state.statuses, action.payload);
      })
      .addCase(notificationsChecked, (state, action) => {
        state.notifications.status = action.payload.status;
        state.notifications.settings = action.payload
          .settings as NotificationSettings;
      })
      .addCase(locationAccuracyChecked, (state, action) => {
        state.locationAccuracy.accuracy = action.payload as LocationAccuracy;
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
        state.lastSyncedAt = new Date().toISOString();
      });
  },
});

export {
  statusChecked,
  statusesChecked,
  notificationsChecked,
  locationAccuracyChecked,
  syncCompleted,
} from './actions';
export const { reset, setListening } = permissionsSlice.actions;
export const permissionsReducer = permissionsSlice.reducer;
