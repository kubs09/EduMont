import { describe, beforeAll, test, expect } from '@jest/globals';
import { getUserChannel, getClassChannel } from '#backend/utils/realtimeChannels.js';

describe('realtimeChannels', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  test('getUserChannel returns a deterministic, opaque channel name', () => {
    const first = getUserChannel(47);
    const second = getUserChannel(47);

    expect(first).toBe(second);
    expect(first).toMatch(/^user:[0-9a-f]{32}$/);
    expect(first).not.toContain('47');
  });

  test('getClassChannel returns a deterministic, opaque channel name', () => {
    const first = getClassChannel(12);
    const second = getClassChannel(12);

    expect(first).toBe(second);
    expect(first).toMatch(/^class:[0-9a-f]{32}$/);
    expect(first).not.toContain('12');
  });

  test('different ids produce different channel names', () => {
    expect(getUserChannel(1)).not.toBe(getUserChannel(2));
    expect(getClassChannel(1)).not.toBe(getClassChannel(2));
  });

  test('the same numeric id produces different channels for user vs class scope', () => {
    expect(getUserChannel(5)).not.toBe(getClassChannel(5));
  });
});
