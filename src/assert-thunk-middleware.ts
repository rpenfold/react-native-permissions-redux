import type { Store } from '@reduxjs/toolkit';

export const THUNK_MIDDLEWARE_ERROR =
  'react-native-permissions-redux requires Redux thunk middleware. ' +
  'With Redux Toolkit, use configureStore({ middleware: (gDM) => gDM() }) or include ...getDefaultMiddleware(). ' +
  'With a custom store, add redux-thunk to your middleware chain. ' +
  'For foreground sync only (no hooks), use permissionForegroundSyncSaga instead of startPermissionListener.';

export function assertThunkMiddleware(store: Store): void {
  let invoked = false;
  try {
    store.dispatch((() => {
      invoked = true;
    }) as never);
  } catch {
    if (!invoked) {
      throw new Error(THUNK_MIDDLEWARE_ERROR);
    }
    return;
  }
  if (!invoked) {
    throw new Error(THUNK_MIDDLEWARE_ERROR);
  }
}
