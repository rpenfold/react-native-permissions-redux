import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { buffers, eventChannel } from 'redux-saga';
import { call, delay, put, race, select, take } from 'redux-saga/effects';
import { syncCompleted, syncFailed } from './actions';
import { isForegroundSyncTransition } from './app-state';
import { errorMessage } from './error';
import { syncPermissionsCore } from './permissions-core';
import { selectTrackedConfig } from './selectors';
import { setListening, setTrackedConfig } from './slice';
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
    const hasData = Boolean(
      result.statuses || result.notifications || result.locationAccuracy,
    );
    if (hasData || !result.error) {
      yield put(syncCompleted(result));
    }
    if (result.error) {
      yield put(syncFailed(result.error));
    }
  } catch (error) {
    yield put(syncFailed({ message: errorMessage(error) }));
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
  const channel: ReturnType<typeof createAppStateForegroundChannel> =
    yield call(createAppStateForegroundChannel, syncOn);
  try {
    yield call(runForegroundSync);
    while (true) {
      yield take(channel);
      if (debounceMs > 0) {
        while (true) {
          const raced: { next?: true } = yield race({
            next: take(channel),
            timeout: delay(debounceMs),
          });
          if (!raced.next) {
            break;
          }
        }
      }
      yield call(runForegroundSync);
    }
  } finally {
    channel.close();
    yield put(setListening(false));
  }
}
