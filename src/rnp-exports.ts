import * as RNP from 'react-native-permissions';

export { openSettings } from 'react-native-permissions';

/**
 * Opens the iOS limited-library photo picker when available.
 * Requires a `react-native-permissions` version that exports `openPhotoPicker`.
 */
export function openPhotoPicker(): Promise<void> {
  const fn = (RNP as { openPhotoPicker?: () => Promise<void> }).openPhotoPicker;
  if (typeof fn !== 'function') {
    return Promise.reject(
      new Error(
        'openPhotoPicker is not available in this version of react-native-permissions. Use openSettings() or upgrade react-native-permissions.',
      ),
    );
  }
  return fn();
}
