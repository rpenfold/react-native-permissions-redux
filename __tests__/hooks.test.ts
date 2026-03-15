import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react-native';
import React from 'react';
import { Provider } from 'react-redux';
import { SLICE_NAME } from '../src/constants';
import {
  useLocationAccuracy,
  useNotificationPermission,
  usePermission,
} from '../src/hooks';
import { permissionsReducer } from '../src/slice';

const RNP = jest.requireMock('react-native-permissions');

function createStore() {
  return configureStore({
    reducer: { [SLICE_NAME]: permissionsReducer },
  });
}

function createWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(Provider, { store, children });
  };
}

describe('usePermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null status initially', () => {
    const store = createStore();
    const { result } = renderHook(
      () => usePermission('ios.permission.CAMERA' as never),
      { wrapper: createWrapper(store) },
    );

    const [status] = result.current;
    expect(status).toBeNull();
  });

  it('check updates status', async () => {
    RNP.check.mockResolvedValue('granted');
    const store = createStore();
    const { result } = renderHook(
      () => usePermission('ios.permission.CAMERA' as never),
      { wrapper: createWrapper(store) },
    );

    await act(async () => {
      await result.current[2]();
    });

    expect(result.current[0]).toBe('granted');
  });

  it('request updates status', async () => {
    RNP.request.mockResolvedValue('granted');
    const store = createStore();
    const { result } = renderHook(
      () => usePermission('ios.permission.CAMERA' as never),
      { wrapper: createWrapper(store) },
    );

    await act(async () => {
      await result.current[1]();
    });

    expect(result.current[0]).toBe('granted');
  });
});

describe('useNotificationPermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns initial notification state', () => {
    const store = createStore();
    const { result } = renderHook(() => useNotificationPermission(), {
      wrapper: createWrapper(store),
    });

    const [state] = result.current;
    expect(state.status).toBeNull();
    expect(state.settings).toBeNull();
  });

  it('check updates notification state', async () => {
    RNP.checkNotifications.mockResolvedValue({
      status: 'granted',
      settings: { alert: true },
    });
    const store = createStore();
    const { result } = renderHook(() => useNotificationPermission(), {
      wrapper: createWrapper(store),
    });

    await act(async () => {
      await result.current[2]();
    });

    expect(result.current[0].status).toBe('granted');
  });
});

describe('useLocationAccuracy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns initial location accuracy state', () => {
    const store = createStore();
    const { result } = renderHook(() => useLocationAccuracy(), {
      wrapper: createWrapper(store),
    });

    const [state] = result.current;
    expect(state.accuracy).toBeNull();
  });

  it('check updates location accuracy', async () => {
    RNP.checkLocationAccuracy.mockResolvedValue('full');
    const store = createStore();
    const { result } = renderHook(() => useLocationAccuracy(), {
      wrapper: createWrapper(store),
    });

    await act(async () => {
      await result.current[2]();
    });

    expect(result.current[0].accuracy).toBe('full');
  });
});
