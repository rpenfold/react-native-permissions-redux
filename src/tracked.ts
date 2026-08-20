import type { PermissionsConfig } from './types';

/** True when the tracked set gained work that should be checked immediately. */
export function trackedSetGrew(
  previous: PermissionsConfig,
  next: PermissionsConfig,
): boolean {
  const prevPerms = previous.permissions ?? [];
  const nextPerms = next.permissions ?? [];
  const added = nextPerms.some((permission) => !prevPerms.includes(permission));
  const notificationsOn =
    !previous.notifications && Boolean(next.notifications);
  const accuracyOn =
    !previous.locationAccuracy && Boolean(next.locationAccuracy);
  return added || notificationsOn || accuracyOn;
}
