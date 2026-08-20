import type { Store } from '@reduxjs/toolkit';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { isForegroundSyncTransition } from './app-state';
import { assertThunkMiddleware } from './assert-thunk-middleware';
import { createCoalescedRunner, debounceCallback } from './coalesce';
import { SLICE_NAME } from './constants';
import { selectTrackedConfig } from './selectors';
import { setListening, setTrackedConfig } from './slice';
import { invalidateInFlightSyncs, syncPermissions } from './thunks';
import { trackedSetGrew } from './tracked';
import type { PermissionsConfig, PermissionsState } from './types';

type RootState = { [SLICE_NAME]: PermissionsState };

let activeStop: (() => void) | null = null;

export function startPermissionListener(
  store: Store,
  config: PermissionsConfig,
): () => void {
  assertThunkMiddleware(store);

  if (activeStop) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[react-native-permissions-redux] startPermissionListener called while already listening; restarting.',
      );
    }
    activeStop();
  }

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
  let previousTracked = selectTrackedConfig(store.getState() as RootState);

  const runSync = createCoalescedRunner(async () => {
    const tracked = selectTrackedConfig(store.getState() as RootState);
    await store.dispatch(syncPermissions(tracked) as never);
  });

  const debounced =
    debounceMs > 0 ? debounceCallback(() => void runSync(), debounceMs) : null;

  store.dispatch(setListening(true));
  void runSync();

  const unsubscribeTracked = store.subscribe(() => {
    const nextTracked = selectTrackedConfig(store.getState() as RootState);
    if (trackedSetGrew(previousTracked, nextTracked)) {
      previousTracked = nextTracked;
      void runSync();
      return;
    }
    previousTracked = nextTracked;
  });

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

  const stop = () => {
    debounced?.cancel();
    unsubscribeTracked();
    subscription.remove();
    invalidateInFlightSyncs();
    store.dispatch(setListening(false));
    if (activeStop === stop) {
      activeStop = null;
    }
  };

  activeStop = stop;
  return stop;
}
