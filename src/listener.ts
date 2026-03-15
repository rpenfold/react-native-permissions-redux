import type { Store } from '@reduxjs/toolkit';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { setListening } from './slice';
import { syncPermissions } from './thunks';
import type { PermissionsConfig } from './types';

export function startPermissionListener(
  store: Store,
  config: PermissionsConfig,
): () => void {
  let previousState: AppStateStatus = AppState.currentState;

  store.dispatch(setListening(true));
  store.dispatch(syncPermissions(config) as never);

  const subscription = AppState.addEventListener(
    'change',
    (nextState: AppStateStatus) => {
      if (previousState !== 'active' && nextState === 'active') {
        store.dispatch(syncPermissions(config) as never);
      }
      previousState = nextState;
    },
  );

  return () => {
    subscription.remove();
    store.dispatch(setListening(false));
  };
}
