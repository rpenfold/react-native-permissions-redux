import type { AppStateStatus } from 'react-native';
import type { ForegroundSyncOn } from './types';

export function isForegroundSyncTransition(
  previous: AppStateStatus,
  next: AppStateStatus,
  syncOn: ForegroundSyncOn = 'nonActiveToActive',
): boolean {
  if (next !== 'active') {
    return false;
  }
  if (syncOn === 'backgroundToActive') {
    return previous === 'background';
  }
  return previous !== 'active';
}
