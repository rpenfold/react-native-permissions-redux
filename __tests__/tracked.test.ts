import { trackedSetGrew } from '../src/tracked';

describe('trackedSetGrew', () => {
  it('detects newly added permissions', () => {
    expect(
      trackedSetGrew(
        { permissions: ['ios.permission.CAMERA'] as never },
        {
          permissions: [
            'ios.permission.CAMERA',
            'ios.permission.MICROPHONE',
          ] as never,
        },
      ),
    ).toBe(true);
  });

  it('ignores untrack and unchanged sets', () => {
    expect(
      trackedSetGrew(
        {
          permissions: [
            'ios.permission.CAMERA',
            'ios.permission.MICROPHONE',
          ] as never,
        },
        { permissions: ['ios.permission.CAMERA'] as never },
      ),
    ).toBe(false);
    expect(
      trackedSetGrew(
        { permissions: ['ios.permission.CAMERA'] as never },
        { permissions: ['ios.permission.CAMERA'] as never },
      ),
    ).toBe(false);
  });

  it('detects notifications and accuracy turning on', () => {
    expect(
      trackedSetGrew({ notifications: false }, { notifications: true }),
    ).toBe(true);
    expect(
      trackedSetGrew({ locationAccuracy: false }, { locationAccuracy: true }),
    ).toBe(true);
    expect(
      trackedSetGrew({ notifications: true }, { notifications: false }),
    ).toBe(false);
  });
});
