import { configureStore } from '@reduxjs/toolkit';
import { runSaga } from 'redux-saga';
import { SLICE_NAME } from '../src/constants';
import { permissionForegroundSyncSaga } from '../src/sagas';
import { permissionsReducer } from '../src/slice';

const RNP = jest.requireMock('react-native-permissions');

function createStore() {
  return configureStore({
    reducer: { [SLICE_NAME]: permissionsReducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ thunk: false, serializableCheck: false }),
  });
}

describe('permissionForegroundSyncSaga', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    RNP.checkMultiple.mockResolvedValue({
      'ios.permission.CAMERA': 'granted',
    });
  });

  it('syncs permissions and updates state without thunk middleware', async () => {
    const store = createStore();

    const task = runSaga(
      {
        dispatch: store.dispatch,
        getState: store.getState,
      },
      permissionForegroundSyncSaga,
      { permissions: ['ios.permission.CAMERA'] as never },
    );

    await new Promise((r) => setTimeout(r, 0));

    expect(RNP.checkMultiple).toHaveBeenCalled();
    expect(store.getState()[SLICE_NAME].statuses['ios.permission.CAMERA']).toBe(
      'granted',
    );
    expect(store.getState()[SLICE_NAME].listening).toBe(true);

    task.cancel();
    await task.toPromise();

    expect(store.getState()[SLICE_NAME].listening).toBe(false);
  });
});
