# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
