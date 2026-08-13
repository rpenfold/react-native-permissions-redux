# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-13

### Added

- `lastError` on the permissions slice, `syncFailed`, and `selectLastError` so a failed check is distinct from "not checked yet"
- `trackPermissions` / `untrackPermissions` / `setNotificationsTracking` / `setLocationAccuracyTracking` so the tracked set can grow after the listener or saga starts
- `PermissionsConfig.syncOn` (`nonActiveToActive` | `backgroundToActive`) and optional `debounceMs`
- Re-exports of `openSettings` and `openPhotoPicker` for the `blocked` Settings path
- `requestNotifications` / `useNotificationPermission` now forward Android `rationale` (RNP v5; extra arg is ignored on v4)

### Fixed

- Foreground saga no longer dies on a transient native error (`listening` stays `true`)
- `eventChannel` uses `buffers.sliding(1)` so a foreground transition during an in-flight sync is not dropped
- Overlapping `syncPermissions` thunks cannot let a stale result overwrite a newer one
- `syncPermissionsCore` isolates per-call failures so one rejected check does not skip the rest
- `lastSyncedAt` is stamped in `syncCompleted.prepare` (pure reducer)
- `selectLocationForegroundCapability` is memoized with `createSelector`
- `CrossPlatformPermission.NOTIFICATIONS` no longer silently maps a missing RNP v5 `POST_NOTIFICATIONS` constant to `unavailable` without a warning

### Changed

- Foreground sync reads the tracked set from the store, not a closed-over config snapshot
- CI typechecks/tests against `react-native-permissions` v5 in addition to v4

## [0.0.4] - 2026-05-22

### Added

- `permissionForegroundSyncSaga` — foreground permission sync via redux-saga without thunk middleware
- `permissions-core` exports (`checkPermissionCore`, `syncPermissionsCore`, etc.) for saga or custom integrations
- Library actions (`statusChecked`, `statusesChecked`, `notificationsChecked`, `locationAccuracyChecked`, `syncCompleted`) for saga `put` updates
- `assertThunkMiddleware` and `THUNK_MIDDLEWARE_ERROR` for clearer errors when thunk middleware is missing
- `CrossPlatformPermission.BLUETOOTH_SCAN` (Android `BLUETOOTH_SCAN`; unavailable on iOS)
- Optional `redux-saga` peer dependency (`>=1.2`)
- README: store requirements, state-shape docs for opt-in `null` fields, `useEffect` listener example, saga quick start

### Changed

- Thunks dispatch shared library actions; slice updates use a single action surface
- Hooks throw a descriptive error when thunk middleware is absent
- `startPermissionListener` calls `assertThunkMiddleware` before dispatching

## [0.0.3] - (prior release)

Initial published versions with Redux Toolkit slice, hooks, thunks, cross-platform permissions, and `startPermissionListener`.
