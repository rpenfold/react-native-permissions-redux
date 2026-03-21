import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { useCallback } from 'react';
import { Platform } from 'react-native';
import type {
  NotificationOption,
  PermissionStatus,
  Rationale,
} from 'react-native-permissions';
import { useDispatch, useSelector } from 'react-redux';
import { SLICE_NAME } from './constants';
import { CrossPlatformPermission } from './cross-platform';
import {
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
      const result = await dispatch(
        requestPermission({ permission, rationale }),
      ).unwrap();
      return result.status;
    },
    [dispatch, permission],
  );

  const doCheck = useCallback(async () => {
    const result = await dispatch(checkPermission(permission)).unwrap();
    return result.status;
  }, [dispatch, permission]);

  return [status, doRequest, doCheck];
}

export function useNotificationPermission(): [
  state: NotificationsState,
  request: (options: NotificationOption[]) => Promise<void>,
  check: () => Promise<void>,
] {
  const dispatch = useDispatch<AppDispatch>();
  const state = useSelector(selectNotifications);

  const doRequest = useCallback(
    async (options: NotificationOption[]) => {
      await dispatch(requestNotifications({ options })).unwrap();
    },
    [dispatch],
  );

  const doCheck = useCallback(async () => {
    await dispatch(checkNotifications()).unwrap();
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
      await dispatch(requestLocationAccuracy({ purposeKey })).unwrap();
    },
    [dispatch],
  );

  const doCheck = useCallback(async () => {
    await dispatch(checkLocationAccuracy()).unwrap();
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
    await dispatch(
      checkMultiplePermissions([
        CrossPlatformPermission.LOCATION_COARSE,
        CrossPlatformPermission.LOCATION_FINE,
      ]),
    ).unwrap();
    if (Platform.OS === 'ios') {
      await dispatch(checkLocationAccuracy()).unwrap();
    }
  }, [dispatch]);

  return [capability, refresh];
}
