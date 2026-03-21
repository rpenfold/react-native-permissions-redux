import { Platform } from 'react-native';
import { PERMISSIONS, RESULTS } from 'react-native-permissions';
import type { Permission, PermissionStatus } from 'react-native-permissions';

/**
 * Platform-agnostic permission identifiers.
 * Use these instead of `PERMISSIONS.IOS.*` / `PERMISSIONS.ANDROID.*`
 * and the library resolves the correct native permission at runtime.
 *
 * If a permission has no equivalent on the current platform,
 * check/request will return `'unavailable'` without hitting the native module.
 */
export enum CrossPlatformPermission {
  CAMERA = 'CAMERA',
  MICROPHONE = 'MICROPHONE',
  PHOTO_LIBRARY = 'PHOTO_LIBRARY',
  PHOTO_LIBRARY_WRITE = 'PHOTO_LIBRARY_WRITE',
  CONTACTS_READ = 'CONTACTS_READ',
  CONTACTS_WRITE = 'CONTACTS_WRITE',
  CALENDAR_READ = 'CALENDAR_READ',
  CALENDAR_WRITE = 'CALENDAR_WRITE',
  LOCATION_WHEN_IN_USE = 'LOCATION_WHEN_IN_USE',
  /** Android: `ACCESS_COARSE_LOCATION`. iOS: `LOCATION_WHEN_IN_USE` (same string as fine). */
  LOCATION_COARSE = 'LOCATION_COARSE',
  /** Android: `ACCESS_FINE_LOCATION`. iOS: `LOCATION_WHEN_IN_USE`. */
  LOCATION_FINE = 'LOCATION_FINE',
  LOCATION_ALWAYS = 'LOCATION_ALWAYS',
  BLUETOOTH = 'BLUETOOTH',
  MOTION = 'MOTION',
  SPEECH_RECOGNITION = 'SPEECH_RECOGNITION',
  MEDIA_LIBRARY = 'MEDIA_LIBRARY',
  FACE_ID = 'FACE_ID',
  SIRI = 'SIRI',
  APP_TRACKING = 'APP_TRACKING',
  REMINDERS = 'REMINDERS',
  NOTIFICATIONS = 'NOTIFICATIONS',
  PHONE_CALL = 'PHONE_CALL',
  READ_SMS = 'READ_SMS',
  SEND_SMS = 'SEND_SMS',
  BODY_SENSORS = 'BODY_SENSORS',
}

type PlatformMap = Partial<Record<CrossPlatformPermission, Permission | null>>;

const IOS_MAP: PlatformMap = {
  [CrossPlatformPermission.CAMERA]: PERMISSIONS.IOS.CAMERA,
  [CrossPlatformPermission.MICROPHONE]: PERMISSIONS.IOS.MICROPHONE,
  [CrossPlatformPermission.PHOTO_LIBRARY]: PERMISSIONS.IOS.PHOTO_LIBRARY,
  [CrossPlatformPermission.PHOTO_LIBRARY_WRITE]:
    PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY,
  [CrossPlatformPermission.CONTACTS_READ]: PERMISSIONS.IOS.CONTACTS,
  [CrossPlatformPermission.CONTACTS_WRITE]: PERMISSIONS.IOS.CONTACTS,
  [CrossPlatformPermission.CALENDAR_READ]: PERMISSIONS.IOS.CALENDARS,
  [CrossPlatformPermission.CALENDAR_WRITE]:
    PERMISSIONS.IOS.CALENDARS_WRITE_ONLY,
  [CrossPlatformPermission.LOCATION_WHEN_IN_USE]:
    PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
  [CrossPlatformPermission.LOCATION_COARSE]:
    PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
  [CrossPlatformPermission.LOCATION_FINE]: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
  [CrossPlatformPermission.LOCATION_ALWAYS]: PERMISSIONS.IOS.LOCATION_ALWAYS,
  [CrossPlatformPermission.BLUETOOTH]: PERMISSIONS.IOS.BLUETOOTH,
  [CrossPlatformPermission.MOTION]: PERMISSIONS.IOS.MOTION,
  [CrossPlatformPermission.SPEECH_RECOGNITION]:
    PERMISSIONS.IOS.SPEECH_RECOGNITION,
  [CrossPlatformPermission.MEDIA_LIBRARY]: PERMISSIONS.IOS.MEDIA_LIBRARY,
  [CrossPlatformPermission.FACE_ID]: PERMISSIONS.IOS.FACE_ID,
  [CrossPlatformPermission.SIRI]: PERMISSIONS.IOS.SIRI,
  [CrossPlatformPermission.APP_TRACKING]:
    PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY,
  [CrossPlatformPermission.REMINDERS]: PERMISSIONS.IOS.REMINDERS,
};

const ANDROID_MAP: PlatformMap = {
  [CrossPlatformPermission.CAMERA]: PERMISSIONS.ANDROID.CAMERA,
  [CrossPlatformPermission.MICROPHONE]: PERMISSIONS.ANDROID.RECORD_AUDIO,
  [CrossPlatformPermission.PHOTO_LIBRARY]:
    PERMISSIONS.ANDROID.READ_MEDIA_IMAGES,
  [CrossPlatformPermission.PHOTO_LIBRARY_WRITE]:
    PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
  [CrossPlatformPermission.CONTACTS_READ]: PERMISSIONS.ANDROID.READ_CONTACTS,
  [CrossPlatformPermission.CONTACTS_WRITE]: PERMISSIONS.ANDROID.WRITE_CONTACTS,
  [CrossPlatformPermission.CALENDAR_READ]: PERMISSIONS.ANDROID.READ_CALENDAR,
  [CrossPlatformPermission.CALENDAR_WRITE]: PERMISSIONS.ANDROID.WRITE_CALENDAR,
  [CrossPlatformPermission.LOCATION_WHEN_IN_USE]:
    PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
  [CrossPlatformPermission.LOCATION_COARSE]:
    PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
  [CrossPlatformPermission.LOCATION_FINE]:
    PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
  [CrossPlatformPermission.LOCATION_ALWAYS]:
    PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION,
  [CrossPlatformPermission.BLUETOOTH]: PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
  [CrossPlatformPermission.MOTION]: PERMISSIONS.ANDROID.ACTIVITY_RECOGNITION,
  [CrossPlatformPermission.NOTIFICATIONS]:
    PERMISSIONS.ANDROID.POST_NOTIFICATIONS,
  [CrossPlatformPermission.PHONE_CALL]: PERMISSIONS.ANDROID.CALL_PHONE,
  [CrossPlatformPermission.READ_SMS]: PERMISSIONS.ANDROID.READ_SMS,
  [CrossPlatformPermission.SEND_SMS]: PERMISSIONS.ANDROID.SEND_SMS,
  [CrossPlatformPermission.BODY_SENSORS]: PERMISSIONS.ANDROID.BODY_SENSORS,
};

const PLATFORM_MAPS: Record<string, PlatformMap> = {
  ios: IOS_MAP,
  android: ANDROID_MAP,
};

/**
 * Resolves a `CrossPlatformPermission` to the native `Permission` string
 * for the current platform, or `null` if there is no equivalent.
 */
export function resolvePermission(
  permission: CrossPlatformPermission,
): Permission | null {
  const map = PLATFORM_MAPS[Platform.OS];
  if (!map) return null;
  return map[permission] ?? null;
}

/**
 * Resolves a value that is either a native `Permission` string or a
 * `CrossPlatformPermission` enum. Returns `{ resolved, unavailable }`.
 * If `unavailable` is true, the caller should short-circuit with RESULTS.UNAVAILABLE.
 */
export function resolvePermissionInput(
  input: Permission | CrossPlatformPermission,
):
  | { resolved: Permission; unavailable: false }
  | { resolved: null; unavailable: true } {
  if (
    Object.values(CrossPlatformPermission).includes(
      input as CrossPlatformPermission,
    )
  ) {
    const resolved = resolvePermission(input as CrossPlatformPermission);
    if (resolved === null) {
      return { resolved: null, unavailable: true };
    }
    return { resolved, unavailable: false };
  }
  return { resolved: input as Permission, unavailable: false };
}

/** Sentinel status used when a permission has no mapping on the current platform. */
export const UNAVAILABLE_STATUS: PermissionStatus = RESULTS.UNAVAILABLE;
