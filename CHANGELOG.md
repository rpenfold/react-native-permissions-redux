# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2026-08-19

### Fixed

- Saga foreground sync is coalesced through a sliding request channel and ignores completions after teardown (parity with the thunk path)
- Notification errors use the `NOTIFICATIONS` key so `selectPermissionError(NOTIFICATIONS)` sees sync / `checkNotifications` failures
- `check` / `request` of `NOTIFICATIONS` dual-writes `state.notifications` (status + settings)
- A failed `checkMultiple` no longer discards notifications (or other) results already fetched in the same batch
- Empty sync configs no longer stamp `lastSyncedAt`
- Saga tracked-set updates use `trackedSetGrew` and react to `setTrackedConfig`
- README listener vs saga API reference no longer shares Parameters/Returns
- Publish workflow typechecks and tests against react-native-permissions v5
- Listener `stop()` invalidates in-flight syncs so a late completion cannot write after teardown
- Saga-only hook fallbacks dispatch `syncFailed` when a native call throws, and location `refresh` records a partial `checkMultiple` error
- `selectLastError` is documented as the global most-recent failure (use `selectPermissionError` for per-key)
- Public exports `setTrackedConfig`, error-key constants, library actions, and `isNotificationsPermission` are documented
- Publish workflow requires the git tag to match `package.json` version
- `checkMultiple` / `requestMultiple` deduplicate native keys (iOS coarse + fine resolve to the same string)
- `requestMultiplePermissions` accepts `{ permissions, notificationsRationale? }` so a batch that includes `NOTIFICATIONS` can show an Android rationale
- Document that `reset()` is not listener/saga teardown, and that only one listener or saga should run at a time

## [0.1.1] - 2026-08-14

### Added

- `errors` map and `selectPermissionError` / `selectErrors` so a failed camera check is distinct from a failed notifications check
- Hooks fall back to core functions + library actions when thunk middleware is absent
- Immediate sync when `trackPermissions` (or notifications/accuracy tracking) adds work

### Fixed

- `CrossPlatformPermission.NOTIFICATIONS` now uses `checkNotifications` / `requestNotifications` on every platform (RNP v5-safe, works on iOS)
- `selectPermissionStatus` is cached per permission so `useSelector` does not allocate a new selector each render
- `startPermissionListener` restarts instead of stacking AppState subscriptions; a second saga fork is ignored while already listening

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
