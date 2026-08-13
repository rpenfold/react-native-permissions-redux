import { isForegroundSyncTransition } from '../src/app-state';

describe('isForegroundSyncTransition', () => {
  it('syncs inactive → active by default', () => {
    expect(isForegroundSyncTransition('inactive', 'active')).toBe(true);
  });

  it('syncs background → active by default', () => {
    expect(isForegroundSyncTransition('background', 'active')).toBe(true);
  });

  it('does not sync active → active', () => {
    expect(isForegroundSyncTransition('active', 'active')).toBe(false);
  });

  it('backgroundToActive ignores inactive → active', () => {
    expect(
      isForegroundSyncTransition('inactive', 'active', 'backgroundToActive'),
    ).toBe(false);
  });

  it('backgroundToActive syncs background → active', () => {
    expect(
      isForegroundSyncTransition('background', 'active', 'backgroundToActive'),
    ).toBe(true);
  });
});
