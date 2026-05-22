import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { eventChannel } from 'redux-saga';
import { call, put, take } from 'redux-saga/effects';
import { syncCompleted } from './actions';
import { syncPermissionsCore } from './permissions-core';
import { setListening } from './slice';
import type { PermissionsConfig } from './types';

function createAppStateForegroundChannel() {
  return eventChannel<true>((emit) => {
    let previousState: AppStateStatus = AppState.currentState;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (previousState !== 'active' && nextState === 'active') {
        emit(true);
      }
      previousState = nextState;
    });
    return () => subscription.remove();
  });
}

function* runForegroundSync(config: PermissionsConfig) {
  const result: Awaited<ReturnType<typeof syncPermissionsCore>> = yield call(
    syncPermissionsCore,
    config,
  );
  yield put(syncCompleted(result));
}

/**
 * Fork in your root saga instead of `startPermissionListener` when using redux-saga
 * without thunk middleware. Re-checks configured permissions on mount and when the
 * app returns to the foreground.
 */
export function* permissionForegroundSyncSaga(
  config: PermissionsConfig,
): Generator {
  yield put(setListening(true));
  const channel: ReturnType<typeof createAppStateForegroundChannel> =
    yield call(createAppStateForegroundChannel);
  try {
    yield call(runForegroundSync, config);
    while (true) {
      yield take(channel);
      yield call(runForegroundSync, config);
    }
  } finally {
    channel.close();
    yield put(setListening(false));
  }
}
