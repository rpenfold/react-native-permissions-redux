import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { useCallback } from 'react';
import { Platform } from 'react-native';
import type {
  NotificationOption,
  PermissionStatus,
  Rationale,
} from 'react-native-permissions';
import { useDispatch, useSelector } from 'react-redux';
import {
  locationAccuracyChecked,
  notificationsChecked,
  statusChecked,
  statusesChecked,
  syncFailed,
} from './actions';
import {
  LOCATION_ACCURACY_ERROR_KEY,
  NOTIFICATIONS_ERROR_KEY,
  SLICE_NAME,
} from './constants';
import { CrossPlatformPermission } from './cross-platform';
import { dispatchThunkOrCore } from './dispatch-thunk';
import {
  checkLocationAccuracyCore,
  checkMultiplePermissionsCore,
  checkNotificationsCore,
  checkPermissionCore,
  requestLocationAccuracyCore,
  requestNotificationsCore,
  requestPermissionCore,
} from './permissions-core';
import {
  permissionStatusKey,
  selectLocationAccuracy,
  selectLocationForegroundCapability,
  selectNotifications,
  selectPermissionStatus,
} from './selectors';
import {
  checkLocationAccuracy,
  checkMultiplePermissions,
  checkNotifications,
  checkPermission,
  requestLocationAccuracy,
  requestNotifications,
  requestPermission,
} from './thunks';
import type {
  LocationAccuracyState,
  LocationForegroundCapability,
  NotificationsState,
  PermissionInput,
  PermissionsState,
} from './types';

type RootState = { [SLICE_NAME]: PermissionsState };
type AppDispatch = ThunkDispatch<RootState, unknown, UnknownAction>;

export function usePermission(
  permission: PermissionInput,
): [
  status: PermissionStatus | null,
  request: (rationale?: Rationale) => Promise<PermissionStatus>,
  check: () => Promise<PermissionStatus>,
] {
  const dispatch = useDispatch<AppDispatch>();
  const status = useSelector(selectPermissionStatus(permission));

  const doRequest = useCallback(
    async (rationale?: Rationale) => {
      const result = await dispatchThunkOrCore(
        dispatch,
        requestPermission({ permission, rationale }),
        () => requestPermissionCore({ permission, rationale }),
        statusChecked,
        permissionStatusKey(permission),
      );
      return result.status;
    },
    [dispatch, permission],
  );

  const doCheck = useCallback(async () => {
    const result = await dispatchThunkOrCore(
      dispatch,
      checkPermission(permission),
      () => checkPermissionCore(permission),
      statusChecked,
      permissionStatusKey(permission),
    );
    return result.status;
  }, [dispatch, permission]);

  return [status, doRequest, doCheck];
}

export function useNotificationPermission(): [
  state: NotificationsState,
  request: (
    options: NotificationOption[],
    rationale?: Rationale,
  ) => Promise<void>,
  check: () => Promise<void>,
] {
  const dispatch = useDispatch<AppDispatch>();
  const state = useSelector(selectNotifications);

  const doRequest = useCallback(
    async (options: NotificationOption[], rationale?: Rationale) => {
      await dispatchThunkOrCore(
        dispatch,
        requestNotifications({ options, rationale }),
        () => requestNotificationsCore({ options, rationale }),
        notificationsChecked,
        NOTIFICATIONS_ERROR_KEY,
      );
    },
    [dispatch],
  );

  const doCheck = useCallback(async () => {
    await dispatchThunkOrCore(
      dispatch,
      checkNotifications(),
      checkNotificationsCore,
      notificationsChecked,
      NOTIFICATIONS_ERROR_KEY,
    );
  }, [dispatch]);

  return [state, doRequest, doCheck];
}

export function useLocationAccuracy(): [
  state: LocationAccuracyState,
  request: (purposeKey: string) => Promise<void>,
  check: () => Promise<void>,
] {
  const dispatch = useDispatch<AppDispatch>();
  const state = useSelector(selectLocationAccuracy);

  const doRequest = useCallback(
    async (purposeKey: string) => {
      await dispatchThunkOrCore(
        dispatch,
        requestLocationAccuracy({ purposeKey }),
        () => requestLocationAccuracyCore({ purposeKey }),
        locationAccuracyChecked,
        LOCATION_ACCURACY_ERROR_KEY,
      );
    },
    [dispatch],
  );

  const doCheck = useCallback(async () => {
    await dispatchThunkOrCore(
      dispatch,
      checkLocationAccuracy(),
      checkLocationAccuracyCore,
      locationAccuracyChecked,
      LOCATION_ACCURACY_ERROR_KEY,
    );
  }, [dispatch]);

  return [state, doRequest, doCheck];
}

export function useLocationForegroundCapability(): [
  LocationForegroundCapability,
  refresh: () => Promise<void>,
] {
  const dispatch = useDispatch<AppDispatch>();
  const capability = useSelector(selectLocationForegroundCapability);

  const refresh = useCallback(async () => {
    await dispatchThunkOrCore(
      dispatch,
      checkMultiplePermissions([
        CrossPlatformPermission.LOCATION_COARSE,
        CrossPlatformPermission.LOCATION_FINE,
      ]),
      async () => {
        const result = await checkMultiplePermissionsCore([
          CrossPlatformPermission.LOCATION_COARSE,
          CrossPlatformPermission.LOCATION_FINE,
        ]);
        if (result.error) {
          dispatch(syncFailed(result.error));
        }
        return result.statuses;
      },
      statusesChecked,
    );
    if (Platform.OS === 'ios') {
      await dispatchThunkOrCore(
        dispatch,
        checkLocationAccuracy(),
        checkLocationAccuracyCore,
        locationAccuracyChecked,
      );
    }
  }, [dispatch]);

  return [capability, refresh];
}
