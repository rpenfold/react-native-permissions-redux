# react-native-permissions-redux

[![CI](https://github.com/rpenfold/react-native-permissions-redux/actions/workflows/ci.yml/badge.svg)](https://github.com/rpenfold/react-native-permissions-redux/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/react-native-permissions-redux.svg)](https://www.npmjs.com/package/react-native-permissions-redux)
[![bundle size](https://img.shields.io/bundlephobia/minzip/react-native-permissions-redux)](https://bundlephobia.com/package/react-native-permissions-redux)
[![license](https://img.shields.io/npm/l/react-native-permissions-redux.svg)](./LICENSE)

**Reactive permission state for React Native.** A lightweight Redux Toolkit integration for [react-native-permissions](https://github.com/zoontek/react-native-permissions) that keeps your store in sync with the OS — automatically.

---

## The Problem

`react-native-permissions` is the go-to library for checking and requesting permissions in React Native, but it's entirely imperative. There are no event listeners, no subscriptions, and no way to know when a user flips a toggle in Settings and comes back to your app.

This means you end up writing the same boilerplate in every project:
- Manually re-checking permissions in `useEffect` + `AppState` listeners
- Threading permission state through component props or context
- Forgetting to re-sync after the user returns from Settings
- Duplicating check/request logic across screens
- Dealing with `PERMISSIONS.IOS.CAMERA` vs `PERMISSIONS.ANDROID.CAMERA` everywhere

## The Solution

`react-native-permissions-redux` gives you **subscribable, always-fresh permission state** in three lines of setup:

```ts
// 1. Add the reducer
reducer: { [SLICE_NAME]: permissionsReducer }

// 2. Start listening
startPermissionListener(store, { permissions: [...], notifications: true })

// 3. Use it anywhere
const [status, request] = usePermission(CrossPlatformPermission.CAMERA)
```

When your app returns to the foreground, all tracked permissions are automatically re-checked. Your components re-render. No boilerplate.

---

## Features

- **Automatic foreground sync** — Uses `AppState` to re-check permissions whenever your app becomes active. Your users toggle a permission in Settings, come back, and everything Just Works.
- **Atomic state updates** — Every `check` and `request` call updates Redux state on completion. No manual dispatching, no stale reads.
- **Three purpose-built hooks** — `usePermission`, `useNotificationPermission`, and `useLocationAccuracy` return `[state, request, check]` tuples, similar to `useState`. Clean and familiar.
- **Cross-platform permission abstraction** — Use `CrossPlatformPermission.CAMERA` instead of `PERMISSIONS.IOS.CAMERA` / `PERMISSIONS.ANDROID.CAMERA`. Write once, resolves to the right native permission at runtime. Falls back to `'unavailable'` when there's no equivalent on the current platform.
- **Full react-native-permissions coverage** — Single permissions, bulk permissions, notifications, and iOS location accuracy. Everything is wrapped. You can still use native `PERMISSIONS.IOS.*` / `PERMISSIONS.ANDROID.*` if you need platform-specific control.
- **Tiny footprint** — No runtime dependencies beyond your existing peer deps. Tree-shakeable exports.
- **100% TypeScript** — Strict types, full inference, re-exported upstream types for convenience.

---

## Installation

```bash
npm install react-native-permissions-redux
# or
yarn add react-native-permissions-redux
```

### Peer Dependencies

These should already be in your project:

| Package | Version |
|---|---|
| `react` | >= 18 |
| `react-native` | >= 0.70 |
| `react-native-permissions` | >= 4 |
| `react-redux` | >= 9 |
| `@reduxjs/toolkit` | >= 2 |

---

## Quick Start

### 1. Add the reducer to your store

```ts
import { configureStore } from '@reduxjs/toolkit';
import { permissionsReducer, SLICE_NAME } from 'react-native-permissions-redux';

export const store = configureStore({
  reducer: {
    [SLICE_NAME]: permissionsReducer,
    // ...your other reducers
  },
});
```

### 2. Start the permission listener

Call this once at app startup (e.g., in your root component or entry file). It runs an initial sync immediately, then re-syncs every time the app returns to the foreground.

```ts
import {
  CrossPlatformPermission,
  startPermissionListener,
} from 'react-native-permissions-redux';

// Start listening — returns a teardown function
const stopListening = startPermissionListener(store, {
  permissions: [
    CrossPlatformPermission.CAMERA,
    CrossPlatformPermission.PHOTO_LIBRARY,
    CrossPlatformPermission.LOCATION_WHEN_IN_USE,
  ],
  notifications: true,
  locationAccuracy: true, // iOS 14+ only
});

// Call stopListening() if you ever need to tear down (e.g., logout)
```

### 3. Use hooks in your components

```tsx
import { CrossPlatformPermission, usePermission } from 'react-native-permissions-redux';

function CameraButton() {
  const [status, requestCamera] = usePermission(CrossPlatformPermission.CAMERA);

  if (status === 'granted') {
    return <OpenCameraButton />;
  }

  if (status === 'blocked') {
    return <Text>Camera access denied. Please enable it in Settings.</Text>;
  }

  return (
    <Button
      onPress={() => requestCamera()}
      title="Allow Camera Access"
    />
  );
}
```

```tsx
import { useNotificationPermission } from 'react-native-permissions-redux';

function NotificationBanner() {
  const [{ status, settings }, requestNotifications] = useNotificationPermission();

  if (status === 'granted') return null;

  return (
    <Banner
      message="Enable notifications to stay updated"
      onPress={() => requestNotifications(['alert', 'badge', 'sound'])}
    />
  );
}
```

That's it. The hooks read from Redux, so they re-render automatically when permissions change — including after the user returns from Settings.

---

## How It Works

```
User opens app
       │
       ▼
startPermissionListener()
       │
       ├──▶ Dispatches syncPermissions() immediately
       │
       └──▶ Subscribes to AppState changes
                │
                ▼
        App goes to background
        (user opens Settings, toggles permission)
                │
                ▼
        App returns to foreground
                │
                ▼
        AppState fires 'active'
                │
                ▼
        syncPermissions() dispatched automatically
                │
                ▼
        Redux state updated → components re-render
```

Since `react-native-permissions` is stateless (no event emitters), `AppState` is the only reliable way to detect when the user might have changed a permission. This library handles that subscription for you and keeps your Redux store as the single source of truth.

---

## Cross-Platform Permissions

Instead of scattering `PERMISSIONS.IOS.CAMERA` and `PERMISSIONS.ANDROID.CAMERA` throughout your codebase, use `CrossPlatformPermission` — a single enum that resolves to the correct native permission at runtime.

```tsx
import { CrossPlatformPermission, usePermission } from 'react-native-permissions-redux';

// Works on both iOS and Android — no Platform.select needed
const [status, request] = usePermission(CrossPlatformPermission.CAMERA);
```

### Available Cross-Platform Permissions

| CrossPlatformPermission | iOS | Android |
|---|---|---|
| `CAMERA` | `CAMERA` | `CAMERA` |
| `MICROPHONE` | `MICROPHONE` | `RECORD_AUDIO` |
| `PHOTO_LIBRARY` | `PHOTO_LIBRARY` | `READ_MEDIA_IMAGES` |
| `PHOTO_LIBRARY_WRITE` | `PHOTO_LIBRARY_ADD_ONLY` | `WRITE_EXTERNAL_STORAGE` |
| `CONTACTS_READ` | `CONTACTS` | `READ_CONTACTS` |
| `CONTACTS_WRITE` | `CONTACTS` | `WRITE_CONTACTS` |
| `CALENDAR_READ` | `CALENDARS` | `READ_CALENDAR` |
| `CALENDAR_WRITE` | `CALENDARS_WRITE_ONLY` | `WRITE_CALENDAR` |
| `LOCATION_WHEN_IN_USE` | `LOCATION_WHEN_IN_USE` | `ACCESS_FINE_LOCATION` |
| `LOCATION_ALWAYS` | `LOCATION_ALWAYS` | `ACCESS_BACKGROUND_LOCATION` |
| `BLUETOOTH` | `BLUETOOTH` | `BLUETOOTH_CONNECT` |
| `MOTION` | `MOTION` | `ACTIVITY_RECOGNITION` |
| `SPEECH_RECOGNITION` | `SPEECH_RECOGNITION` | — |
| `MEDIA_LIBRARY` | `MEDIA_LIBRARY` | — |
| `FACE_ID` | `FACE_ID` | — |
| `SIRI` | `SIRI` | — |
| `APP_TRACKING` | `APP_TRACKING_TRANSPARENCY` | — |
| `REMINDERS` | `REMINDERS` | — |
| `NOTIFICATIONS` | — | `POST_NOTIFICATIONS` |
| `PHONE_CALL` | — | `CALL_PHONE` |
| `READ_SMS` | — | `READ_SMS` |
| `SEND_SMS` | — | `SEND_SMS` |
| `BODY_SENSORS` | — | `BODY_SENSORS` |

A `—` means the permission has no equivalent on that platform. Checking or requesting it will return `'unavailable'` without touching the native module.

### Mixing cross-platform and native permissions

You can freely mix both styles. All hooks, thunks, selectors, and the listener accept either `CrossPlatformPermission` or native `Permission` strings:

```ts
startPermissionListener(store, {
  permissions: [
    CrossPlatformPermission.CAMERA,          // cross-platform
    PERMISSIONS.ANDROID.NEARBY_WIFI_DEVICES,  // native, Android-specific
  ],
});
```

### `resolvePermission(crossPlatformPermission)`

If you need to see what a cross-platform permission resolves to on the current platform:

```ts
import { resolvePermission, CrossPlatformPermission } from 'react-native-permissions-redux';

resolvePermission(CrossPlatformPermission.CAMERA);
// iOS:     'ios.permission.CAMERA'
// Android: 'android.permission.CAMERA'

resolvePermission(CrossPlatformPermission.FACE_ID);
// iOS:     'ios.permission.FACE_ID'
// Android: null
```

---

## API Reference

### Reducer & Constants

#### `permissionsReducer`

The slice reducer. Mount it at `[SLICE_NAME]` in your root reducer.

#### `SLICE_NAME`

The string `'permissions'`. Use this as the reducer key to ensure selectors work correctly.

### Actions

#### `reset()`

Resets all permission state back to initial values (empty statuses, null notifications/accuracy, listening = false).

#### `setListening(boolean)`

Manually control the listening flag. Normally managed by `startPermissionListener` — you shouldn't need this unless you're building a custom listener.

### Listener

#### `startPermissionListener(store, config) => () => void`

The main integration point. Subscribes to `AppState` and keeps your Redux store in sync.

**Parameters:**
- `store` — your Redux store instance
- `config` — what to track:
  - `permissions?` — `Permission[]` — which permissions to re-check
  - `notifications?` — `boolean` — whether to check notification status
  - `locationAccuracy?` — `boolean` — whether to check iOS location accuracy

**Returns:** a teardown function that unsubscribes from `AppState` and sets `listening` to `false`.

**Behavior:**
1. Sets `listening` to `true`
2. Dispatches `syncPermissions(config)` immediately
3. On every `AppState` transition from background/inactive to `'active'`, dispatches `syncPermissions(config)` again

### Hooks

#### `usePermission(permission)`

```ts
const [status, request, check] = usePermission(CrossPlatformPermission.CAMERA);
```

| Return | Type | Description |
|---|---|---|
| `status` | `PermissionStatus \| null` | Current status from the store (`null` if not yet checked) |
| `request` | `(rationale?) => Promise<PermissionStatus>` | Requests the permission and returns the result |
| `check` | `() => Promise<PermissionStatus>` | Checks the permission and returns the result |

#### `useNotificationPermission()`

```ts
const [state, request, check] = useNotificationPermission();
// state.status — PermissionStatus | null
// state.settings — NotificationSettings | null
```

| Return | Type | Description |
|---|---|---|
| `state` | `NotificationsState` | `{ status, settings }` |
| `request` | `(options: NotificationOption[]) => Promise<void>` | Requests notification permissions |
| `check` | `() => Promise<void>` | Checks notification permissions |

#### `useLocationAccuracy()`

```ts
const [state, request, check] = useLocationAccuracy();
// state.accuracy — 'full' | 'reduced' | null
```

| Return | Type | Description |
|---|---|---|
| `state` | `LocationAccuracyState` | `{ accuracy }` |
| `request` | `(purposeKey: string) => Promise<void>` | Requests full accuracy (iOS 14+) |
| `check` | `() => Promise<void>` | Checks current accuracy |

### Thunks

All thunks call the corresponding `react-native-permissions` function and update Redux state on fulfillment. You can dispatch them directly if you prefer thunks over hooks.

| Thunk | Argument | Upstream Call |
|---|---|---|
| `checkPermission` | `PermissionInput` | `RNP.check()` |
| `requestPermission` | `{ permission: PermissionInput, rationale? }` | `RNP.request()` |
| `checkMultiplePermissions` | `PermissionInput[]` | `RNP.checkMultiple()` |
| `requestMultiplePermissions` | `PermissionInput[]` | `RNP.requestMultiple()` |
| `checkNotifications` | — | `RNP.checkNotifications()` |
| `requestNotifications` | `{ options }` | `RNP.requestNotifications()` |
| `checkLocationAccuracy` | — | `RNP.checkLocationAccuracy()` |
| `requestLocationAccuracy` | `{ purposeKey }` | `RNP.requestLocationAccuracy()` |
| `syncPermissions` | `PermissionsConfig` | Bulk re-check of all configured items |

### Selectors

All selectors expect the root state to have the permissions slice mounted at `[SLICE_NAME]`.

| Selector | Returns | Description |
|---|---|---|
| `selectPermissionStatus(permission)` | `(state) => PermissionStatus \| null` | Factory selector for a single permission |
| `selectAllStatuses` | `Record<string, PermissionStatus>` | All tracked permission statuses |
| `selectNotifications` | `{ status, settings }` | Notification permission state |
| `selectLocationAccuracy` | `{ accuracy }` | Location accuracy state |
| `selectListening` | `boolean` | Whether the AppState listener is active |
| `selectLastSyncedAt` | `string \| null` | ISO timestamp of the last successful sync |

### Types

All types from `react-native-permissions` are re-exported for convenience:

```ts
import {
  CrossPlatformPermission,  // enum (value + type)
  resolvePermission,        // utility function
} from 'react-native-permissions-redux';

import type {
  Permission,               // native platform-specific permission string
  PermissionInput,          // Permission | CrossPlatformPermission
  PermissionStatus,
  Rationale,
  NotificationSettings,
  NotificationOption,
  LocationAccuracy,
  // Library-specific types:
  PermissionsState,
  PermissionsConfig,
  NotificationsState,
  LocationAccuracyState,
  RequestPermissionPayload,
  RequestNotificationsPayload,
  RequestLocationAccuracyPayload,
} from 'react-native-permissions-redux';
```

---

## Advanced Usage

### Using thunks directly (without hooks)

If you prefer dispatching thunks directly — for example, in a saga, middleware, or non-component code:

```ts
import {
  CrossPlatformPermission,
  requestPermission,
} from 'react-native-permissions-redux';

// In a thunk or component
const result = await dispatch(
  requestPermission({
    permission: CrossPlatformPermission.CAMERA,
    rationale: {
      title: 'Camera Permission',
      message: 'This app needs camera access to take photos.',
      buttonPositive: 'OK',
    },
  }),
).unwrap();

console.log(result.status); // 'granted' | 'denied' | 'blocked' | ...
```

### Using selectors directly

```ts
import { useSelector } from 'react-redux';
import {
  CrossPlatformPermission,
  selectPermissionStatus,
  selectLastSyncedAt,
} from 'react-native-permissions-redux';

function MyComponent() {
  const cameraStatus = useSelector(selectPermissionStatus(CrossPlatformPermission.CAMERA));
  const lastSync = useSelector(selectLastSyncedAt);
  // ...
}
```

### Checking multiple permissions at once

```ts
import {
  CrossPlatformPermission,
  checkMultiplePermissions,
} from 'react-native-permissions-redux';

await dispatch(
  checkMultiplePermissions([
    CrossPlatformPermission.CAMERA,
    CrossPlatformPermission.MICROPHONE,
    CrossPlatformPermission.PHOTO_LIBRARY,
  ]),
);

// All three statuses are now in the store — works on both platforms
```

---

## Contributing

```bash
# Install dependencies
npm install

# Run tests
npm test

# Lint
npm run lint

# Build
npm run build
```

---

## License

[MIT](./LICENSE)
