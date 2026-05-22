import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { THUNK_MIDDLEWARE_ERROR } from './assert-thunk-middleware';

type Dispatch = ThunkDispatch<unknown, unknown, UnknownAction>;

export async function dispatchThunk<T>(
  dispatch: Dispatch,
  thunk: Parameters<Dispatch>[0],
): Promise<T> {
  const result = dispatch(thunk);
  if (result === thunk || (typeof result === 'function' && result === thunk)) {
    throw new Error(THUNK_MIDDLEWARE_ERROR);
  }
  return (result as { unwrap: () => Promise<T> }).unwrap();
}
