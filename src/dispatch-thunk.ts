import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { syncFailed } from './actions';
import { THUNK_MIDDLEWARE_ERROR } from './assert-thunk-middleware';
import { errorMessage } from './error';

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

/**
 * Runs a thunk when middleware is present; otherwise runs `fallback` and
 * dispatches `onFallback` so saga-only stores still update the slice.
 */
function isMissingThunkError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message === THUNK_MIDDLEWARE_ERROR ||
      error.message.includes('Actions must be plain objects'))
  );
}

export async function dispatchThunkOrCore<T>(
  dispatch: Dispatch,
  thunk: Parameters<Dispatch>[0],
  fallback: () => Promise<T>,
  onFallback: (payload: T) => unknown,
  errorKey?: string,
): Promise<T> {
  try {
    const result = dispatch(thunk);
    if (
      result === thunk ||
      (typeof result === 'function' && result === thunk)
    ) {
      throw new Error(THUNK_MIDDLEWARE_ERROR);
    }
    return await (result as { unwrap: () => Promise<T> }).unwrap();
  } catch (error) {
    if (!isMissingThunkError(error)) {
      throw error;
    }
  }
  try {
    const payload = await fallback();
    dispatch(onFallback(payload) as never);
    return payload;
  } catch (error) {
    dispatch(
      syncFailed({
        message: errorMessage(error),
        key: errorKey,
      }) as never,
    );
    throw error;
  }
}
