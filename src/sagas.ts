import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { buffers, channel, eventChannel } from 'redux-saga';
import type { Channel } from 'redux-saga';
import { call, delay, fork, put, race, select, take } from 'redux-saga/effects';
import { syncCompleted, syncFailed } from './actions';
import { isForegroundSyncTransition } from './app-state';
import { errorMessage } from './error';
import { syncPermissionsCore } from './permissions-core';
import { selectListening, selectTrackedConfig } from './selectors';
import {
  setListening,
  setLocationAccuracyTracking,
  setNotificationsTracking,
  setTrackedConfig,
  trackPermissions,
} from './slice';
import { trackedSetGrew } from './tracked';
import type { ForegroundSyncOn, PermissionsConfig } from './types';

function createAppStateForegroundChannel(syncOn: ForegroundSyncOn) {
  return eventChannel<true>((emit) => {
    let previousState: AppStateStatus = AppState.currentState;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (isForegroundSyncTransition(previousState, nextState, syncOn)) {
        emit(true);
      }
      previousState = nextState;
    });
    return () => subscription.remove();
  }, buffers.sliding(1));
}

function* runForegroundSync() {
  try {
    const config: PermissionsConfig = yield select(selectTrackedConfig);
    const result: Awaited<ReturnType<typeof syncPermissionsCore>> = yield call(
      syncPermissionsCore,
      config,
    );
    const listening: boolean = yield select(selectListening);
    if (!listening) {
      return;
    }
    const hasData = Boolean(
      result.statuses || result.notifications || result.locationAccuracy,
    );
    if (hasData) {
      yield put(syncCompleted(result));
    }
    if (result.error) {
      yield put(syncFailed(result.error));
    }
  } catch (error) {
    const listening: boolean = yield select(selectListening);
    if (!listening) {
      return;
    }
    yield put(syncFailed({ message: errorMessage(error) }));
  }
}

function* syncWorker(requests: Channel<true>) {
  while (true) {
    yield take(requests);
    yield call(runForegroundSync);
  }
}

function* watchTrackedChanges(requests: Channel<true>) {
  let previous: PermissionsConfig = yield select(selectTrackedConfig);
  while (true) {
    yield take([
      trackPermissions.type,
      setNotificationsTracking.type,
      setLocationAccuracyTracking.type,
      setTrackedConfig.type,
    ]);
    const next: PermissionsConfig = yield select(selectTrackedConfig);
    if (trackedSetGrew(previous, next)) {
      previous = next;
      yield put(requests, true);
    } else {
      previous = next;
    }
  }
}

/**
 * Fork in your root saga instead of `startPermissionListener` when using redux-saga
 * without thunk middleware. Re-checks configured permissions on mount and when the
 * app returns to the foreground. Survives transient native check failures.
 */
export function* permissionForegroundSyncSaga(
  config: PermissionsConfig,
): Generator {
  const alreadyListening: boolean = yield select(selectListening);
  if (alreadyListening) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[react-native-permissions-redux] permissionForegroundSyncSaga forked while already listening; ignoring.',
      );
    }
    return;
  }

  yield put(
    setTrackedConfig({
      permissions: config.permissions ?? [],
      notifications: config.notifications ?? false,
      locationAccuracy: config.locationAccuracy ?? false,
    }),
  );
  yield put(setListening(true));
  const syncOn = config.syncOn ?? 'nonActiveToActive';
  const debounceMs = config.debounceMs ?? 0;
  const appChannel: ReturnType<typeof createAppStateForegroundChannel> =
    yield call(createAppStateForegroundChannel, syncOn);
  const syncRequests: Channel<true> = yield call(() =>
    channel<true>(buffers.sliding(1)),
  );
  try {
    yield fork(syncWorker, syncRequests);
    yield fork(watchTrackedChanges, syncRequests);
    yield put(syncRequests, true);
    while (true) {
      yield take(appChannel);
      if (debounceMs > 0) {
        while (true) {
          const raced: { next?: true } = yield race({
            next: take(appChannel),
            timeout: delay(debounceMs),
          });
          if (!raced.next) {
            break;
          }
        }
      }
      yield put(syncRequests, true);
    }
  } finally {
    appChannel.close();
    syncRequests.close();
    yield put(setListening(false));
  }
}
