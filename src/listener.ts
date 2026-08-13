import type { Store } from '@reduxjs/toolkit';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { isForegroundSyncTransition } from './app-state';
import { assertThunkMiddleware } from './assert-thunk-middleware';
import { createCoalescedRunner, debounceCallback } from './coalesce';
import { SLICE_NAME } from './constants';
import { selectTrackedConfig } from './selectors';
import { setListening, setTrackedConfig } from './slice';
import { syncPermissions } from './thunks';
import type { PermissionsConfig, PermissionsState } from './types';

type RootState = { [SLICE_NAME]: PermissionsState };

export function startPermissionListener(
  store: Store,
  config: PermissionsConfig,
): () => void {
  assertThunkMiddleware(store);

  const syncOn = config.syncOn ?? 'nonActiveToActive';
  const debounceMs = config.debounceMs ?? 0;

  store.dispatch(
    setTrackedConfig({
      permissions: config.permissions ?? [],
      notifications: config.notifications ?? false,
      locationAccuracy: config.locationAccuracy ?? false,
    }),
  );

  let previousState: AppStateStatus = AppState.currentState;

  const runSync = createCoalescedRunner(async () => {
    const tracked = selectTrackedConfig(store.getState() as RootState);
    await store.dispatch(syncPermissions(tracked) as never);
  });

  const debounced =
    debounceMs > 0 ? debounceCallback(() => void runSync(), debounceMs) : null;

  store.dispatch(setListening(true));
  void runSync();

  const subscription = AppState.addEventListener(
    'change',
    (nextState: AppStateStatus) => {
      if (isForegroundSyncTransition(previousState, nextState, syncOn)) {
        if (debounced) {
          debounced();
        } else {
          void runSync();
        }
      }
      previousState = nextState;
    },
  );

  return () => {
    debounced?.cancel();
    subscription.remove();
    store.dispatch(setListening(false));
  };
}
