import { configureStore, createReducer } from '@reduxjs/toolkit';
import {
  THUNK_MIDDLEWARE_ERROR,
  assertThunkMiddleware,
} from '../src/assert-thunk-middleware';
import { SLICE_NAME } from '../src/constants';
import { startPermissionListener } from '../src/listener';
import { permissionsReducer } from '../src/slice';

describe('assertThunkMiddleware', () => {
  it('throws when thunk middleware is missing', () => {
    const store = configureStore({
      reducer: { dummy: createReducer({}, () => ({})) },
      middleware: (gDM) => gDM({ thunk: false }),
    });

    expect(() => assertThunkMiddleware(store)).toThrow(THUNK_MIDDLEWARE_ERROR);
  });

  it('passes when thunk middleware is present', () => {
    const store = configureStore({
      reducer: { [SLICE_NAME]: permissionsReducer },
    });

    expect(() => assertThunkMiddleware(store)).not.toThrow();
  });
});

describe('startPermissionListener', () => {
  it('throws when thunk middleware is missing', () => {
    const store = configureStore({
      reducer: { [SLICE_NAME]: permissionsReducer },
      middleware: (gDM) => gDM({ thunk: false }),
    });

    expect(() => startPermissionListener(store, {})).toThrow(
      THUNK_MIDDLEWARE_ERROR,
    );
  });
});
